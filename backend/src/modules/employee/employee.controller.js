const User = require('../auth/auth.model');
const { getSubordinateIds } = require('../../middleware/auth.middleware');

// @desc    Create new employee
// @route   POST /api/v1/employees
// @access  Private (Admin, SM, RSM, ASM)
exports.createEmployee = async (req, res, next) => {
    try {
        // Validate that the reporting manager has a higher role than the new employee
        if (req.body.reportingTo && req.body.role) {
            const manager = await User.findById(req.body.reportingTo);
            if (!manager) {
                return res.status(400).json({ success: false, error: 'Reporting manager not found' });
            }
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

// @desc    Get all employees (scoped by hierarchy)
// @route   GET /api/v1/employees
// @access  Private (Admin/SM/RSM/ASM)
exports.getEmployees = async (req, res, next) => {
    try {
        const status = req.query.status || 'active';

        // Base filter for active/past — always exclude admin
        let filter = { role: { $ne: 'admin' } };
        const now = new Date();
        if (status === 'active') {
            filter.$or = [
                { resignationDate: { $exists: false } },
                { resignationDate: null },
                { resignationDate: { $gt: now } }
            ];
        } else if (status === 'past') {
            filter.resignationDate = { $lte: now };
        }

        if (req.user.role === 'admin') {
            // Admin sees everyone, with optional HQ filter for data segmentation
            if (req.query.hq) {
                // Support both ObjectId match and HQ name string match
                // (some imported employees may have hq stored as string name, not ObjectId)
                const HQ = require('../hq/hq.model');
                const hqDoc = await HQ.findById(req.query.hq).select('name');
                const hqConditions = [{ hq: req.query.hq }];
                if (hqDoc) {
                    hqConditions.push({ hq: hqDoc.name });
                    hqConditions.push({ hq: hqDoc.name.toLowerCase() });
                }
                // Merge with existing $or if present
                if (filter.$or) {
                    filter = { $and: [{ $or: filter.$or }, { $or: hqConditions }, { role: { $ne: 'admin' } }] };
                } else {
                    filter.$or = hqConditions;
                }
            }
        } else {
            // SM/RSM/ASM: see only their subordinates
            const subordinateIds = await getSubordinateIds(req.user._id, false);
            filter._id = { $in: subordinateIds };
        }

        const employees = await User.find(filter)
            .populate('hq', 'name location')
            .populate('reportingTo', 'name designation');

        res.status(200).json({
            success: true,
            count: employees.length,
            data: employees
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get list of potential reporting managers (users with a higher role)
// @route   GET /api/v1/employees/managers
// @access  Private (Admin/SM/RSM/ASM)
exports.getPotentialManagers = async (req, res, next) => {
    try {
        const { forRole } = req.query; // The role of the employee being created

        // Roles that can BE a manager based on hierarchy
        const roleOrder = ['admin', 'sm', 'rsm', 'asm', 'bde'];
        const forRoleIdx = roleOrder.indexOf(forRole);

        // Valid managers are those with HIGHER authority (lower index)
        let managerRoles = ['admin'];
        if (forRoleIdx > 0) {
            managerRoles = roleOrder.slice(0, forRoleIdx);
        }

        let filter = { role: { $in: managerRoles } };

        // If non-admin making a request, only show managers within their own subordinate tree (or themselves)
        if (req.user.role !== 'admin') {
            const mySubIds = await getSubordinateIds(req.user._id, true); // include self
            filter._id = { $in: mySubIds, ...filter._id };
        }

        const managers = await User.find(filter).select('_id name designation role');

        res.status(200).json({
            success: true,
            data: managers
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
        const user = await User.findById(req.params.id)
            .populate('hq', 'name location')
            .populate('reportingTo', 'name designation');

        if (!user) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        // Access check: admin sees all, others can only see subordinates or self
        if (req.user.role !== 'admin') {
            const { isSubordinate } = require('../../middleware/auth.middleware');
            const isSub = await isSubordinate(req.user._id, req.params.id);
            const isSelf = req.user._id.toString() === req.params.id;
            if (!isSub && !isSelf) {
                return res.status(403).json({ success: false, error: 'Not authorized to view this employee' });
            }
        }

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
        const user = await User.findById(req.params.id).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Not authorized to update' });
        }

        // Apply all fields from body except password
        const { password, ...otherFields } = req.body;
        Object.assign(user, otherFields);

        // Only update password if a new one was explicitly provided (non-empty)
        if (password && password.trim() !== '') {
            user.password = password.trim();
            // The pre('save') hook will hash it automatically
        }

        await user.save({ validateModifiedOnly: true });

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
