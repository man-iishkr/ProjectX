const jwt = require('jsonwebtoken');
const User = require('../modules/auth/auth.model');

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

/**
 * The designation hierarchy order (highest authority first)
 */
const ROLE_HIERARCHY = ['admin', 'sm', 'rsm', 'asm', 'bde'];

/**
 * Returns all subordinate User IDs for a given managerId by traversing the
 * reportingTo tree recursively. Used for access-scoped queries.
 * @param {string} managerId - the ObjectId of the manager
 * @param {boolean} includeSelf - include the managerId in returned set
 * @returns {Promise<string[]>} - flat array of subordinate ObjectId strings
 */
exports.getSubordinateIds = async (managerId, includeSelf = false) => {
    const result = includeSelf ? [managerId.toString()] : [];

    // Find all users who report directly to this manager
    const directReports = await User.find({ reportingTo: managerId }).select('_id');

    for (const report of directReports) {
        result.push(report._id.toString());
        // Recursively find their subordinates
        const nested = await exports.getSubordinateIds(report._id, false);
        result.push(...nested);
    }

    return result;
};

/**
 * Returns true if `targetUserId` is a subordinate of `managerId`
 */
exports.isSubordinate = async (managerId, targetUserId) => {
    const subs = await exports.getSubordinateIds(managerId, false);
    return subs.includes(targetUserId.toString());
};

/**
 * Returns the numeric rank of a role (lower = higher authority)
 */
exports.getRoleRank = (role) => ROLE_HIERARCHY.indexOf(role);

/**
 * Returns true if roleA has higher authority than roleB
 */
exports.isHigherRole = (roleA, roleB) => {
    return exports.getRoleRank(roleA) < exports.getRoleRank(roleB);
};
