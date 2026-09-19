import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import dynamicFormsRouter from "./modules/dynamic_forms/dynamic_forms.routes.js";
import authRouter from "./modules/auth/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Enable CORS for public Connect app & private Panel portal
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errorCode: err.errorCode || "INTERNAL_SERVER_ERROR",
        errors: err.errors || [],
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 PropKart Standalone Forms API running on http://0.0.0.0:${PORT}`);
});
