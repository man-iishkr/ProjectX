const Holiday = require('./holiday.model');

// @desc    Get all holidays
// @route   GET /api/v1/holidays
// @access  Private
exports.getHolidays = async (req, res, next) => {
    try {
        const holidays = await Holiday.find().sort({ date: 1 });

        res.status(200).json({
            success: true,
            count: holidays.length,
            data: holidays
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new holiday
// @route   POST /api/v1/holidays
// @access  Private (Admin)
exports.createHoliday = async (req, res, next) => {
    try {
        const holiday = await Holiday.create(req.body);

        res.status(201).json({
            success: true,
            data: holiday
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Holiday already exists on this date' });
        }
        next(err);
    }
};

// @desc    Delete holiday
// @route   DELETE /api/v1/holidays/:id
// @access  Private (Admin)
exports.deleteHoliday = async (req, res, next) => {
    try {
        const holiday = await Holiday.findById(req.params.id);

        if (!holiday) {
            return res.status(404).json({ success: false, error: 'Holiday not found' });
        }

        await holiday.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
