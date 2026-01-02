/**
 * Server-side image merging using Sharp.
 * Ported from lib/tools/merge/index.ts
 */

import sharp from "sharp";
import { extractGridWithoutAxisNumbers } from "./grid-detector";
import { uploadMergedResult, uploadMergedPreview } from "./blob-storage";
import type { GridArrangement, StitchConfig } from "@/lib/tools/merge/types";

const PREVIEW_WIDTH = 800;
const DEFAULT_OVERLAP_PIXELS = 3;

/**
 * Validate that a URL is a legitimate Vercel Blob Storage URL.
 * Prevents SSRF attacks by ensuring we only fetch from trusted domains.
 */
function isValidBlobUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" && parsed.hostname.endsWith(".vercel-storage.com");
    } catch {
        return false;
    }
}

interface MergeCell {
    pageNumber: number;
    row: number;
    col: number;
    imageUrl: string;
}

interface ProcessedGrid {
    pageNumber: number;
    row: number;
    col: number;
    buffer: Buffer;
    width: number;
    height: number;
}

export interface MergeProcessResult {
    resultUrl: string;
    previewUrl: string;
    dimensions: { width: number; height: number };
    pagesMerged: number;
}

/**
 * Fetch image from URL and return as buffer
 */
async function fetchImageBuffer(url: string): Promise<Buffer> {
    if (!isValidBlobUrl(url)) {
        throw new Error("Invalid image URL: must be a Vercel Blob Storage URL");
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Process a single page: fetch, detect grid, crop to grid area
 */
async function processPage(cell: MergeCell, stitchConfig: StitchConfig): Promise<ProcessedGrid> {
    // Fetch the full-resolution image
    const imageBuffer = await fetchImageBuffer(cell.imageUrl);

    // Detect and crop to grid (removing axis numbers)
    const { buffer: croppedBuffer, bounds } = await extractGridWithoutAxisNumbers(imageBuffer, stitchConfig);

    return {
        pageNumber: cell.pageNumber,
        row: cell.row,
        col: cell.col,
        buffer: croppedBuffer,
        width: bounds.width,
        height: bounds.height,
    };
}

/**
 * Merge processed grids into a single image
 */
async function mergeGrids(
    grids: ProcessedGrid[],
    arrangement: GridArrangement,
    overlapPixels: number = DEFAULT_OVERLAP_PIXELS
): Promise<{ buffer: Buffer; width: number; height: number }> {
    if (grids.length === 0) {
        throw new Error("No grids to merge");
    }

    if (grids.length === 1) {
        return {
            buffer: grids[0].buffer,
            width: grids[0].width,
            height: grids[0].height,
        };
    }

    // Sort grids by position (row first, then column)
    const sorted = [...grids].sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
    });

    // Get the dimensions of a single grid cell (use first cell as reference)
    const cellWidth = sorted[0].width;
    const cellHeight = sorted[0].height;

    // Calculate merged canvas dimensions based on user arrangement
    // Subtract overlap for each internal seam
    const mergedWidth = cellWidth * arrangement.cols - overlapPixels * (arrangement.cols - 1);
    const mergedHeight = cellHeight * arrangement.rows - overlapPixels * (arrangement.rows - 1);

    // Build composite operations for Sharp
    const compositeInputs: sharp.OverlayOptions[] = sorted.map((grid) => {
        const x = grid.col * (cellWidth - overlapPixels);
        const y = grid.row * (cellHeight - overlapPixels);

        return {
            input: grid.buffer,
            left: x,
            top: y,
        };
    });

    // Create merged image with white background
    const mergedBuffer = await sharp({
        create: {
            width: mergedWidth,
            height: mergedHeight,
            channels: 3,
            background: { r: 255, g: 255, b: 255 },
        },
    })
        .composite(compositeInputs)
        .png()
        .toBuffer();

    return {
        buffer: mergedBuffer,
        width: mergedWidth,
        height: mergedHeight,
    };
}

/**
 * Generate a preview image (smaller version for display)
 */
async function generatePreview(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
        .resize(PREVIEW_WIDTH, undefined, {
            fit: "inside",
            withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();
}

/**
 * Main merge function: processes pages and creates merged image
 *
 * @param jobId - Job identifier for blob storage
 * @param cells - Array of cells with page numbers and positions
 * @param arrangement - Grid arrangement configuration
 * @param stitchConfig - Pattern configuration
 * @param overlapPixels - Pixels to overlap between grids (default 3)
 * @returns URLs and dimensions of merged results
 */
export async function mergeImages(
    jobId: string,
    cells: MergeCell[],
    arrangement: GridArrangement,
    stitchConfig: StitchConfig,
    overlapPixels: number = DEFAULT_OVERLAP_PIXELS
): Promise<MergeProcessResult> {
    if (cells.length === 0) {
        throw new Error("No pages selected. Please select at least one pattern page.");
    }

    // Step 1: Process all pages in parallel (fetch, detect grid, crop)
    const processedGrids = await Promise.all(cells.map((cell) => processPage(cell, stitchConfig)));

    // Step 2: Merge grids into single image
    const { buffer: mergedBuffer, width, height } = await mergeGrids(processedGrids, arrangement, overlapPixels);

    // Step 3: Generate preview
    const previewBuffer = await generatePreview(mergedBuffer);

    // Step 4: Upload both to blob storage
    const [resultUrl, previewUrl] = await Promise.all([
        uploadMergedResult(jobId, mergedBuffer),
        uploadMergedPreview(jobId, previewBuffer),
    ]);

    return {
        resultUrl,
        previewUrl,
        dimensions: { width, height },
        pagesMerged: processedGrids.length,
    };
}
