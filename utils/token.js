import jwt from "jsonwebtoken";

export const generateJwt = (payload) => {
    return jwt.sign(
        payload, process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRY
        }
    );
};

export const generateRefresh = (payload) => {
    return jwt.sign(
        payload,
        process.env.REFRESH_SECRET,
        {
            expiresIn: process.env.REFRESH_EXPIRY
        }
    );
};

export const buildAuthPayload = (rows) => {
    const roles = new Set();
    const authorities = new Set();

    for (const row of rows) {
        roles.add(row.role_name);
        authorities.add(row.authority_name);
    }

    return {
        roles: [...roles],
        authorities: [...authorities]
    };
};
