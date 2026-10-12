"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: {
    reset: () => void;
}) {
    return <main className="mx-auto max-w-md space-y-4 p-6"><h1 className="text-xl font-semibold">We couldn’t load this page</h1><p>Please try again in a moment.</p><Button onClick={reset}>Try again</Button></main>;
}
