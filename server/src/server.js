import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import dynamicFormsRouter from "./modules/dynamic_forms/dynamic_forms.routes.js";
import authRouter from "./modules/auth/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Trust reverse proxy (Traefik / Nginx) for accurate client IP identification in rate-limiting
app.set('trust proxy', 1);

// Security: Disable X-Powered-By header
app.disable("x-powered-by");

// Security Headers middleware
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

// Restrict CORS origins to official domains and trusted local dev
const allowedOrigins = [
    "https://propconnect.nbpropertytech.com",
    "https://panel.nbpropertytech.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:5050",
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith(".nbpropertytech.com")) {
            return callback(null, true);
        }
        return callback(new Error("CORS policy violation: Access denied."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Disposition"],
    credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded static files locally
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));
app.use("/forms-api/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// Health check endpoints
app.get(["/health", "/forms-api/health"], (req, res) => {
    res.status(200).json({
        status: "UP",
        service: "propkart-forms-api",
        timestamp: new Date().toISOString(),
    });
});

app.get(["/api/v1/health", "/forms-api/api/v1/health"], (req, res) => {
    res.status(200).json({
        status: "UP",
        service: "propkart-forms-api",
        timestamp: new Date().toISOString(),
    });
});

// API Routes (supports direct port 5050 and Traefik reverse-proxied /forms-api)
app.use("/forms-api/api/v1/auth", authRouter);
app.use("/forms-api/api/v1", dynamicFormsRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1", dynamicFormsRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
        errorCode: "NOT_FOUND",
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled API Error:", err);
    const statusCode = err.status || err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === "production";

    // In production, never leak internal database or system error details
    const message = (isProduction && statusCode >= 500)
        ? "An internal server error occurred. Please try again later."
        : (err.message || "Internal Server Error");

    res.status(statusCode).json({
        success: false,
        message,
        errorCode: err.errorCode || "INTERNAL_SERVER_ERROR",
        errors: isProduction && statusCode >= 500 ? [] : (err.errors || []),
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 PropKart Standalone Forms API running on http://0.0.0.0:${PORT}`);
});
