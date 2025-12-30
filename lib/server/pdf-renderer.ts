import * as mupdf from "mupdf";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { uploadPageImage, uploadThumbnail } from "./blob-storage";
import type { PageInfo } from "@/lib/shared/types";

// Render scale: 2.5x to match original client-side rendering quality
const RENDER_SCALE = 2.5;
const THUMBNAIL_WIDTH = 200;
const BATCH_SIZE = 10;

export type { PageInfo };

export interface RenderProgress {
    page: number;
    total: number;
    stage: "rendering" | "uploading";
}

export interface RenderResult {
    jobId: string;
    pages: PageInfo[];
    totalPages: number;
}

/**
 * Render a single PDF page to a PNG buffer
 */
function renderPageToBuffer(
    doc: mupdf.Document,
    pageIndex: number
): { buffer: Buffer; width: number; height: number } {
    const page = doc.loadPage(pageIndex);

    // Scale matrix: 72 DPI base * RENDER_SCALE
    const scale = (96 / 72) * RENDER_SCALE;
    const matrix = mupdf.Matrix.scale(scale, scale);

    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB);
    const pngData = pixmap.asPNG();

    return {
        buffer: Buffer.from(pngData),
        width: pixmap.getWidth(),
        height: pixmap.getHeight(),
    };
}

/**
 * Generate a thumbnail from a full-resolution image buffer
 */
async function generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
        .resize(THUMBNAIL_WIDTH, undefined, {
            fit: "inside",
            withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();
}

/**
 * Render all PDF pages and upload to blob storage
 * Processes in batches to manage memory
 *
 * @param pdfBuffer - The PDF file as a Buffer
 * @param onProgress - Optional callback for progress updates
 * @returns RenderResult with job ID and page info
 */
export async function renderPdfPages(
    pdfBuffer: Buffer,
    onProgress?: (progress: RenderProgress) => void
): Promise<RenderResult> {
    const jobId = nanoid(12);

    // Open PDF document
    const doc = mupdf.Document.openDocument(pdfBuffer, "application/pdf");
    const totalPages = doc.countPages();

    const pages: PageInfo[] = [];

    // Process pages in batches to limit memory usage
    for (let i = 0; i < totalPages; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE, totalPages);
        const batchPromises: Promise<PageInfo>[] = [];

        for (let pageIndex = i; pageIndex < batchEnd; pageIndex++) {
            const pageNumber = pageIndex + 1; // 1-indexed for user display

            // Report rendering progress
            onProgress?.({
                page: pageNumber,
                total: totalPages,
                stage: "rendering",
            });

            // Render page to buffer
            const { buffer: imageBuffer, width, height } = renderPageToBuffer(doc, pageIndex);

            // Create upload promise for this page
            const uploadPromise = (async (): Promise<PageInfo> => {
                // Generate thumbnail
                const thumbnailBuffer = await generateThumbnail(imageBuffer);

                // Report upload progress
                onProgress?.({
                    page: pageNumber,
                    total: totalPages,
                    stage: "uploading",
                });

                // Upload both images in parallel
                const [imageUrl, thumbnailUrl] = await Promise.all([
                    uploadPageImage(jobId, pageNumber, imageBuffer),
                    uploadThumbnail(jobId, pageNumber, thumbnailBuffer),
                ]);

                return {
                    pageNumber,
                    thumbnailUrl,
                    imageUrl,
                    width,
                    height,
                };
            })();

            batchPromises.push(uploadPromise);
        }

        // Wait for batch to complete before starting next batch
        const batchResults = await Promise.all(batchPromises);
        pages.push(...batchResults);
    }

    return {
        jobId,
        pages,
        totalPages,
    };
}

/**
 * Render PDF pages with Server-Sent Events for progress streaming
 * Returns an async generator that yields progress events
 */
export async function* renderPdfPagesWithSSE(
    pdfBuffer: Buffer
): AsyncGenerator<string, RenderResult, unknown> {
    const jobId = nanoid(12);

    // Open PDF document
    const doc = mupdf.Document.openDocument(pdfBuffer, "application/pdf");
    const totalPages = doc.countPages();

    const pages: PageInfo[] = [];

    // Yield initial event
    yield `event: start\ndata: ${JSON.stringify({ jobId, totalPages })}\n\n`;

    // Process pages in batches
    for (let i = 0; i < totalPages; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE, totalPages);
        const batchPromises: Promise<PageInfo>[] = [];

        for (let pageIndex = i; pageIndex < batchEnd; pageIndex++) {
            const pageNumber = pageIndex + 1;

            // Yield rendering progress
            yield `event: progress\ndata: ${JSON.stringify({
                page: pageNumber,
                total: totalPages,
                stage: "rendering",
            })}\n\n`;

            // Render page
            const { buffer: imageBuffer, width, height } = renderPageToBuffer(doc, pageIndex);

            const uploadPromise = (async (): Promise<PageInfo> => {
                const thumbnailBuffer = await generateThumbnail(imageBuffer);

                const [imageUrl, thumbnailUrl] = await Promise.all([
                    uploadPageImage(jobId, pageNumber, imageBuffer),
                    uploadThumbnail(jobId, pageNumber, thumbnailBuffer),
                ]);

                return { pageNumber, thumbnailUrl, imageUrl, width, height };
            })();

            batchPromises.push(uploadPromise);
        }

        const batchResults = await Promise.all(batchPromises);
        pages.push(...batchResults);

        // Yield batch complete event
        yield `event: batch\ndata: ${JSON.stringify({
            pagesCompleted: pages.length,
            total: totalPages,
        })}\n\n`;
    }

    // Yield complete event with all pages
    yield `event: complete\ndata: ${JSON.stringify({
        jobId,
        pages,
        totalPages,
    })}\n\n`;

    return { jobId, pages, totalPages };
}
