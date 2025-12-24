export interface ScaleOptions {
    targetWidth: number;
    targetHeight: number;
    maintainAspectRatio: boolean;
}

/**
 * Scales a canvas to the target dimensions.
 * Uses high-quality image smoothing for the best results.
 */
export function scaleCanvas(sourceCanvas: HTMLCanvasElement, options: ScaleOptions): HTMLCanvasElement {
    const { targetWidth, targetHeight, maintainAspectRatio } = options;

    let finalWidth = targetWidth;
    let finalHeight = targetHeight;

    if (maintainAspectRatio) {
        const sourceRatio = sourceCanvas.width / sourceCanvas.height;
        const targetRatio = targetWidth / targetHeight;

        if (sourceRatio > targetRatio) {
            // Source is wider, constrain by width
            finalWidth = targetWidth;
            finalHeight = targetWidth / sourceRatio;
        } else {
            // Source is taller, constrain by height
            finalHeight = targetHeight;
            finalWidth = targetHeight * sourceRatio;
        }
    }

    const scaledCanvas = document.createElement("canvas");
    scaledCanvas.width = Math.round(finalWidth);
    scaledCanvas.height = Math.round(finalHeight);

    const ctx = scaledCanvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not get canvas 2D context");
    }

    // Enable high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Fill with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);

    // Draw a scaled image
    ctx.drawImage(
        sourceCanvas,
        0,
        0,
        sourceCanvas.width,
        sourceCanvas.height,
        0,
        0,
        scaledCanvas.width,
        scaledCanvas.height
    );

    return scaledCanvas;
}

/**
 * Calculates pixel dimensions from physical print size and DPI.
 */
export function printSizeToPixels(
    widthInches: number,
    heightInches: number,
    dpi: number
): { width: number; height: number } {
    return {
        width: Math.round(widthInches * dpi),
        height: Math.round(heightInches * dpi),
    };
}

/**
 * Calculates physical print size from pixel dimensions and DPI.
 */
export function pixelsToPrintSize(
    widthPixels: number,
    heightPixels: number,
    dpi: number
): { width: number; height: number } {
    return {
        width: widthPixels / dpi,
        height: heightPixels / dpi,
    };
}

/**
 * Gets the aspect ratio of a canvas.
 */
export function getAspectRatio(canvas: HTMLCanvasElement): number {
    return canvas.width / canvas.height;
}

/**
 * Calculates the other dimension when maintaining the aspect ratio.
 */
export function calculateMaintainedDimension(
    sourceCanvas: HTMLCanvasElement,
    knownDimension: "width" | "height",
    value: number
): number {
    const ratio = getAspectRatio(sourceCanvas);

    if (knownDimension === "width") {
        return Math.round(value / ratio);
    } else {
        return Math.round(value * ratio);
    }
}
