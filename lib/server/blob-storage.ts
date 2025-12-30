import { put, del, list } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Upload an image buffer to Vercel Blob storage
 * @param buffer - Image buffer to upload
 * @param path - Storage path (e.g., "merge/job123/page-1.png")
 * @param contentType - MIME type (defaults to image/png)
 * @returns URL of the uploaded blob
 */
export async function uploadImage(
    buffer: Buffer,
    path: string,
    contentType: string = "image/png"
): Promise<string> {
    const blob = await put(path, buffer, {
        access: "public",
        contentType,
        token: BLOB_TOKEN,
    });
    return blob.url;
}

/**
 * Delete all blobs with a given prefix (for job cleanup)
 * @param prefix - Path prefix (e.g., "merge/job123/")
 * @returns Number of blobs deleted
 */
export async function deleteByPrefix(prefix: string): Promise<number> {
    const allUrls: string[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    // Paginate through all blobs with this prefix
    while (hasMore) {
        const result = await list({
            prefix,
            limit: 100,
            cursor,
            token: BLOB_TOKEN,
        });

        allUrls.push(...result.blobs.map((blob) => blob.url));
        hasMore = result.hasMore;
        cursor = result.cursor;
    }

    if (allUrls.length === 0) {
        return 0;
    }

    // Delete all found blobs
    await del(allUrls, { token: BLOB_TOKEN });
    return allUrls.length;
}

/**
 * Generate a storage path for merge job artifacts
 * @param jobId - Unique job identifier
 * @param filename - Filename (e.g., "page-1.png", "thumbnail-1.png")
 * @returns Full storage path
 */
export function getMergePath(jobId: string, filename: string): string {
    return `merge/${jobId}/${filename}`;
}

/**
 * Upload a full-resolution page image
 */
export async function uploadPageImage(
    jobId: string,
    pageNumber: number,
    buffer: Buffer
): Promise<string> {
    const path = getMergePath(jobId, `page-${pageNumber}.png`);
    return uploadImage(buffer, path);
}

/**
 * Upload a thumbnail image
 */
export async function uploadThumbnail(
    jobId: string,
    pageNumber: number,
    buffer: Buffer
): Promise<string> {
    const path = getMergePath(jobId, `thumb-${pageNumber}.jpg`);
    return uploadImage(buffer, path, "image/jpeg");
}

/**
 * Upload the final merged result
 */
export async function uploadMergedResult(
    jobId: string,
    buffer: Buffer
): Promise<string> {
    const path = getMergePath(jobId, "result.png");
    return uploadImage(buffer, path);
}

/**
 * Upload a preview of the merged result
 */
export async function uploadMergedPreview(
    jobId: string,
    buffer: Buffer
): Promise<string> {
    const path = getMergePath(jobId, "preview.jpg");
    return uploadImage(buffer, path, "image/jpeg");
}
