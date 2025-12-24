import type { Metadata } from "next";
import { ThreadsClient } from "./_components/threads-client";
import type { ThreadsResponse } from "@/lib/tools/threads/types";

export const metadata: Metadata = {
    title: "Thread Colors | Cross Stitch-up",
    description: "Browse and search thread colors by name, code, or find similar colors",
};

async function getThreads(): Promise<ThreadsResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/threads`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
        throw new Error("Failed to fetch threads");
    }

    return res.json();
}

export default async function ThreadsPage() {
    const { threads, brands } = await getThreads();

    return (
        <main className="container mx-auto max-w-6xl px-4 py-8">
            <div className="mb-8 space-y-2">
                <h1 className="font-serif text-3xl font-bold">Thread Colors</h1>
                <p className="text-muted-foreground">
                    Browse {threads.length.toLocaleString()} thread colors. Search by name, code, or find threads
                    similar to any color.
                </p>
            </div>

            <ThreadsClient threads={threads} brands={brands} />
        </main>
    );
}
