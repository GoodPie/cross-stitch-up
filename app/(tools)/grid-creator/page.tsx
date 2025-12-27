import type { Metadata } from "next";
import * as Sentry from "@sentry/nextjs";
import { GridCreatorClient } from "./_components/grid-creator-client";
import type { ThreadColour, ThreadsResponse } from "@/lib/tools/threads/types";
import { supabase } from "@/lib/supabase/client";

export const metadata: Metadata = {
    title: "Grid Creator | Cross Stitch-up",
    description: "Create a blank cross-stitch grid for designing patterns",
};

// Cache for 1 hour (reuse threads data)
export const revalidate = 3600;

async function getThreads(): Promise<ThreadsResponse> {
    const { data: threads, error } = await supabase
        .from("thread_colours")
        .select("id, brand, colour_code, name, r, g, b, hex")
        .order("colour_code", { ascending: true });

    if (error) {
        Sentry.captureException(error, {
            tags: { api: "threads", operation: "fetch" },
        });
        // Return empty data on error - color picker will just be empty
        return {
            threads: [],
            total: 0,
            brands: [],
        };
    }

    const brands = [...new Set((threads as ThreadColour[]).map((t) => t.brand))].sort((a, b) => a.localeCompare(b));

    return {
        threads: threads as ThreadColour[],
        total: threads.length,
        brands,
    };
}

export default async function GridCreatorPage() {
    const { threads, brands } = await getThreads();

    return (
        <main className="w-full px-4 py-8 md:px-6 lg:px-8">
            <GridCreatorClient threads={threads} brands={brands} />
        </main>
    );
}
