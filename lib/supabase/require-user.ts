import { redirect } from "next/navigation";
import { getSupabaseConfig } from "./config";
import { createClient } from "./server";
export async function requireUser() {
    if (!getSupabaseConfig())
        redirect("/login");
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user)
        redirect("/login");
    return { supabase, user };
}
