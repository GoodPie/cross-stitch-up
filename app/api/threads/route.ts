import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ThreadColour, ThreadsResponse } from "@/lib/tools/threads/types";

// Cache for 1 hour, revalidate in background
export const revalidate = 3600;

export async function GET(): Promise<NextResponse<ThreadsResponse | { error: string }>> {
    try {
        const { data: threads, error } = await supabaseAdmin
            .from("thread_colours")
            .select("id, brand, colour_code, name, r, g, b, hex")
            .order("colour_code", { ascending: true });

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 });
        }

        // Get unique brands for filter dropdown
        const brands = [...new Set((threads as ThreadColour[]).map((t) => t.brand))].sort((a, b) =>
            a.localeCompare(b)
        );

        return NextResponse.json({
            threads: threads as ThreadColour[],
            total: threads.length,
            brands,
        });
    } catch (err) {
        console.error("Error fetching threads:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
