require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.MAPPLS_API_KEY;

if (!apiKey) {
    console.error('ERROR: MAPPLS_API_KEY is missing in .env');
    process.exit(1);
}

console.log(`Testing Key: ${apiKey.substring(0, 5)}...`);

async function testAutoSuggest() {
    try {
        const url = `https://apis.mapmyindia.com/advancedmaps/v1/${apiKey}/autosuggest`;
        console.log(`\nTesting AutoSuggest: ${url.replace(apiKey, 'HIDDEN_KEY')}`);
        const res = await axios.get(url, { params: { q: 'Delhi' } });
        console.log('✅ AutoSuggest Success:', res.status);
    } catch (err) {
        console.error('❌ AutoSuggest Failed:', err.response ? err.response.status : err.message);
        if (err.response && err.response.data) console.error('Data:', err.response.data);
    }
}

async function testGeoCode() {
    try {
        const url = `https://apis.mapmyindia.com/advancedmaps/v1/${apiKey}/geo_code`;
        console.log(`\nTesting GeoCode: ${url.replace(apiKey, 'HIDDEN_KEY')}`);
        const res = await axios.get(url, { params: { addr: 'New Delhi' } });
        console.log('✅ GeoCode Success:', res.status);
    } catch (err) {
        console.error('❌ GeoCode Failed:', err.response ? err.response.status : err.message);
        if (err.response && err.response.data) console.error('Data:', err.response.data);
    }
}

// Atlas API (Requires Token usually, but checking if Key works)
async function testAtlas() {
    try {
        const url = `https://atlas.mapmyindia.com/api/places/search/json`;
        console.log(`\nTesting Atlas (Trace): ${url}`);
        const res = await axios.get(url, {
            params: { query: 'Delhi' },
            headers: { 'Authorization': `Bearer ${apiKey}` } // Sometimes key works as token?
        });
        console.log('✅ Atlas Success:', res.status);
    } catch (err) {
        console.error('❌ Atlas Failed:', err.response ? err.response.status : err.message);
    }
}

(async () => {
    await testAutoSuggest();
    await testGeoCode();
    // await testAtlas();
})();
