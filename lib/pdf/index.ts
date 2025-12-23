import {
  cropToGrid,
  extractGridWithoutAxisNumbers,
  drawDebugBounds,
} from "./grid-extractor";

import type {
  MergeResult,
  DetectedGridPage,
  PageRenderResult,
  GridArrangement,
  StitchConfig,
} from "./types";

export type { MergeResult, ExportOptions } from "./types";

/**
 * Process user-selected pages with their specified arrangement.
 * This is the new user-driven flow where pages are manually positioned.
 */
export async function processSelectedPages(
  pages: PageRenderResult[],
  arrangement: GridArrangement,
  stitchConfig: StitchConfig,
  onProgress: (stage: string) => void,
): Promise<MergeResult> {
  if (arrangement.cells.length === 0) {
    throw new Error(
      "No pages selected. Please select at least one pattern page.",
    );
  }

  // Step 1: Extract grid areas from selected pages (cropping axis numbers)
  onProgress("Extracting grid sections...");

  const detectedGrids: DetectedGridPage[] = [];

  for (let i = 0; i < arrangement.cells.length; i++) {
    const cell = arrangement.cells[i];
    const page = pages.find((p) => p.pageNumber === cell.pageNumber);

    if (!page) {
      console.warn(`Page ${cell.pageNumber} not found, skipping`);
      continue;
    }

    onProgress(`Extracting grid from page ${cell.pageNumber}...`);

    // Use the detection function that crops out axis numbers
    const bounds = extractGridWithoutAxisNumbers(page.canvas, stitchConfig);

    // Debug: Draw bounds on source canvas before cropping
    drawDebugBounds(page.canvas, bounds);

    const croppedCanvas = cropToGrid(page.canvas, bounds);

    detectedGrids.push({
      pageNumber: page.pageNumber,
      canvas: croppedCanvas,
      coordinates: { xStart: 0, xEnd: 0, yStart: 0, yEnd: 0 },
      position: { row: cell.row, col: cell.col },
      gridBounds: bounds,
    });
  }

  if (detectedGrids.length === 0) {
    throw new Error("Could not extract any grids from selected pages.");
  }

  // Step 2: Merge grids into unified pattern
  onProgress("Merging pattern...");

  const mergedCanvas = mergePatternGridsFromArrangement(
    detectedGrids,
    arrangement,
  );

  // Step 3: Generate result
  onProgress("Finalizing...");

  const imageUrl = mergedCanvas.toDataURL("image/png");

  return {
    canvas: mergedCanvas,
    imageUrl,
    pagesMerged: detectedGrids.length,
    dimensions: {
      width: stitchConfig.width,
      height: stitchConfig.height,
    },
  };
}

/**
 * Merges grids based on user-specified arrangement.
 * @param grids - Array of detected grid pages
 * @param arrangement - Grid arrangement specification
 * @param overlapPixels - Pixels to overlap between adjacent grids (default 1 for seamless borders)
 */
function mergePatternGridsFromArrangement(
  grids: DetectedGridPage[],
  arrangement: GridArrangement,
  overlapPixels: number = 3,
): HTMLCanvasElement {
  if (grids.length === 0) {
    throw new Error("No grids to merge");
  }

  if (grids.length === 1) {
    return grids[0].canvas;
  }

  // Sort grids by position (row first, then column)
  const sorted = [...grids].sort((a, b) => {
    if (a.position.row !== b.position.row) {
      return a.position.row - b.position.row;
    }
    return a.position.col - b.position.col;
  });

  // Get the dimensions of a single grid cell (use first cell as reference)
  const cellWidth = sorted[0].canvas.width;
  const cellHeight = sorted[0].canvas.height;

  // Calculate merged canvas dimensions based on user arrangement
  // Subtract overlap for each internal seam
  const mergedWidth =
    cellWidth * arrangement.cols - overlapPixels * (arrangement.cols - 1);
  const mergedHeight =
    cellHeight * arrangement.rows - overlapPixels * (arrangement.rows - 1);

  // Create the merged canvas
  const mergedCanvas = document.createElement("canvas");
  mergedCanvas.width = mergedWidth;
  mergedCanvas.height = mergedHeight;

  const ctx = mergedCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas 2D context");
  }

  // Fill with white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, mergedWidth, mergedHeight);

  // Draw each grid section at its specified position (accounting for overlap)
  for (const grid of sorted) {
    const x = grid.position.col * (cellWidth - overlapPixels);
    const y = grid.position.row * (cellHeight - overlapPixels);

    ctx.drawImage(grid.canvas, x, y);
  }

  return mergedCanvas;
}
