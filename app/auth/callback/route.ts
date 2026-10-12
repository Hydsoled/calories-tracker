import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/config";
import { safeAuthDestination } from "@/lib/validations/auth-redirect";
export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const destination = safeAuthDestination(request.nextUrl.searchParams.get("next"));
    // Use configured origin rather than untrusted forwarded/Host headers.
    const origin = getSiteUrl();
    if (code) {
        try {
            const supabase = await createClient();
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error)
                return NextResponse.redirect(new URL(destination, origin), { headers: { "Cache-Control": "private, no-store" } });
        }
        catch { /* Show a recoverable public error below. */ }
    }
    return NextResponse.redirect(new URL("/login?error=confirmation", origin), { headers: { "Cache-Control": "private, no-store" } });
}
