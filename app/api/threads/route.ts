import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { supabase } from "@/lib/supabase/client";
import type { ThreadColour, ThreadsResponse } from "@/lib/tools/threads/types";

// Cache for 1 hour, revalidate in background
export const revalidate = 3600;

export async function GET(): Promise<NextResponse<ThreadsResponse | { error: string }>> {
    try {
        const { data: threads, error } = await supabase
            .from("thread_colours")
            .select("id, brand, colour_code, name, r, g, b, hex")
            .order("colour_code", { ascending: true });

        if (error) {
            Sentry.captureException(error, {
                tags: { api: "threads", operation: "fetch" },
            });
            return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 });
        }

        // Get unique brands for filter dropdown
        const brands = [...new Set((threads as ThreadColour[]).map((t) => t.brand))].sort((a, b) => a.localeCompare(b));

        return NextResponse.json({
            threads: threads as ThreadColour[],
            total: threads.length,
            brands,
        });
    } catch (err) {
        Sentry.captureException(err, {
            tags: { api: "threads", operation: "fetch" },
        });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
