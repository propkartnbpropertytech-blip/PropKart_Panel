import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "propkart-forms-super-secret-jwt-key-2026";

export function signToken(payload, expiresIn = "7d") {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authorization token required.",
                errorCode: "UNAUTHORIZED",
            });
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
            errorCode: "INVALID_TOKEN",
        });
    }
};

export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized.",
            });
        }

        const userRole = req.user.role || "Telecaller";
        if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: role '${userRole}' does not have permission.`,
                errorCode: "FORBIDDEN",
            });
        }

        next();
    };
};
