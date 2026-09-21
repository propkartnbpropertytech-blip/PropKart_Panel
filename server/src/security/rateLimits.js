import rateLimit from "express-rate-limit";

export const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many submissions from this IP, please try again after 15 minutes.",
        errorCode: "RATE_LIMITED",
    },
});

export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 login attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts from this IP. Please try again after 15 minutes.",
        errorCode: "TOO_MANY_LOGIN_ATTEMPTS",
    },
});
