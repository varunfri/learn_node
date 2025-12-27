async function getAddressFromCoords(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'nodejs-example' } });
        const data = await response.json();

        if (!data || !data.address) {
            console.log('No address returned for coordinates');
            return;
        }

        const place = data.address;
        console.log(place);

        console.log("Full Address:", data.display_name || 'N/A');
        console.log("City:", data.address.city || data.address.town || data.address.village || 'N/A');
        console.log("Country:", data.address.country || 'N/A');
    } catch (error) {
        console.error("Error fetching address:", error);
    }
}

// Example usage
getAddressFromCoords(13.263433, 77.996188
);
// let x = "234asdfasg123dsa";

// console.log(x.slice(-5));

//code to get the username
// function generateUsername(firstName, firebaseUid):
//     base = normalize(firstName) or "user"
// suffix = firebaseUid[-5:]
// return base + "_" + suffix


