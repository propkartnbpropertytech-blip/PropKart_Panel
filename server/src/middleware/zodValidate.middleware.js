export const validate = (schema) => async (req, res, next) => {
    try {
        const parsed = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) req.query = parsed.query;
        if (parsed.params) req.params = parsed.params;
        next();
    } catch (err) {
        if (err.errors) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errorCode: "VALIDATION_FAILED",
                errors: err.errors.map((e) => ({
                    path: e.path.join("."),
                    message: e.message,
                })),
            });
        }
        next(err);
    }
};
