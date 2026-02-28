const Doctor = require('../doctor/doctor.model');
const Expense = require('../expense/expense.model');
const Leave = require('../leave/leave.model');
const Inventory = require('../inventory/inventory.model');

// Helper to get month match expression
const getMonthMatchExpr = (field) => ({
    $expr: {
        $eq: [{ $month: field }, { $month: new Date() }]
    }
});

// @desc    Get dashboard notifications
// @route   GET /api/v1/notifications
// @access  Private (Admin)
exports.getNotifications = async (req, res, next) => {
    try {
        const { checkStock } = req.query; // Client flag to decide checking stock (optimization)

        // 1. Pending Approvals (Always check)
        const pendingDoctors = await Doctor.countDocuments({ approvalStatus: 'Pending' });
        const pendingExpenses = await Expense.countDocuments({ status: 'Pending' });
        const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

        // 2. Events (Birthdays/Anniversaries) in Current Month
        // Find doctors where month(dob) == current month OR month(dom) == current month
        const currentMonth = new Date().getMonth() + 1; // JS months are 0-indexed, Mongo is 1-indexed usually but $month returns 1-12

        const eventDoctors = await Doctor.find({
            $or: [
                { $expr: { $eq: [{ $month: '$dob' }, currentMonth] } },
                { $expr: { $eq: [{ $month: '$dom' }, currentMonth] } }
            ]
        }).select('name dob dom hq').populate('hq', 'name');

        const notifications = [];

        if (eventDoctors.length > 0) {
            notifications.push({
                id: 'doc_events',
                type: 'alert', // or 'info'
                message: `${eventDoctors.length} Doctor(s) have Birthdays/Anniversaries this month`,
                link: '/admin/doctors?filter=events', // Potentially add a filter query param
                count: eventDoctors.length,
                details: eventDoctors.map(d => {
                    const isBday = d.dob && new Date(d.dob).getMonth() === currentMonth - 1;
                    const type = isBday ? 'Birthday' : 'Anniversary';
                    const date = isBday ? d.dob : d.dom;
                    return `${d.name} (${type}: ${new Date(date).getDate()}/${currentMonth})`;
                })
            });
        }

        if (pendingDoctors > 0) {
            notifications.push({
                id: 'doc_pending',
                type: 'approval',
                message: `${pendingDoctors} Doctor(s) waiting for approval`,
                link: '/admin/doctors',
                count: pendingDoctors
            });
        }

        if (pendingExpenses > 0) {
            notifications.push({
                id: 'exp_pending',
                type: 'approval',
                message: `${pendingExpenses} Expense request(s) waiting for approval`,
                link: '/admin/expenses',
                count: pendingExpenses
            });
        }

        if (pendingLeaves > 0) {
            notifications.push({
                id: 'leave_pending',
                type: 'approval',
                message: `${pendingLeaves} Leave request(s) waiting for approval`,
                link: '/admin/leave',
                count: pendingLeaves
            });
        }

        // 2. Low Stock Alerts (Conditional check to optimize)
        // If checkStock is 'true' or not provided (default behavior to be safe, but frontend will control)
        if (checkStock === 'true') {
            const lowStockItems = await Inventory.find({ closingStock: { $lte: 10 } })
                .populate('product', 'name')
                .populate('stockist', 'name')
                .limit(50); // Limit to avoid massive payload

            if (lowStockItems.length > 0) {
                // Group by stockist maybe? Or just list them. 
                // Let's create a summary notification and detail details
                notifications.push({
                    id: 'low_stock',
                    type: 'alert',
                    message: `${lowStockItems.length} Product(s) have Low Stock (<10)`,
                    link: '/admin/inventory/stock',
                    count: lowStockItems.length,
                    details: lowStockItems.map(item => `${item.product?.name} (${item.closingStock}) @ ${item.stockist?.name}`)
                });
            }
        }

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });

    } catch (err) {
        next(err);
    }
};
