const axios = require('axios');

/**
 * Get road distance between two place names using Nominatim (geocoding) + OSRM (routing)
 * Both are free, no API key required.
 * 
 * @param {string} placeA - Origin place name (e.g., "Jamshedpur")
 * @param {string} placeB - Destination place name (e.g., "Ranchi")
 * @returns {Promise<number>} - Road distance in km (0 if same place or error)
 */
async function getRoadDistance(placeA, placeB) {
    // Normalize
    const a = (placeA || '').trim().toLowerCase();
    const b = (placeB || '').trim().toLowerCase();

    // Same place = 0 distance
    if (a === b || !a || !b) {
        return 0;
    }

    try {
        // 1. Geocode both places using Nominatim
        const [coordsA, coordsB] = await Promise.all([
            geocodePlace(placeA),
            geocodePlace(placeB)
        ]);

        if (!coordsA || !coordsB) {
            console.error(`Geocoding failed: ${placeA} -> ${JSON.stringify(coordsA)}, ${placeB} -> ${JSON.stringify(coordsB)}`);
            return 0;
        }

        // 2. Get road distance using OSRM
        const distance = await getOSRMDistance(coordsA, coordsB);
        return distance;
    } catch (error) {
        console.error('Road distance calculation error:', error.message);
        return 0;
    }
}

/**
 * Geocode a place name to coordinates using Nominatim (OpenStreetMap)
 * @param {string} placeName 
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
async function geocodePlace(placeName) {
    try {
        // Add "India" to improve accuracy for Indian locations
        const query = `${placeName}, India`;
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: query,
                format: 'json',
                limit: 1
            },
            headers: {
                'User-Agent': 'ProjectX-FieldERP/1.0'
            }
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];

            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon)
            };
        }

        console.warn(`Geocoding returned no results for: ${placeName}`);
        return null;
    } catch (error) {
        console.error(`Geocoding error for "${placeName}":`, error.message);
        return null;
    }
}

/**
 * Get road distance between two coordinates using OSRM (free routing engine)
 * @param {{lat: number, lng: number}} origin 
 * @param {{lat: number, lng: number}} destination 
 * @returns {Promise<number>} - Distance in km
 */
async function getOSRMDistance(origin, destination) {
    try {
        // OSRM expects coordinates as lng,lat
        const url = `http://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;

        const response = await axios.get(url);

        if (response.data && response.data.routes && response.data.routes.length > 0) {
            const distanceMeters = response.data.routes[0].distance;
            const distanceKm = Math.round(distanceMeters / 1000); // Round to nearest km
            const durationMins = Math.round(response.data.routes[0].duration / 60);
            console.log(`OSRM Route: ${distanceKm} km, ~${durationMins} min`);
            return distanceKm;
        }


        return 0;
    } catch (error) {
        console.error('OSRM routing error:', error.message);
        return 0;
    }
}

module.exports = { getRoadDistance, geocodePlace, getOSRMDistance };
