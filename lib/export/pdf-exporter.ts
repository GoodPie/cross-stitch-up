import { jsPDF } from "jspdf";
import { scaleCanvas, printSizeToPixels } from "./canvas-scaler";

export interface PdfExportOptions {
    sizeMode: "fit" | "pixels" | "print" | "original";
    width?: number;
    height?: number;
    dpi?: number;
    maintainAspectRatio?: boolean;
}

// Standard paper sizes in mm
const PAPER_SIZES = {
    a4: { width: 210, height: 297 },
    a3: { width: 297, height: 420 },
    letter: { width: 215.9, height: 279.4 },
    legal: { width: 215.9, height: 355.6 },
};

/**
 * Exports a canvas as a PDF file with optional resizing.
 */
export function downloadAsPdf(
    canvas: HTMLCanvasElement,
    filename: string,
    { sizeMode = "fit", width, height, dpi, maintainAspectRatio }: PdfExportOptions
): void {
    let exportCanvas = canvas;
    let pdfWidth: number;
    let pdfHeight: number;

    if (sizeMode === "pixels" && width && height) {
        exportCanvas = scaleCanvas(canvas, {
            targetWidth: width,
            targetHeight: height,
            maintainAspectRatio: maintainAspectRatio ?? true,
        });
        // Convert pixels to mm (assuming 96 DPI for screen)
        pdfWidth = (exportCanvas.width / 96) * 25.4;
        pdfHeight = (exportCanvas.height / 96) * 25.4;
    } else if (sizeMode === "print" && width && height && dpi) {
        const pixelDimensions = printSizeToPixels(width, height, dpi);
        exportCanvas = scaleCanvas(canvas, {
            targetWidth: pixelDimensions.width,
            targetHeight: pixelDimensions.height,
            maintainAspectRatio: maintainAspectRatio ?? true,
        });
        // Width and height are in inches, convert to mm
        pdfWidth = width * 25.4;
        pdfHeight = height * 25.4;
    } else {
        // 'fit' mode - fit to A4 while maintaining the aspect ratio
        const aspectRatio = canvas.width / canvas.height;
        const a4 = PAPER_SIZES.a4;

        if (aspectRatio > a4.width / a4.height) {
            // Canvas is wider than A4, constrain by width
            pdfWidth = a4.width - 20; // 10mm margins
            pdfHeight = pdfWidth / aspectRatio;
        } else {
            // Canvas is taller than A4, constrain by height
            pdfHeight = a4.height - 20; // 10mm margins
            pdfWidth = pdfHeight * aspectRatio;
        }
    }

    // Determine orientation
    const orientation = pdfWidth > pdfHeight ? "landscape" : "portrait";

    // Create PDF with custom page size
    const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: [pdfWidth + 20, pdfHeight + 20], // Add margins
    });

    // Get image data
    const imgData = exportCanvas.toDataURL("image/png");

    // Centre the image on the page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = (pageWidth - pdfWidth) / 2;
    const marginY = (pageHeight - pdfHeight) / 2;

    // Add image to PDF
    pdf.addImage(imgData, "PNG", marginX, marginY, pdfWidth, pdfHeight);

    // Save
    pdf.save(sanitizeFilename(filename, "pdf"));
}

/**
 * Sanitises a filename for download.
 */
function sanitizeFilename(filename: string, extension: string): string {
    const baseName = filename.replace(/\.[^/.]+$/, "");
    return `${baseName}-merged.${extension}`;
}
