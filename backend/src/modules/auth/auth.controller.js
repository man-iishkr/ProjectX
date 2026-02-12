const User = require('./auth.model');
const crypto = require('crypto');

// @desc    Register user (Admin only usually, or initial setup)
// @route   POST /api/v1/auth/register
// @access  Public (for initial setup) / Admin
exports.register = async (req, res, next) => {
    try {
        const { name, username, password, role, hq } = req.body;

        // Create user
        const user = await User.create({
            name,
            username,
            password,
            role,
            hq
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
        const user = await User.findOne({ username }).select('+password').populate('hq', 'name');

        if (!user) {

            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            console.log(`Login failed: Password incorrect for username: ${username}`);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Verify Role if provided (Restricts Admin/HQ/Employee specific logins)
        if (req.body.role && user.role !== req.body.role) {
            console.log(`Login failed: Role mismatch. Expected ${req.body.role}, found ${user.role}`);
            return res.status(403).json({
                success: false,
                error: `Access denied. This login is restricted to ${req.body.role}s only.`
            });
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
        const user = await User.findById(req.user.id).populate('hq', 'name');
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
        secure: process.env.NODE_ENV === 'production', // Ensure it's false in dev
        sameSite: 'lax' // Helps with navigation
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
                hq: user.hq
            }
        });
};
