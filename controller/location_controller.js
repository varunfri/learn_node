
export const locationDetail = async (req, res) => {

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            status: 400,
            message: "Request body is required"
        });
    }
    const { lat, long } = req.body || {};

    if (!lat || !long) {
        return res.status(401).json({
            status: 401,
            message: "Location parameters are missing"
        });
    }

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${long}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'nodejs-example' } });
        const data = await response.json();
        if (!data || !data.address) {
            console.log('No address returned for coordinates');
            return res.status(404).json({
                status: 404,
                message: "No address returned for coordinates"
            });
        }


        const place = data.address;

        res.status(200).json({
            status: 200,
            message: "Location details fetched",
            data: {
                'country': place.country,
                'country_code': `${place.country_code.toUpperCase()}`,
                'state': place.state,
                'state_district': place.state_district,
                // 'city_district': place.city_district,
                // 'village': place.village,
                'county': place.county,
                'post_code': place.postcode,
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 500,
            message: `Unable to fetch location details ${error}`
        });
    }
};
