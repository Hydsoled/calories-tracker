import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});
const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});
export const metadata: Metadata = {
    title: "Calorie Tracker",
    description: "A simple daily food journal and calorie tracker.",
};
export default function RootLayout({ children }: LayoutProps<"/">) {
    return (<html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col"><Suspense fallback={<p role="status" className="p-6">Loading…</p>}>{children}</Suspense></body>
    </html>);
}
