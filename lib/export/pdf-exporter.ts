import { jsPDF } from 'jspdf'
import { scaleCanvas, printSizeToPixels } from './canvas-scaler'

export interface PdfExportOptions {
  sizeMode: 'fit' | 'pixels' | 'print'
  width?: number
  height?: number
  dpi?: number
  maintainAspectRatio?: boolean
}

// Standard paper sizes in mm
const PAPER_SIZES = {
  a4: { width: 210, height: 297 },
  a3: { width: 297, height: 420 },
  letter: { width: 215.9, height: 279.4 },
  legal: { width: 215.9, height: 355.6 },
}

/**
 * Exports a canvas as a PDF file with optional resizing.
 */
export function downloadAsPdf(
  canvas: HTMLCanvasElement,
  filename: string,
  options: PdfExportOptions = { sizeMode: 'fit' }
): void {
  let exportCanvas = canvas
  let pdfWidth: number
  let pdfHeight: number

  if (options.sizeMode === 'pixels' && options.width && options.height) {
    exportCanvas = scaleCanvas(canvas, {
      targetWidth: options.width,
      targetHeight: options.height,
      maintainAspectRatio: options.maintainAspectRatio ?? true,
    })
    // Convert pixels to mm (assuming 96 DPI for screen)
    pdfWidth = (exportCanvas.width / 96) * 25.4
    pdfHeight = (exportCanvas.height / 96) * 25.4
  } else if (options.sizeMode === 'print' && options.width && options.height && options.dpi) {
    const pixelDimensions = printSizeToPixels(options.width, options.height, options.dpi)
    exportCanvas = scaleCanvas(canvas, {
      targetWidth: pixelDimensions.width,
      targetHeight: pixelDimensions.height,
      maintainAspectRatio: options.maintainAspectRatio ?? true,
    })
    // Width and height are in inches, convert to mm
    pdfWidth = options.width * 25.4
    pdfHeight = options.height * 25.4
  } else {
    // 'fit' mode - fit to A4 while maintaining aspect ratio
    const aspectRatio = canvas.width / canvas.height
    const a4 = PAPER_SIZES.a4

    if (aspectRatio > a4.width / a4.height) {
      // Canvas is wider than A4, constrain by width
      pdfWidth = a4.width - 20 // 10mm margins
      pdfHeight = pdfWidth / aspectRatio
    } else {
      // Canvas is taller than A4, constrain by height
      pdfHeight = a4.height - 20 // 10mm margins
      pdfWidth = pdfHeight * aspectRatio
    }
  }

  // Determine orientation
  const orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait'

  // Create PDF with custom page size
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [pdfWidth + 20, pdfHeight + 20], // Add margins
  })

  // Get image data
  const imgData = exportCanvas.toDataURL('image/png')

  // Center the image on the page
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const marginX = (pageWidth - pdfWidth) / 2
  const marginY = (pageHeight - pdfHeight) / 2

  // Add image to PDF
  pdf.addImage(imgData, 'PNG', marginX, marginY, pdfWidth, pdfHeight)

  // Save
  pdf.save(sanitizeFilename(filename, 'pdf'))
}

/**
 * Creates a PDF blob for preview or download.
 */
export function createPdfBlob(
  canvas: HTMLCanvasElement,
  options: PdfExportOptions = { sizeMode: 'fit' }
): Blob {
  let exportCanvas = canvas
  let pdfWidth: number
  let pdfHeight: number

  if (options.sizeMode === 'pixels' && options.width && options.height) {
    exportCanvas = scaleCanvas(canvas, {
      targetWidth: options.width,
      targetHeight: options.height,
      maintainAspectRatio: options.maintainAspectRatio ?? true,
    })
    pdfWidth = (exportCanvas.width / 96) * 25.4
    pdfHeight = (exportCanvas.height / 96) * 25.4
  } else if (options.sizeMode === 'print' && options.width && options.height && options.dpi) {
    const pixelDimensions = printSizeToPixels(options.width, options.height, options.dpi)
    exportCanvas = scaleCanvas(canvas, {
      targetWidth: pixelDimensions.width,
      targetHeight: pixelDimensions.height,
      maintainAspectRatio: options.maintainAspectRatio ?? true,
    })
    pdfWidth = options.width * 25.4
    pdfHeight = options.height * 25.4
  } else {
    const aspectRatio = canvas.width / canvas.height
    const a4 = PAPER_SIZES.a4

    if (aspectRatio > a4.width / a4.height) {
      pdfWidth = a4.width - 20
      pdfHeight = pdfWidth / aspectRatio
    } else {
      pdfHeight = a4.height - 20
      pdfWidth = pdfHeight * aspectRatio
    }
  }

  const orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait'

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [pdfWidth + 20, pdfHeight + 20],
  })

  const imgData = exportCanvas.toDataURL('image/png')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const marginX = (pageWidth - pdfWidth) / 2
  const marginY = (pageHeight - pdfHeight) / 2

  pdf.addImage(imgData, 'PNG', marginX, marginY, pdfWidth, pdfHeight)

  return pdf.output('blob')
}

/**
 * Sanitizes a filename for download.
 */
function sanitizeFilename(filename: string, extension: string): string {
  const baseName = filename.replace(/\.[^/.]+$/, '')
  return `${baseName}-merged.${extension}`
}
