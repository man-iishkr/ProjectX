const axios = require('axios');

// In-memory cache for token
let cachedToken = null;
let tokenExpiry = null;

let currentKeyIndex = 1;

const getAccessToken = async (forceSwitch = false) => {
    if (forceSwitch) {
        currentKeyIndex = currentKeyIndex === 1 ? 2 : 1;
        cachedToken = null;
        tokenExpiry = null;
    }

    // Check cache
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    const keys = [
        { id: process.env.MAPPLS_CLIENT_ID, secret: process.env.MAPPLS_CLIENT_SECRET },
        { id: process.env.MAPPLS_CLIENT_ID_2, secret: process.env.MAPPLS_CLIENT_SECRET_2 }
    ];

    let lastError = null;

    // Try up to 2 times (once per key)
    for (let attempts = 0; attempts < 2; attempts++) {
        const key = keys[currentKeyIndex - 1];

        if (!key.id || !key.secret) {
            console.warn(`MapmyIndia Key ${currentKeyIndex} is missing in ENV.`);
            currentKeyIndex = currentKeyIndex === 1 ? 2 : 1;
            continue;
        }

        const tokenUrl = 'https://outpost.mapmyindia.com/api/security/oauth/token';

        try {
            const response = await axios.post(tokenUrl,
                new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: key.id,
                    client_secret: key.secret
                }),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );

            const { access_token, expires_in } = response.data;
            cachedToken = access_token;
            // Expire 5 mins early just to be safe
            tokenExpiry = Date.now() + (expires_in * 1000) - (5 * 60 * 1000);

            return cachedToken;
        } catch (error) {
            lastError = error;
            console.error(`✗ Mappls Token Gen Error (Key ${currentKeyIndex}):`, error.response?.status, error.response?.data || error.message);
            // Switch key for the next attempt
            currentKeyIndex = currentKeyIndex === 1 ? 2 : 1;
        }
    }

    throw new Error('All MapmyIndia API keys failed. Last error: ' + (lastError?.message || 'No valid keys configured'));
};

// @desc    Get MapmyIndia Access Token (For Frontend SDKs)
// @route   GET /api/v1/mappls/token
// @access  Private
exports.getToken = async (req, res, next) => {
    try {
        const token = await getAccessToken();
        res.status(200).json({ success: true, access_token: token });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to generate token' });
    }
};

// Wrapper for MapmyIndia API calls with automatic key failover
const makeMapplsRequestWithFailover = async (urlConfig) => {
    let token = await getAccessToken();
    try {
        return await axios({
            ...urlConfig,
            headers: { ...urlConfig.headers, 'Authorization': `Bearer ${token}` }
        });
    } catch (err) {
        // If forbidden or rate limited, try switching to the secondary API key
        if (err.response && (err.response.status === 403 || err.response.status === 429)) {
            console.warn(`MapmyIndia API Limit or Invalid Token (Status ${err.response.status}), switching key and retrying...`);
            token = await getAccessToken(true); // forceSwitch
            return await axios({
                ...urlConfig,
                headers: { ...urlConfig.headers, 'Authorization': `Bearer ${token}` }
            });
        }
        throw err;
    }
};

const digipin = require('digipin');

// @desc    Proxy AutoSuggest (Using Backend Token)
// @route   GET /api/v1/mappls/search
exports.searchPlaces = async (req, res, next) => {
    try {
        const { query, location } = req.query; // location = "lat,lng" for bias

        if (!query) {
            // Return empty list if no query, prevent crash
            return res.status(200).json({ success: true, data: [] });
        }

        // Check for DigiPin (10 chars, typically alphanumeric/dashes depending on format)
        // Standard DigiPin is often X-Y-Z format or continuous. 
        // Let's assume input might be continuous or hyphenated.
        // The library usually expects raw string? Let's try.
        // The library decode function usually takes the pin.

        // Clean query to remove spaces/dashes for check
        const cleanQuery = query.replace(/[^a-zA-Z0-9]/g, '');

        // DigiPin Verification logic (Simple length check for now, can be improved)
        if (cleanQuery.length === 10) {
            try {
                const decoded = await digipin.decode(cleanQuery); // Attempt decode
                if (decoded && decoded.latitude && decoded.longitude) {
                    return res.status(200).json({
                        success: true,
                        data: [{
                            eLoc: cleanQuery, // Use DigiPin as ID
                            placeName: `DigiPin: ${query}`,
                            placeAddress: `Lat: ${decoded.latitude}, Lng: ${decoded.longitude}`,
                            latitude: decoded.latitude,
                            longitude: decoded.longitude,
                            type: 'DigiPin'
                        }]
                    });
                }
            } catch (dpError) {
                // Not a valid DigiPin, proceed to normal search
                // console.log('Not a DigiPin:', dpError.message);
            }
        }

        // Atlas AutoSuggest URL
        let url = `https://atlas.mapmyindia.com/api/places/search/json?query=${encodeURIComponent(query)}&region=IND`;
        if (location) {
            url += `&location=${location}`;
        }

        const response = await makeMapplsRequestWithFailover({ method: 'GET', url });

        res.status(200).json({ success: true, data: response.data.suggestedLocations || [] });
    } catch (err) {
        console.error('✗ Mappls Search Proxy Error:', err.response?.status, err.message);
        // Do not crash, return empty list
        res.status(200).json({ success: false, data: [], error: err.message });
    }
};

