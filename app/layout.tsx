import type React from "react";
import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"] });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
    title: "Cross Stitch-up - Combine Your Cross Stitch Patterns",
    description:
        "Easily merge multi-page cross stitch pattern PDFs into a single image. Perfect for stitchers who want to see the full picture.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${dmSans.className} ${fraunces.variable} font-sans antialiased`}>
                <AuthProvider>{children}</AuthProvider>
                <Analytics />
            </body>
        </html>
    );
}
