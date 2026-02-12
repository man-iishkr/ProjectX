const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        connectTimeout: 5000, // 5 seconds timeout
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                console.log('Redis: Max retries exhausted. Disabling caching for this session.');
                return new Error('Max retries exhausted');
            }
            return Math.min(retries * 100, 3000);
        }
    }
});

client.on('error', (err) => console.error('Redis Client Error:', err.message));
client.on('connect', () => console.log('Redis: Connecting...'));
client.on('ready', () => console.log('Redis: Connected & Ready'));

(async () => {
    try {
        if (!client.isOpen) {
            await client.connect();
        }
    } catch (err) {
        console.error('Redis Connection Failed (Will bypass cache):', err.message);
    }
})();

const get = async (key) => {
    if (!client.isReady) return null; // Bypass if not connected
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error('Redis Get Error:', err);
        return null;
    }
};

const set = async (key, value, expiry = 3600) => {
    if (!client.isReady) return; // Bypass if not connected
    try {
        await client.set(key, JSON.stringify(value), { EX: expiry });
    } catch (err) {
        console.error('Redis Set Error:', err);
    }
};

const del = async (pattern) => {
    if (!client.isReady) return; // Bypass if not connected
    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
        }
    } catch (err) {
        console.error('Redis Delete Error:', err);
    }
};

module.exports = { client, get, set, del };
