/**
 * One-time script to clear ALL collections except the admin user.
 * Usage: node scripts/cleanDB.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/field_erp';

async function cleanDB() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    // 1. Find the admin user BEFORE clearing
    const usersCollection = db.collection('users');
    const adminUser = await usersCollection.findOne({ role: 'admin' });

    if (!adminUser) {
        console.error('ERROR: No admin user found! Aborting to be safe.');
        process.exit(1);
    }

    console.log(`Found admin user: ${adminUser.name} (${adminUser.username})`);

    // 2. Get all collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log(`\nCollections to clear: ${collectionNames.join(', ')}`);

    // 3. Clear each collection
    for (const name of collectionNames) {
        if (name === 'users') {
            // Delete all users EXCEPT admin
            const result = await db.collection(name).deleteMany({ _id: { $ne: adminUser._id } });
            console.log(`  users: Deleted ${result.deletedCount} non-admin users (kept admin)`);
        } else {
            const result = await db.collection(name).deleteMany({});
            console.log(`  ${name}: Deleted ${result.deletedCount} documents`);
        }
    }

    console.log('\nDatabase cleaned. Only admin user remains.');
    process.exit(0);
}

cleanDB().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
