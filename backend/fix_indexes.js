/**
 * One-time migration script: Drop stale unique indexes so Mongoose
 * can recreate them with the new `sparse: true` option.
 *
 * Run once:  node fix_indexes.js
 * Then restart the backend server.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

async function fixIndexes() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // --- users.username_1 (was unique, now unique+sparse) ---
    try {
        await db.collection('users').dropIndex('username_1');
        console.log('✅ Dropped users.username_1 index');
    } catch (e) {
        console.log('⚠️  users.username_1 — ' + e.message);
    }

    // --- hqs.name_1 (was unique, now unique+sparse) ---
    try {
        await db.collection('hqs').dropIndex('name_1');
        console.log('✅ Dropped hqs.name_1 index');
    } catch (e) {
        console.log('⚠️  hqs.name_1 — ' + e.message);
    }

    // --- holidays.date_1 (was unique, now unique+sparse) ---
    try {
        await db.collection('holidays').dropIndex('date_1');
        console.log('✅ Dropped holidays.date_1 index');
    } catch (e) {
        console.log('⚠️  holidays.date_1 — ' + e.message);
    }

    // Also drop any stale email_1 index on users (the original error)
    try {
        await db.collection('users').dropIndex('email_1');
        console.log('✅ Dropped users.email_1 index');
    } catch (e) {
        console.log('⚠️  users.email_1 — ' + e.message);
    }

    console.log('\n🎉 Done! Restart your backend server to let Mongoose recreate indexes with sparse: true.');
    await mongoose.disconnect();
}

fixIndexes().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
