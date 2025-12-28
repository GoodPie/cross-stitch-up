import { ThreadColour, ThreadsResponse } from "@/lib/tools/threads/types";
import { supabase } from "@/lib/supabase/client";
import * as Sentry from "@sentry/nextjs";

export async function fetchThreads(): Promise<ThreadsResponse> {
    const { data: threads, error } = await supabase
        .from("thread_colours")
        .select("id, brand, colour_code, name, r, g, b, hex")
        .order("colour_code", { ascending: true });

    if (error) {
        Sentry.captureException(error, {
            tags: { api: "threads", operation: "fetch" },
        });
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
