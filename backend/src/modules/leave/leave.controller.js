const Leave = require('./leave.model');

// Get all leave requests (admin/hq can see all, employee sees own)
exports.getAllLeaves = async (req, res) => {
    try {
        const { role, userId } = req.user;

        let query = {};
        if (role === 'employee') {
            // For employees, filter by userId directly since 'employee' field in Leave references User
            query.employee = userId;
        }

        const leaves = await Leave.find(query)
            .populate('employee', 'name email employeeId')
            .populate('approvedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaves', error: error.message });
    }
};

// Get leave by ID
exports.getLeaveById = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id)
            .populate('employee', 'name email employeeId')
            .populate('approvedBy', 'name email');

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leave', error: error.message });
    }
};

// Create leave request
const fs = require('fs');
const path = require('path');

exports.createLeave = async (req, res) => {
    const logFile = path.join(__dirname, '../../../backend_debug.log');
    const log = (msg) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

    try {
        log(`Creating Leave - Body: ${JSON.stringify(req.body)}`);
        const { employeeId, leaveType, startDate, endDate, reason, attachments } = req.body;

        // Validate dates
        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: 'Start date must be before end date' });
        }

        log('Instantiating Leave Model...');
        const leave = new Leave({
            employee: employeeId,
            leaveType,
            startDate,
            endDate,
            reason,
            attachments: attachments || []
        });

        log('Saving Leave...');
        await leave.save();
        log('Leave Saved. Populating...');
        await leave.populate('employee', 'name email employeeId');
        log('Populated. Sending response.');

        res.status(201).json({ message: 'Leave request created', leave });
    } catch (error) {
        log(`Error in createLeave: ${error.message} \nStack: ${error.stack}`);
        console.error('Error in createLeave:', error);
        res.status(500).json({ message: 'Error creating leave', error: error.message });
    }
};

// Update leave request (only if pending)
exports.updateLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot update non-pending leave' });
        }

        const { leaveType, startDate, endDate, reason, attachments } = req.body;

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: 'Start date must be before end date' });
        }

        if (leaveType) leave.leaveType = leaveType;
        if (startDate) leave.startDate = startDate;
        if (endDate) leave.endDate = endDate;
        if (reason) leave.reason = reason;
        if (attachments) leave.attachments = attachments;

        await leave.save();
        await leave.populate('employee', 'name email employeeId');

        res.json({ message: 'Leave updated', leave });
    } catch (error) {
        res.status(500).json({ message: 'Error updating leave', error: error.message });
    }
};

// Approve leave (admin/hq only)
exports.approveLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({ message: 'Leave is not pending' });
        }

        leave.status = 'approved';
        leave.approvedBy = req.user.userId;
        leave.approvedAt = Date.now();

        await leave.save();

        // Update Salary Record (Leaves Count)
        const startDate = new Date(leave.startDate);
        const month = startDate.getMonth() + 1;
        const year = startDate.getFullYear();

        const Salary = require('../salary/salary.model');
        const User = require('../auth/auth.model'); // To get base salary if creating new

        // Calculate Days
        const diffTime = Math.abs(new Date(leave.endDate) - new Date(leave.startDate));
        const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        let salary = await Salary.findOne({
            employee: leave.employee._id || leave.employee, // Handle populated or ID
            'period.month': month,
            'period.year': year
        });

        if (!salary) {
            const employee = await User.findById(leave.employee._id || leave.employee);
            if (employee) {
                salary = await Salary.create({
                    employee: leave.employee._id || leave.employee,
                    period: { month, year },
                    baseSalary: employee.monthlyPay || 0,
                    workingDays: { leaves: durationDays }
                });
            }
        } else {
            salary.workingDays.leaves += durationDays;
            await salary.save();
        }
        await leave.populate(['employee', 'approvedBy']);

        res.json({ message: 'Leave approved', leave });
    } catch (error) {
        res.status(500).json({ message: 'Error approving leave', error: error.message });
    }
};

// Reject leave (admin/hq only)
exports.rejectLeave = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({ message: 'Leave is not pending' });
        }

        leave.status = 'rejected';
        leave.approvedBy = req.user.userId;
        leave.approvedAt = Date.now();
        leave.rejectionReason = rejectionReason || 'No reason provided';

        await leave.save();
        await leave.populate(['employee', 'approvedBy']);

        res.json({ message: 'Leave rejected', leave });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting leave', error: error.message });
    }
};

// Cancel leave (employee can cancel their own)
exports.cancelLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (leave.status === 'cancelled') {
            return res.status(400).json({ message: 'Leave is already cancelled' });
        }

        leave.status = 'cancelled';

        await leave.save();
        await leave.populate('employee', 'name email employeeId');

        res.json({ message: 'Leave cancelled', leave });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling leave', error: error.message });
    }
};

// Delete leave
exports.deleteLeave = async (req, res) => {
    try {
        const leave = await Leave.findByIdAndDelete(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        res.json({ message: 'Leave deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting leave', error: error.message });
    }
};

// Get leave statistics
exports.getLeaveStats = async (req, res) => {
    try {
        const { employeeId } = req.query;
        const year = req.query.year || new Date().getFullYear();

        const query = {
            startDate: {
                $gte: new Date(`${year}-01-01`),
                $lte: new Date(`${year}-12-31`)
            }
        };

        if (employeeId) {
            query.employee = employeeId;
        }

        const leaves = await Leave.find(query);

        const stats = {
            total: leaves.length,
            pending: leaves.filter(l => l.status === 'pending').length,
            approved: leaves.filter(l => l.status === 'approved').length,
            rejected: leaves.filter(l => l.status === 'rejected').length,
            byType: {
                sick: leaves.filter(l => l.leaveType === 'sick').length,
                casual: leaves.filter(l => l.leaveType === 'casual').length,
                earned: leaves.filter(l => l.leaveType === 'earned').length,
                unpaid: leaves.filter(l => l.leaveType === 'unpaid').length,
                emergency: leaves.filter(l => l.leaveType === 'emergency').length
            }
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
};
