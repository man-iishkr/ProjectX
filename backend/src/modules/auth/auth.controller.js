const User = require('./auth.model');
const crypto = require('crypto');

// @desc    Register user (Admin only usually, or initial setup)
// @route   POST /api/v1/auth/register
// @access  Public (for initial setup) / Admin
exports.register = async (req, res, next) => {
    try {
        const { name, username, password, role, hq, reportingTo } = req.body;

        // Create user
        const user = await User.create({
            name,
            username,
            password,
            role,
            hq,
            reportingTo: reportingTo || null
        });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an username and password' });
        }

        // Check for user
        const user = await User.findOne({ username }).select('+password').populate('hq', 'name').populate('reportingTo', 'name designation role');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            console.log(`Login failed: Password incorrect for username: ${username}`);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Verify Role if provided (admin login vs employee login)
        if (req.body.role) {
            // 'admin' tab is exclusively for admin
            if (req.body.role === 'admin' && user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied. This login is for Admin only.'
                });
            }
        } else {
            // No role sent = employee login portal. Allow bde, sm, rsm, asm but NOT admin.
            const employeeRoles = ['bde', 'sm', 'rsm', 'asm'];
            if (!employeeRoles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied. Use the Admin Login portal.'
                });
            }
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('hq', 'name').populate('reportingTo', 'name designation role');
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        httpOnly: true,
        secure: true,          // Required for sameSite:'none' and HTTPS on Render
        sameSite: 'none'       // Required for cross-origin cookie (frontend ≠ backend domain)
    };

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                designation: user.designation,
                hq: user.hq,
                reportingTo: user.reportingTo
            }
        });
};
