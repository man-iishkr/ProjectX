const User = require('../auth/auth.model');

// @desc    Create new employee (Admin/HQ?) - Usually Admin
// @route   POST /api/v1/employees
// @access  Private (Admin)
exports.createEmployee = async (req, res, next) => {
    try {
        // Force role to employee
        req.body.role = 'employee';

        // If HQ is creating, force HQ ID to their own
        if (req.user.role === 'hq') {
            req.body.hq = req.user.hq;
        }

        const user = await User.create(req.body);

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all employees
// @route   GET /api/v1/employees
// @access  Private (Admin/HQ)
exports.getEmployees = async (req, res, next) => {
    try {
        let query;

        const status = req.query.status || 'active'; // active, past, all

        let filter = { role: 'employee' };

        // Status Filter Logic
        const now = new Date();
        if (status === 'active') {
            filter.$or = [
                { resignationDate: { $exists: false } }, // Field doesn't exist
                { resignationDate: null },               // Field is null
                { resignationDate: { $gt: now } }        // Date is in future
            ];
        } else if (status === 'past') {
            filter.resignationDate = { $lte: now };      // Date is past or today
        }
        // 'all' passes no extra filter

        // If Admin, get all matching filter
        if (req.user.role === 'admin') {
            if (req.query.hq) {
                filter.hq = req.query.hq;
            }
        }
        // If HQ, get only their employees matching filter
        else if (req.user.role === 'hq') {
            filter.hq = req.user.hq;
        } else {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        query = User.find(filter);

        // Populate HQ details
        query = query.populate('hq', 'name location');

        const employees = await query;

        res.status(200).json({
            success: true,
            count: employees.length,
            data: employees
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single employee
// @route   GET /api/v1/employees/:id
// @access  Private
exports.getEmployee = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).populate('hq', 'name location');

        if (!user) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        // Access check
        if (req.user.role === 'hq' && user.hq.toString() !== req.user.hq.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized to view this employee' });
        }
        // Employee can view self? usually handled by /me

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update employee
// @route   PUT /api/v1/employees/:id
// @access  Private (Admin)
exports.updateEmployee = async (req, res, next) => {
    try {
        let user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        // Allow Admin to update 
        // HQ might be allowed to update some fields? For now Admin only
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Not authorized to update' });
        }

        user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete employee
// @route   DELETE /api/v1/employees/:id
// @access  Private (Admin)
exports.deleteEmployee = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Not authorized to delete' });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
