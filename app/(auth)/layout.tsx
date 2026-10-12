import Link from "next/link";
export default function AuthLayout({ children }: {
    children: React.ReactNode;
}) {
    return <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-10"><Link href="/" className="py-2 text-sm font-semibold text-primary">Calorie Tracker</Link><section className="rounded-2xl border border-border bg-card p-6 shadow-sm">{children}</section></main>;
}
