export function safeAuthDestination(value: string | null): string {
    return value === "/reset-password" ? value : "/dashboard";
}
