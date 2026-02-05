const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./core/errorHandler');

const cookieParser = require('cookie-parser');

const app = express();

// Basic Logger
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`, req.body && Object.keys(req.body).length > 0 ? req.body : '');

    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[RES] ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 100
});
app.use(limiter);

// Routes
app.get('/', (req, res) => {
    res.send('Field ERP API is running...');
});

// Mount routers
app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/doctors', require('./modules/doctor/doctor.routes'));
app.use('/api/v1/employees', require('./modules/employee/employee.routes'));
app.use('/api/v1/call-reports', require('./modules/callReport/call.routes'));
app.use('/api/v1/expenses', require('./modules/expense/expense.routes'));
app.use('/api/v1/chemists', require('./modules/chemist/chemist.routes'));
app.use('/api/v1/hqs', require('./modules/hq/hq.routes'));
app.use('/api/v1/routes', require('./modules/route/route.routes'));

// Make uploads folder static
app.use('/uploads', express.static('uploads'));

app.use('/api/v1/operations', require('./modules/stockist/stockist_target.routes'));
app.use('/api/v1/inventory', require('./modules/inventory/inventory.routes'));

// New modules
app.use('/api/v1/leave', require('./modules/leave/leave.routes'));
app.use('/api/v1/analytics', require('./modules/analytics/analytics.routes'));
app.use('/api/v1/salary', require('./modules/salary/salary.routes'));
app.use('/api/v1/stockists', require('./modules/stockist/stockist.routes'));
app.use('/api/v1/holidays', require('./modules/holiday/holiday.routes'));
app.use('/api/v1/admin', require('./modules/admin-tools/import.routes'));
app.use('/api/v1/notifications', require('./modules/notification/notification.routes'));

// ... other routes

// Error Handler
app.use(errorHandler);

module.exports = app;
