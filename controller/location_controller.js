// import axios from "axios";


// export const locationDetail = async (req, res) => {

//     if (!req.body || Object.keys(req.body).length === 0) {
//         return res.status(400).json({
//             status: 400,
//             message: "Request body is required"
//         });
//     }
//     const ip = req.body || {};

//     if (!ip) {
//         return res.status(401).json({
//             status: 401,
//             message: "Location parameters are missing"
//         });
//     }

//     try {
//         const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${long}`;
//         const response = await fetch(url, { headers: { 'User-Agent': 'nodejs-example' } });
//         const data = await response.json();
//         if (!data || !data.address) {
//             console.log('No address returned for coordinates');
//             return res.status(404).json({
//                 status: 404,
//                 message: "No address returned for coordinates"
//             });
//         }


//         const place = data.address;

//         res.status(200).json({
//             status: 200,
//             message: "Location details fetched",
//             data: {
//                 'country': place.country,
//                 'country_code': `${place.country_code.toUpperCase()}`,
//                 'state': place.state,
//                 'state_district': place.state_district,
//                 // 'city_district': place.city_district,
//                 // 'village': place.village,
//                 'county': place.county,
//                 'post_code': place.postcode,
//             }
//         });

//     } catch (error) {
//         res.status(500).json({
//             status: 500,
//             message: `Unable to fetch location details ${error}`
//         });
//     }
// };


import axios from "axios";

export const getClientIP = (req) =>
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.ip ||
    req.socket?.remoteAddress ||
    null;

export const locationDetail = async (req, res) => {
    // Validate request body
    // if (!req.params || !req.params.ip) {
    //     return res.status(400).json({
    //         status: 400,
    //         message: "IP address is required"
    //     });
    // }


    let ip = getClientIP(req)?.replace('::ffff:', '');
    console.log(`Location Param: ${ip}`)


    if (ip === "127.0.0.1" || ip === '::1') {
        ip = '8.8.8.8'
    }

    try {
        // Step 1: Get latitude & longitude from IP
        const ipApiUrl = `http://ip-api.com/json/${ip}?fields=status,lat,lon,message`;
        const ipResponse = await axios.get(ipApiUrl);

        if (ipResponse.data.status !== "success") {
            return res.status(404).json({
                status: 404,
                message: `Unable to get coordinates for IP: ${ipResponse.data.message || "Unknown error"}`
            });
        }

        const { lat, lon } = ipResponse.data;

        console.log(`Location Param: ${lat} ${lon}`)

        // Step 2: Get detailed location from Nominatim
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
        const nominatimResponse = await axios.get(nominatimUrl, {
            headers: { "User-Agent": "nodejs-example" }
        });

        const place = nominatimResponse.data.address;

        if (!place) {
            return res.status(404).json({
                status: 404,
                message: "No address returned for coordinates"
            });
        }

        // Step 3: Return combined location details
        res.status(200).json({
            status: 200,
            message: "Location details fetched successfully",
            data: {
                country: place.country,
                country_code: place.country_code?.toUpperCase(),
                state: place.state,
                state_district: place.state_district,
                county: place.county,
                post_code: place.postcode,
                // city: place.city || place.town || place.village
            }
        });

    } catch (error) {
        console.error("Error fetching location:", error.message);
        res.status(500).json({
            status: 500,
            message: `Unable to fetch location details: ${error.message}`
        });
    }
};
