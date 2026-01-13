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

var b = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ4Mjg5MmZhMzJlY2QxM2E0ZTBhZWZlNjI4ZGQ5YWFlM2FiYThlMWUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoic291bHphYSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMQjZ3aWxHX3dCVVZRbnpXUFhDeGlEbkdoWEstdzlIakhhVmRhMGphUmpXanlGTEE9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vc291bHphYTIwMjUiLCJhdWQiOiJzb3VsemFhMjAyNSIsImF1dGhfdGltZSI6MTc2ODExOTA4NiwidXNlcl9pZCI6IkV2eEV2U0xhakdWdjVLVHNONFRSUUluTVkwaTIiLCJzdWIiOiJFdnhFdlNMYWpHVnY1S1RzTjRUUlFJbk1ZMGkyIiwiaWF0IjoxNzY4MTE5MDg4LCJleHAiOjE3NjgxMjI2ODgsImVtYWlsIjoic291bHphYS5wcm9qZWN0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTExMTI1NzE4MDM1OTkxNDk1OTQxIl0sImVtYWlsIjpbInNvdWx6YWEucHJvamVjdEBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.nukzMSV5gAT4A2QCOjYGY4grmOuyQlhlR3mFzc0WX3lbrsMlYT3BTI9xSKualTKJu4NFSPo97Gv6n4gloDLObxXRAWN_QeXymtVYFChYzmlhygPkm1geQigSxCK_VwdaMrHv3gXXj8qLhF49i8vW5sxnsNmQX8vrw-8mxS4T6cSoTPxiXBs--1ktsZ-SLgWK3wWE-64xOzyHwJ6mhIisoOJbcQJ--vnuaT695-XKIqzkluvagY-Imp3jsyMAT-Dw6tXwf7eX7Fr3MA5aaxDLDcctG3bMHr_whKNOgc_PpCLhTjFw8omEt7B3w0OwvkgZCWdRhB40SD-pVDQDYh30ww";
var a = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ4Mjg5MmZhMzJlY2QxM2E0ZTBhZWZlNjI4ZGQ5YWFlM2FiYThlMWUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiVmFyIEZyaSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJU19FMFdqdGQ4ZnN4cTNhaG1GR2VZY1FkbnREZnp2MVU2UGxkRGdveEUxemNFU1lPMT1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9zb3VsemFhMjAyNSIsImF1ZCI6InNvdWx6YWEyMDI1IiwiYXV0aF90aW1lIjoxNzY4MTIyNjYwLCJ1c2VyX2lkIjoiRm96THdIcUVwbmZJRll6U0tjbXV5S2IzYXNoMSIsInN1YiI6IkZvekx3SHFFcG5mSUZZelNLY211eUtiM2FzaDEiLCJpYXQiOjE3NjgxMjI2NjAsImV4cCI6MTc2ODEyNjI2MCwiZW1haWwiOiJ2djEzNzk0MUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjEwMjY1NjEzMjA2ODcxMTQwNzM1MCJdLCJlbWFpbCI6WyJ2djEzNzk0MUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.OHLT9-O0fK4quXcG0TIHUkE2aWX2CjVLNvzt5LcJLyXgDQIr8mhc0-j3Q5FaRQcFTazE_gAppn7LRuouPdWuJmODzy368Y9o_t9XLSjnRgoPrJ8y-OLVIwqK9eGC2_NCkrturmjZFXMMHmH3uAYa4YZ1QXwvYFs_Kv3tvGmG6OXg1Jwl5nYAWg1r1FFDEMisOsGKR7y9VjBQFhDtoOa3jEcjOlRz2mjuoAacD8aiTNZbe6EBxyPXu4KTYWYXgknULWdz3BQJVM28axF6jN0GZVZntc_-LdgCQRuZ1vqm7uRcdiEDO83ymDkz4fkHEw9qBu5pjQHI1VKVSim69g0_DA";
var x = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ4Mjg5MmZhMzJlY2QxM2E0ZTBhZWZlNjI4ZGQ5YWFlM2FiYThlMWUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiVmFyIEZyaSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJU19FMFdqdGQ4ZnN4cTNhaG1GR2VZY1FkbnREZnp2MVU2UGxkRGdveEUxemNFU1lPMT1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9zb3VsemFhMjAyNSIsImF1ZCI6InNvdWx6YWEyMDI1IiwiYXV0aF90aW1lIjoxNzY4MTIyNDE2LCJ1c2VyX2lkIjoiRm96THdIcUVwbmZJRll6U0tjbXV5S2IzYXNoMSIsInN1YiI6IkZvekx3SHFFcG5mSUZZelNLY211eUtiM2FzaDEiLCJpYXQiOjE3NjgxMjI0MTYsImV4cCI6MTc2ODEyNjAxNiwiZW1haWwiOiJ2djEzNzk0MUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjEwMjY1NjEzMjA2ODcxMTQwNzM1MCJdLCJlbWFpbCI6WyJ2djEzNzk0MUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.WO1Zi4kYoqGZVqbCAqYaC0G33lCOgPbm-Q2XF2De2sSdDnNG1EJ5z5Th5gVk6DPqei7LBftwVoattgeA4VDfywz4M_dBpDIxZkPRb0KMZCoaIXosKbbUAyr31Ux2mAM91r8eBxn1te5dXXXj2F75BmO7lrB6-03XtfQ2t7JwftaL445AUaOdYNUKrLbrkSVWMUAHY4me1NAGU9NwlnmjbDfSjK4JG";