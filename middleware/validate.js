import { z } from 'zod';
export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.issues,
            });
        }
        req.body = result.data;
        return next();
    };
}
export const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    country: z.string().optional(),
    phone: z.string().optional(),
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});
export const verifyEmailSchema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
});
export const resendOtpSchema = z.object({
    email: z.string().email(),
});
export const orderSchema = z.object({
    planId: z.string().min(1),
    currency: z.string().default('USD'),
});
