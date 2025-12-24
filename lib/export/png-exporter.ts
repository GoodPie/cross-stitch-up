import { scaleCanvas, printSizeToPixels } from "./canvas-scaler";

export interface PngExportOptions {
    sizeMode: "original" | "pixels" | "print";
    width?: number;
    height?: number;
    dpi?: number;
    maintainAspectRatio?: boolean;
}

/**
 * Exports a canvas as a PNG file with optional resizing.
 */
export function downloadAsPng(
    canvas: HTMLCanvasElement,
    filename: string,
    { sizeMode = "original", width, height, dpi, maintainAspectRatio }: PngExportOptions
): void {
    let exportCanvas = canvas;

    if (sizeMode === "pixels" && width && height) {
        exportCanvas = scaleCanvas(canvas, {
            targetWidth: width,
            targetHeight: height,
            maintainAspectRatio: maintainAspectRatio ?? true,
        });
    } else if (sizeMode === "print" && width && height && dpi) {
        const pixelDimensions = printSizeToPixels(width, height, dpi);
        exportCanvas = scaleCanvas(canvas, {
            targetWidth: pixelDimensions.width,
            targetHeight: pixelDimensions.height,
            maintainAspectRatio: maintainAspectRatio ?? true,
        });
    }

    const dataUrl = exportCanvas.toDataURL("image/png");

    // Create a download link
    const link = document.createElement("a");
    link.download = sanitizeFilename(filename, "png");
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Sanitises a filename for download.
 */
function sanitizeFilename(filename: string, extension: string): string {
    // Remove the original extension and add the new one
    const baseName = filename.replace(/\.[^/.]+$/, "");
    return `${baseName}-merged.${extension}`;
}
