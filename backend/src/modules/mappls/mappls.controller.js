const axios = require('axios');

// Cache token locally to avoid hitting limit
let cachedToken = null;
let tokenExpiry = null;

// @desc    Proxy MapmyIndia Places Search (AutoSuggest)
// @route   GET /api/v1/mappls/search
// @access  Private
exports.searchPlaces = async (req, res, next) => {
    try {
        const { query } = req.query;
        const apiKey = process.env.MAPPLS_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ success: false, error: 'MapmyIndia API Key not configured' });
        }

        if (!query) {
            return res.status(400).json({ success: false, error: 'Query parameter required' });
        }

        // Using the Legacy / REST API endpoint structure which typically uses the key in the path
        // URL: https://apis.mapmyindia.com/advancedmaps/v1/<key>/autosuggest?q=<query>
        const url = `https://apis.mapmyindia.com/advancedmaps/v1/${apiKey}/autosuggest`;

        const response = await axios.get(url, {
            params: { q: query }
        });

        res.status(200).json({ success: true, data: response.data.suggestedLocations || [] });

    } catch (err) {
        console.error('Mappls Proxy Error:', err.message);
        if (err.response) {
            console.error('Mappls Response Status:', err.response.status);
            console.error('Mappls Response Data:', JSON.stringify(err.response.data));
            return res.status(err.response.status).json({
                success: false,
                error: err.response.data || 'MapmyIndia API Error',
                details: err.message
            });
        }
        res.status(500).json({ success: false, error: 'Failed to fetch location suggestions', details: err.message });
    }
};

// @desc    Proxy MapmyIndia Place Details (Reverse Geo / eLoc)
// @route   GET /api/v1/mappls/details
// @access  Private
exports.getPlaceDetails = async (req, res, next) => {
    try {
        const { eloc } = req.query;
        const apiKey = process.env.MAPPLS_API_KEY;

        if (!apiKey || !eloc) {
            return res.status(400).json({ success: false, error: 'API Key or eLoc missing' });
        }

        // Place Details API
        // https://apis.mapmyindia.com/advancedmaps/v1/<key>/place_detail?place_id=<eLoc>
        const url = `https://apis.mapmyindia.com/advancedmaps/v1/${apiKey}/place_detail`;

        const response = await axios.get(url, {
            params: { place_id: eloc }
        });

        // The structure might vary, usually response.data.results[0]
        res.status(200).json({ success: true, data: response.data.results?.[0] || response.data });

    } catch (err) {
        console.error('Mappls Details Proxy Error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch place details' });
    }
};
