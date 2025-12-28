import type { Metadata } from "next";
import { ThreadsClient } from "./_components/threads-client";
import { fetchThreads } from "@/lib/tools/threads/fetch-threads";

export const metadata: Metadata = {
    title: "Thread Colors | Cross Stitch-up",
    description: "Browse and search thread colors by name, code, or find similar colors",
};

// Cache for 1 hour
export const revalidate = 3600;

export default async function ThreadsPage() {
    const { threads, brands } = await fetchThreads();

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
