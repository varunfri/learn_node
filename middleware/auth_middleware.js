import admin from "../utils/firebaseAdmin.js";
import jwt from "jsonwebtoken";


export const authorize = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 401,
            message: "Not authenticated",
        });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            status: 401,
            message: `Invalid token ${error}`
        });
    }
};

export const authority = (requiredAuthority) => {
    return (req, res, next) => {
        // 1. Check if user is even logged in
        if (!req.user) {
            return res.status(401).json({
                status: 401,
                message: "Unauthorized access"
            });
        }

        // 2. Check if they have the specific authority
        if (req.user.authorities && req.user.authorities.includes(requiredAuthority)) {
            return next(); // Permission granted
        }

        // 3. Deny access if authority is missing
        return res.status(403).json({
            status: 403,
            message: "Forbidden no access"
        });
    };
};


export const authFirebase = async (req, res, next) => {
    const authHeader = req.get('X-Firebase-Token') || "";
    const idToken = authHeader.startsWith("Bearer ")
        ? authHeader.split("Bearer ")[1]
        : null;


    if (!idToken) {
        return res.status(401).json({
            status: 401,
            message: "idToken is missing"
        });
    }

    try {
        const decode = await admin.auth().verifyIdToken(idToken);
        req.firebase_user = decode;
        next();
    } catch (error) {
        res.status(401).json({
            status: 401,
            message: "Invalid token or token expired"
        });
    }

};