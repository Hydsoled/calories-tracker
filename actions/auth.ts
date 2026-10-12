"use server";
import { describeSignupError, signupDiagnostic } from "@/lib/validations/signup-error";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, getSupabaseConfig } from "@/lib/supabase/config";
import { requireUser } from "@/lib/supabase/require-user";
import { emailSchema, loginSchema, passwordSchema, registerSchema, type AuthMode, type AuthState } from "@/lib/validations/auth";
export async function authenticate(mode: AuthMode, _previous: AuthState, formData: FormData): Promise<AuthState> {
    if (!getSupabaseConfig())
        return { error: "Authentication is not configured yet. Please try again after setup." };
    const schema = mode === "forgot-password" ? emailSchema : mode === "reset-password" ? passwordSchema : mode === "register" ? registerSchema : loginSchema;
    const parsed = schema.safeParse({ email: formData.get("email"), password: formData.get("password") });
    if (!parsed.success) {
        const fields: AuthState["fields"] = {};
        for (const issue of parsed.error.issues) {
            const field = issue.path[0];
            if (field === "email" || field === "password")
                fields[field] ??= issue.message;
        }
        return { fields };
    }
    try {
        const supabase = await createClient();
        if (mode === "reset-password") {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user)
                return { error: "Your recovery link has expired. Request a new one." };
            const { error } = await supabase.auth.updateUser({ password: passwordSchema.parse(parsed.data).password });
            if (error)
                return { error: "Could not update your password. Use a different password or request a new link." };
            return { success: "Password updated. You can return to your dashboard." };
        }
        const { email } = emailSchema.parse(parsed.data);
        if (mode === "forgot-password") {
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password` });
            if (error)
                return { error: "Could not send a recovery email. Please try again shortly." };
            return { success: "If an account exists for that email, a recovery link is on its way." };
        }
        const { password } = loginSchema.parse(parsed.data);
        if (!password)
            return { error: "Enter your password." };
        if (mode === "register") {
            const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` } });
            if (error) {
                console.error("Supabase signup failed", signupDiagnostic(error));
                return { error: describeSignupError(error) };
            }
            if (!data.session)
                return { success: "Check your email to confirm your account, then sign in." };
        }
        else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error)
                return { error: "Could not sign in. Check your email and password and confirm your email first." };
        }
    }
    catch {
        return { error: "Authentication is temporarily unavailable. Check the app configuration or try again shortly." };
    }
    revalidatePath("/", "layout");
    redirect("/dashboard");
}
export async function signOut(): Promise<AuthState> {
    const { supabase } = await requireUser();
    const { error } = await supabase.auth.signOut();
    if (error)
        return { error: "Could not sign out. Please try again." };
    revalidatePath("/", "layout");
    redirect("/login");
}