// @desc    Proxy Geocode / Reverse Geocode / Place Detail
exports.getPlaceDetails = async (req, res, next) => {
    try {
        const { eloc, lat, lng, address } = req.query; // Added address
        const token = await getAccessToken();

        let data = null;

        // 1. Try DigiPin (Offline Decode)
        if (eloc && eloc.length >= 10) { // DigiPin is usually 10 chars
            try {
                const cleanEloc = eloc.replace(/[^a-zA-Z0-9]/g, '');
                if (cleanEloc.length === 10) {
                    const decoded = await digipin.decode(cleanEloc);
                    if (decoded && decoded.latitude) {
                        return res.status(200).json({
                            success: true,
                            data: {
                                eLoc: eloc,
                                latitude: decoded.latitude,
                                longitude: decoded.longitude,
                                placeName: `DigiPin: ${eloc}`,
                                placeAddress: `Lat: ${decoded.latitude}, Lng: ${decoded.longitude}`
                            }
                        });
                    }
                }
            } catch (e) {
                // Ignore, treat as normal eLoc
            }
        }

        // 2. Try eLoc Resource (Most precise)
        if (eloc) {
            try {
                // Try 'eloc' parameter based endpoint (Legacy/Standard Atlas)
                // Note: The previous attempt with path param /places/${eloc} failed with 404.
                // Let's try the direct eloc query param if available or default to search with pod

                // Strategy: Use the 'place_detail' endpoint if we can find it,
                // BUT 'search' with 'pod' might work? No.
                // Let's try: https://atlas.mapmyindia.com/api/places/eloc?eloc=${eloc}
                const url = `https://atlas.mapmyindia.com/api/places/eloc?eloc=${eloc}`;
                const response = await makeMapplsRequestWithFailover({ method: 'GET', url });
                data = response.data;

            } catch (eLocError) {
                console.error('Mappls eLoc Lookup Failed:', eLocError.message);
                if (eLocError.response) {
                    console.error('eLoc Status:', eLocError.response.status);
                    console.error('eLoc Data:', JSON.stringify(eLocError.response.data));
                }
                // Fallback to Geocoding if address is provided
                if (address) {
                    try {
                        const geoUrl = `https://atlas.mapmyindia.com/api/places/geocode?address=${encodeURIComponent(address)}`;
                        const geoRes = await makeMapplsRequestWithFailover({ method: 'GET', url: geoUrl });

                        if (geoRes.data.copResults) {
                            data = geoRes.data.copResults;

                            // CRITICAL: copResults has eLoc but NO coordinates
                            // We need to use the eLoc to fetch coordinates from Place Detail API
                            if (data.eLoc) {
                                try {
                                    // Use the textsearch endpoint which returns coordinates
                                    const detailUrl = `https://atlas.mapmyindia.com/api/places/textsearch/json?query=${data.eLoc}&pod=eLoc`;
                                    const detailRes = await makeMapplsRequestWithFailover({ method: 'GET', url: detailUrl });

                                    if (detailRes.data && detailRes.data.suggestedLocations && detailRes.data.suggestedLocations.length > 0) {
                                        const location = detailRes.data.suggestedLocations[0];

                                        // Extract coordinates from the detail response
                                        if (location.latitude || location.eLat) {
                                            data.latitude = location.latitude || location.eLat;
                                            data.longitude = location.longitude || location.eLng;
                                        }
                                    }
                                } catch (detailErr) {
                                    console.error('Place Detail API failed:', detailErr.message);
                                }
                            }
                        } else {
                            data = geoRes.data.suggestedLocations?.[0] || geoRes.data.results?.[0];
                        }
                    } catch (geoErr) {
                        console.error('Mappls Geocode Error:', geoErr.message);
                    }
                }
            }
        }

        // 3. Final Fallback: Nominatim (OpenStreetMap)
        // If we still don't have data OR data is missing coordinates
        let hasCoords = data && (data.latitude || data.lat || (data.geometry && data.geometry.location));

        if ((!data || !hasCoords) && address) {
            const searchNominatim = async (queryAddress) => {
                try {
                    const osmRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                        params: {
                            q: queryAddress,
                            format: 'json',
                            limit: 1,
                            addressdetails: 1
                        },
                        headers: { 'User-Agent': 'CricketProjectX/1.0' }
                    });
                    return osmRes.data && osmRes.data.length > 0 ? osmRes.data[0] : null;
                } catch (e) {
                    console.error('Nominatim error for:', queryAddress, e.message);
                    return null;
                }
            };

            // Strategy 1: Full Address
            let osmData = await searchNominatim(address);

            // Strategy 2: Locality + City (if MapmyIndia gave us partial details but no coords)
            if (!osmData && data && (data.locality || data.city)) {
                const fallbackQuery = [data.locality, data.city, data.state].filter(Boolean).join(', ');
                if (fallbackQuery && fallbackQuery !== address) {
                    osmData = await searchNominatim(fallbackQuery);
                }
            }

            // Strategy 3: City + State (Last Resort)
            if (!osmData && data && data.city) {
                const cityQuery = [data.city, data.state].filter(Boolean).join(', ');
                if (cityQuery) {
                    osmData = await searchNominatim(cityQuery);
                }
            }

            // Strategy 4: Raw Parse of Address String (if MapmyIndia yielded nothing)
            if (!osmData && address) {
                const parts = address.split(',').map(p => p.trim());
                if (parts.length > 2) {
                    const simpleQuery = parts.slice(-3).join(', ');
                    if (simpleQuery) {
                        osmData = await searchNominatim(simpleQuery);
                    }
                }
            }

            if (osmData) {
                // console.log('Nominatim Success:', osmData.lat, osmData.lon);
                data = {
                    ...data,
                    latitude: parseFloat(osmData.lat),
                    longitude: parseFloat(osmData.lon),
                    placeName: data?.placeName || data?.poi || osmData.display_name.split(',')[0],
                    formattedAddress: data?.formattedAddress || osmData.display_name,
                    eLoc: data?.eLoc || `OSM-${osmData.place_id}`,
                    source: 'Nominatim',
                    confidence: 'High'
                };
            } else {
                // console.log('Nominatim All Strategies Failed.');
            }
        }

        // 4. Reverse Geocode (if lat/lng provided and no data yet)
        if (!data && lat && lng) {
            const url = `https://atlas.mapmyindia.com/api/places/rev_geocode?lat=${lat}&lng=${lng}`;
            const response = await makeMapplsRequestWithFailover({ method: 'GET', url });
            data = response.data.results?.[0];
        }

        // Normalize Data for Frontend
        // Normalize Data for Frontend
        if (data) {
            try {
                // Ensure latitude/longitude are present in standard fields
                if (!data.latitude && !data.lat) {
                    // Try to find them in nested objects if present
                    if (data.geometry && data.geometry.location) {
                        data.latitude = data.geometry.location.lat;
                        data.longitude = data.geometry.location.lng;
                    }
                }
                // If we have 'lat', copy to 'latitude' for consistency
                if (data.lat && !data.latitude) data.latitude = data.lat;
                if (data.lng && !data.longitude) data.longitude = data.lng;

                // Generate DigiPin for the found coordinates
                if (data.latitude && data.longitude) {
                    try {
                        // Ensure lat/lng are numbers
                        const latNum = parseFloat(data.latitude);
                        const lngNum = parseFloat(data.longitude);

                        if (!isNaN(latNum) && !isNaN(lngNum)) {
                            const generatedPin = await digipin.encode(latNum, lngNum);
                            if (generatedPin) {
                                data.digipin = generatedPin;
                            }
                        }
                    } catch (genError) {
                        console.error('DigiPin Generation Failed:', genError.message);
                    }
                }

                // Debug Log the final normalized data important fields

                res.status(200).json({ success: true, data: data });
            } catch (normError) {
                console.error('Normalization Error:', normError);
                // Return what we have even if normalization failed partly
                res.status(200).json({ success: true, data: data });
            }
        } else {
            res.status(404).json({ success: false, error: 'Location details not found' });
        }

    } catch (err) {
        console.error('Mappls Details Proxy Error Stack:', err.stack);
        res.status(500).json({ success: false, error: 'Details failed: ' + err.message });
    }
};
