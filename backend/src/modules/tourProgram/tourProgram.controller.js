const TourProgram = require('./tourProgram.model');
const User = require('../auth/auth.model');

// Upsert a tour program (Create or Update Draft)
exports.upsertTourProgram = async (req, res) => {
    try {
        const { year, month, dailyPlans, status } = req.body;
        const employeeId = req.user.id;

        if (!year || !month || !dailyPlans) {
            return res.status(400).json({ message: 'Missing required fields: year, month, dailyPlans' });
        }

        let program = await TourProgram.findOne({
            employee: employeeId,
            'period.year': year,
            'period.month': month
        });

        if (program && ['Pending', 'Approved'].includes(program.status) && status === 'Draft') {
            return res.status(400).json({ message: 'Cannot convert a Pending or Approved program back to Draft directly.' });
        }

        if (program) {
            // Update existing
            program.dailyPlans = dailyPlans;
            if (status) program.status = status;
            await program.save();
        } else {
            // Create new
            program = new TourProgram({
                employee: employeeId,
                period: { year, month },
                dailyPlans,
                status: status || 'Draft'
            });
            await program.save();
        }

        res.json({ success: true, message: 'Tour program saved successfully', data: program });
    } catch (error) {
        console.error('Error in upsertTourProgram:', error);
        res.status(500).json({ message: 'Error saving tour program', error: error.message });
    }
};

// Get logged-in employee's tour programs
exports.getMyTourPrograms = async (req, res) => {
    try {
        const { year, month } = req.query;
        let query = { employee: req.user.id };

        if (year) query['period.year'] = parseInt(year);
        if (month) query['period.month'] = parseInt(month);

        const programs = await TourProgram.find(query)
            .populate('approvedBy', 'name role')
            .sort({ 'period.year': -1, 'period.month': -1 });

        res.json({ success: true, data: programs });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tour programs', error: error.message });
    }
};

// Get tour programs for approval (Managers/Admins)
exports.getTourProgramsForApproval = async (req, res) => {
    try {
        const { year, month, status, employeeId } = req.query;
        let query = {};

        // Role-based filtering
        if (req.user.role !== 'admin') {
            // Managers can only see programs for their direct descendants
            // We fetch the subordinate IDs from DB
            const subordinates = await User.find({ reportingTo: req.user.id }).select('_id');
            const subordinateIds = subordinates.map(sub => sub._id);
            query.employee = { $in: subordinateIds };
        }

        if (employeeId) {
            // If requesting a specific employee, ensure they have access
            if (query.employee && query.employee.$in && !query.employee.$in.some(id => id.toString() === employeeId)) {
                return res.status(403).json({ message: 'Unauthorized access to this employee tour program' });
            }
            query.employee = employeeId;
        }

        if (year) query['period.year'] = parseInt(year);
        if (month) query['period.month'] = parseInt(month);
        if (status) query.status = status;

        const programs = await TourProgram.find(query)
            .populate('employee', 'name employeeId role designation city')
            .populate('approvedBy', 'name role')
            .sort({ 'period.year': -1, 'period.month': -1 });

        res.json({ success: true, data: programs });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching approval list', error: error.message });
    }
};

// Update tour program status (Approve/Reject)
exports.updateTourStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const programId = req.params.id;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const program = await TourProgram.findById(programId).populate('employee');
        if (!program) {
            return res.status(404).json({ message: 'Tour program not found' });
        }

        // Check auth for non-admins
        if (req.user.role !== 'admin') {
            if (program.employee.reportingTo && program.employee.reportingTo.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to approve this tour program' });
            }
        }

        program.status = status;
        program.remarks = remarks || '';
        program.approvedBy = req.user.id;
        program.approvalDate = new Date();

        await program.save();

        await program.populate('approvedBy', 'name role');

        res.json({ success: true, message: `Tour program ${status.toLowerCase()}`, data: program });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Error updating tour program status', error: error.message });
    }
};
