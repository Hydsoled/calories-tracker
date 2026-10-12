export function getSupabaseConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key)
        return null;
    return { url, key };
}
export function getSiteUrl() {
    const value = process.env.NEXT_PUBLIC_SITE_URL;
    if (!value)
        throw new Error("Set NEXT_PUBLIC_SITE_URL before sending authentication emails.");
    return new URL(value).origin;
}
