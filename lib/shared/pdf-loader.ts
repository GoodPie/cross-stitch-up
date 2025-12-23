import type { PageRenderResult } from "./types";

const RENDER_SCALE = 2.5; // High resolution for quality output

export async function loadAndRenderPdf(
  file: File,
  onProgress?: (stage: string) => void,
): Promise<PageRenderResult[]> {
  onProgress?.("Reading PDF...");

  // Dynamically import pdfjs-dist to avoid SSR issues
  const pdfjsLib = await import("pdfjs-dist");

  // Use worker from public folder (copied from node_modules/pdfjs-dist/build/)
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const totalPages = pdf.numPages;
  const results: PageRenderResult[] = [];

  // Render ALL pages - user will select which ones are pattern pages
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.(`Rendering page ${pageNum} of ${totalPages}...`);

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas 2D context");
    }

    // @ts-ignore
    await page.render({ canvasContext: ctx, viewport }).promise;

    results.push({
      pageNumber: pageNum,
      canvas,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return results;
}
