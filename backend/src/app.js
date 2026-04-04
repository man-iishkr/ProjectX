const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./core/errorHandler');

const cookieParser = require('cookie-parser');

const app = express();

// Basic Logger
// Basic Logger
// app.use((req, res, next) => {
//     next();
// });

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 1000 // Increased for dev/testing
});
app.use(limiter);

// Routes
app.get('/', (req, res) => {
    res.send('Field ERP API is running...');
});

// Settings endpoint for Frontend consumption
app.get('/api/v1/settings', (req, res) => {
    res.json({
        COMPANY_NAME: process.env.COMPANY_NAME || 'Azott Pharmaceuticals Pvt Ltd',
        COMPANY_ADDRESS: process.env.COMPANY_ADDRESS || 'Mumbai, India'
    });
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
app.use('/api/v1/leaves', require('./modules/leave/leave.routes'));
app.use('/api/v1/analytics', require('./modules/analytics/analytics.routes'));
app.use('/api/v1/salary', require('./modules/salary/salary.routes'));
app.use('/api/v1/stockists', require('./modules/stockist/stockist.routes'));
app.use('/api/v1/holidays', require('./modules/holiday/holiday.routes'));
app.use('/api/v1/admin', require('./modules/admin-tools/import.routes'));
app.use('/api/v1/notifications', require('./modules/notification/notification.routes'));
app.use('/api/v1/mappls', require('./modules/mappls/mappls.routes'));
app.use('/api/v1/tour-programs', require('./modules/tourProgram/tourProgram.routes'));

// ... other routes

const path = require('path');
const fs = require('fs');

// Check if a compiled Frontend 'public' directory exists alongside the server bundle
const frontendPath = path.join(__dirname, 'public');
if (fs.existsSync(frontendPath)) {
    // Serve static files from the React build
    app.use(express.static(frontendPath));

    // Explicitly exclude API routes from Catch-All
    app.get(/^(?!\/api).+/, (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// Error Handler
app.use(errorHandler);

module.exports = app;
