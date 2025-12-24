import type { Metadata } from "next";
import * as Sentry from "@sentry/nextjs";
import { ThreadsClient } from "./_components/threads-client";
import type { ThreadColour, ThreadsResponse } from "@/lib/tools/threads/types";
import { supabase } from "@/lib/supabase/client";

export const metadata: Metadata = {
    title: "Thread Colors | Cross Stitch-up",
    description: "Browse and search thread colors by name, code, or find similar colors",
};

// Cache for 1 hour
export const revalidate = 3600;

async function getThreads(): Promise<ThreadsResponse> {
    const { data: threads, error } = await supabase
        .from("thread_colours")
        .select("id, brand, colour_code, name, r, g, b, hex")
        .order("colour_code", { ascending: true });

    if (error) {
        Sentry.captureException(error, {
            tags: { api: "threads", operation: "fetch" },
        })
        throw new Error("Failed to fetch threads");
    }

    const brands = [...new Set((threads as ThreadColour[]).map((t) => t.brand))].sort((a, b) =>
        a.localeCompare(b)
    );

    return {
        threads: threads as ThreadColour[],
        total: threads.length,
        brands,
    };
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
