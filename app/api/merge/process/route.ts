import { NextRequest, NextResponse } from "next/server";
import { mergeImages, type MergeProcessResult } from "@/lib/server/image-merger";
import type { GridArrangement, StitchConfig } from "@/lib/tools/merge/types";

export const maxDuration = 60;

interface ProcessRequest {
    jobId: string;
    cells: Array<{
        pageNumber: number;
        row: number;
        col: number;
        imageUrl: string;
    }>;
    arrangement: GridArrangement;
    stitchConfig: StitchConfig;
    overlapPixels?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<MergeProcessResult | { error: string }>> {
    try {
        const body = (await request.json()) as ProcessRequest;

        // Validate required fields
        if (!body.jobId) {
            return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
        }

        if (!body.cells || body.cells.length === 0) {
            return NextResponse.json(
                { error: "No pages selected. Please select at least one pattern page." },
                { status: 400 }
            );
        }

        if (!body.arrangement || !body.arrangement.rows || !body.arrangement.cols) {
            return NextResponse.json({ error: "Missing or invalid arrangement" }, { status: 400 });
        }

        if (!body.stitchConfig || !body.stitchConfig.width || !body.stitchConfig.height) {
            return NextResponse.json({ error: "Missing or invalid stitchConfig" }, { status: 400 });
        }

        // Validate cells have required fields
        for (const cell of body.cells) {
            if (cell.pageNumber === undefined || cell.row === undefined || cell.col === undefined) {
                return NextResponse.json({ error: "Invalid cell data: missing pageNumber, row, or col" }, { status: 400 });
            }
            if (!cell.imageUrl) {
                return NextResponse.json(
                    { error: `Missing imageUrl for page ${cell.pageNumber}` },
                    { status: 400 }
                );
            }
        }

        // Process and merge images
        const result = await mergeImages(
            body.jobId,
            body.cells,
            body.arrangement,
            body.stitchConfig,
            body.overlapPixels
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("Merge process error:", error);
        const message = error instanceof Error ? error.message : "Failed to process merge";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
