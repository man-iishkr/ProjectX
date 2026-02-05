const User = require('../auth/auth.model');

// @desc    Create new employee (Admin/HQ?) - Usually Admin
// @route   POST /api/v1/employees
// @access  Private (Admin)
exports.createEmployee = async (req, res, next) => {
    try {
        // Force role to employee
        req.body.role = 'employee';

        // If HQ is creating, force HQ ID (if we allow HQ to create)
        // For now, assuming Admin creates all or assigns HQ

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

        // If Admin, get all (or filter by query)
        if (req.user.role === 'admin') {
            query = User.find({ role: 'employee' });
        }
        // If HQ, get only their employees
        else if (req.user.role === 'hq') {
            query = User.find({ role: 'employee', hq: req.user.hq });
        } else {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

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
