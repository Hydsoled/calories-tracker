import { z } from "zod";
export const emailSchema = z.object({ email: z.string().trim().pipe(z.email("Enter a valid email address.").max(254)) });
export const loginSchema = emailSchema.extend({ password: z.string().min(1, "Enter your password.").max(128) });
export const passwordSchema = z.object({ password: z.string().min(8, "Use at least 8 characters.").max(128, "Use at most 128 characters.") });
export const registerSchema = emailSchema.extend(passwordSchema.shape);
export type AuthMode = "login" | "register" | "forgot-password" | "reset-password";
export type AuthState = {
    error?: string;
    success?: string;
    fields?: Partial<Record<"email" | "password", string>>;
};
