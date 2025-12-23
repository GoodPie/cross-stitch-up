// Re-export shared types for convenience
export type {
  PageRenderResult,
  ProcessingProgress,
  ExportOptions,
} from "@/lib/shared/types";

export interface GridCoordinates {
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
}

export interface GridPosition {
  row: number; // 0 = top, 1 = bottom
  col: number; // 0 = left, 1 = right
}

export interface GridBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedGridPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  coordinates: GridCoordinates;
  position: GridPosition;
  gridBounds: GridBounds;
}

export interface MergeResult {
  canvas: HTMLCanvasElement;
  imageUrl: string;
  pagesMerged: number;
  dimensions: { width: number; height: number };
  originalFilename?: string;
}

/**
 * Configuration for grid detection algorithm.
 * These can be overridden via StitchConfig.gridDetection
 */
export interface GridDetectionConfig {
  /** RGB threshold for dark pixels (0-255). Lower = stricter. Default: 50 */
  darkPixelThreshold: number;

  /** Maximum gap allowed in continuous runs (handles anti-aliasing). Default: 3 */
  maxGapPixels: number;

  /** Minimum border length as fraction of dimension (0-1). Default: 0.4 */
  minBorderFraction: number;

  /** Pixels to expand outward from detected border. Default: 2 */
  borderExpansion: number;

  /** Expected border thickness in pixels. Default: 2 */
  expectedBorderThickness: number;

  /** Tolerance for border thickness detection. Default: 2 */
  thicknessTolerance: number;

  /** Search region limits as fraction of dimensions */
  searchRegions: {
    topMaxY: number; // Search for top border in top X% of page
    bottomMinY: number; // Search for bottom border in bottom X% of page
    leftMaxX: number; // Search for left border in left X% of page
    rightMinX: number; // Search for right border in right X% of page
  };

  /** Corner detection settings */
  cornerDetection: {
    /** Size of corner region to check (pixels). Default: 10 */
    cornerSize: number;
    /** Minimum dark pixels required in corner region (fraction). Default: 0.3 */
    minCornerDensity: number;
  };

  /** Grid line verification settings */
  gridLineVerification: {
    /** Enable checking for internal grid lines at regular spacing */
    enabled: boolean;
    /** Minimum number of internal lines to confirm grid. Default: 2 */
    minInternalLines: number;
    /** Tolerance for spacing regularity (fraction). Default: 0.1 */
    spacingTolerance: number;
  };
}

export interface StitchConfig {
  width: number; // Total stitches wide
  height: number; // Total stitches tall
  gridDetection?: Partial<GridDetectionConfig>; // Config for grid detection algorithm
}

export interface GridArrangement {
  rows: number;
  cols: number;
  cells: GridCell[]; // Sparse array - some cells may be empty
}

export interface GridCell {
  row: number;
  col: number;
  pageNumber: number;
  canvas: HTMLCanvasElement;
}

export interface ExtractedGrid {
  pageNumber: number;
  position: { row: number; col: number };
  canvas: HTMLCanvasElement;
}
