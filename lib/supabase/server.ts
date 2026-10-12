import type { Database } from "@/types/database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getSupabaseConfig } from "./config";
export async function createClient() {
    const config = getSupabaseConfig();
    if (!config)
        throw new Error("Supabase is not configured.");
    // Supabase checks token expiry using the current clock. Run it only for a real request.
    await connection();
    const cookieStore = await cookies();
    return createServerClient<Database>(config.url, config.key, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                }
                catch {
                    // Server Components cannot write cookies; Proxy refreshes the session.
                }
            },
        },
    });
}
