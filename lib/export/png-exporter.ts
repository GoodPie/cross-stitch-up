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
  options: PngExportOptions = { sizeMode: "original" }
): void {
  let exportCanvas = canvas;

  if (options.sizeMode === "pixels" && options.width && options.height) {
    exportCanvas = scaleCanvas(canvas, {
      targetWidth: options.width,
      targetHeight: options.height,
      maintainAspectRatio: options.maintainAspectRatio ?? true,
    });
  } else if (
    options.sizeMode === "print" &&
    options.width &&
    options.height &&
    options.dpi
  ) {
    const pixelDimensions = printSizeToPixels(
      options.width,
      options.height,
      options.dpi
    );
    exportCanvas = scaleCanvas(canvas, {
      targetWidth: pixelDimensions.width,
      targetHeight: pixelDimensions.height,
      maintainAspectRatio: options.maintainAspectRatio ?? true,
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
