import { Router } from "express";
import supabase from "../../config/supabase.js";
import { signToken, authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

/**
 * POST /api/v1/auth/login
 * Standalone login for Telecallers & Admins
 */
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
                errorCode: "EMAIL_REQUIRED",
            });
        }

        // Fetch user from database
        const { data: user, error } = await supabase
            .from("users")
            .select("id, email, full_name, mobile, role_id, is_active, roles(name)")
            .eq("email", email.trim().toLowerCase())
            .maybeSingle();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials.",
                errorCode: "INVALID_CREDENTIALS",
            });
        }

        const roleName = user.roles?.name || "Telecaller";

        // Generate standalone JWT token
        const accessToken = signToken({
            id: user.id,
            userId: user.id,
            email: user.email,
            fullName: user.full_name,
            role: roleName,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            accessToken,
            data: {
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    mobile: user.mobile,
                    role: roleName,
                },
            },
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/v1/auth/me
 * Current authenticated user profile
 */
router.get("/me", authenticate, async (req, res) => {
    return res.status(200).json({
        success: true,
        data: req.user,
    });
});

export default router;
