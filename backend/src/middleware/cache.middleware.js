const { get, set } = require('../config/redis');

const cache = (duration = 3600) => async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
        const cachedResponse = await get(key);
        if (cachedResponse) {
            return res.json(cachedResponse);
        } else {
            // Intercept res.send/res.json to cache the response
            const originalSend = res.json;
            res.json = (body) => {
                set(key, body, duration);
                originalSend.call(res, body);
            };
            next();
        }
    } catch (err) {
        console.error('Cache Middleware Error:', err);
        next();
    }
};

module.exports = cache;
