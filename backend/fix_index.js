const mongoose = require('mongoose');

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/field_erp');
        console.log('Connected to DB');

        const collection = mongoose.connection.collection('routes');
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        const indexName = 'from_1_to_1_hq_1';
        const exists = indexes.find(i => i.name === indexName);

        if (exists) {
            console.log(`Dropping index: ${indexName}`);
            await collection.dropIndex(indexName);
            console.log('Index dropped successfully');
        } else {
            console.log('Index does not exist');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
