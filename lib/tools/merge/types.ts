// Re-export shared types for convenience
export type { PageRenderResult, ProcessingProgress, ExportOptions, PageInfo } from "@/lib/shared/types";

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

/**
 * Configuration for the grid detection algorithm.
 * These can be overridden via StitchConfig.gridDetection
 */
export interface GridDetectionConfig {
    /** RGB threshold for dark pixels (0-255). Lower = stricter. Default: 50 */
    darkPixelThreshold: number;

    /** Maximum gap allowed in continuous runs (handles the antialiasing). Default: 3 */
    maxGapPixels: number;

    /** Minimum border length as the fraction of dimension (0-1). Default: 0.4 */
    minBorderFraction: number;

    /** Pixels to expand outward from the detected border. Default: 2 */
    borderExpansion: number;

    /** Expected border thickness in pixels. Default: 2 */
    expectedBorderThickness: number;

    /** Tolerance for border thickness detection. Default: 2 */
    thicknessTolerance: number;

    /** Search region limits as the fraction of dimensions */
    searchRegions: {
        topMaxY: number; // Search for the top border in top X% of page
        bottomMinY: number; // Search for the bottom border in bottom X% of page
        leftMaxX: number; // Search for the left border in left X% of page
        rightMinX: number; // Search for the right border in right X% of page
    };

    /** Corner detection settings */
    cornerDetection: {
        /** Size of the corner region to check (pixels). Default: 10 */
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

// =============================================================================
// Grid Cell and Arrangement Types (URL-based, server-side processing)
// =============================================================================

/**
 * Grid cell with image URL for server-side processing.
 */
export interface GridCell {
    row: number;
    col: number;
    pageNumber: number;
    imageUrl: string;
}

/**
 * Grid arrangement with URL-based cells.
 */
export interface GridArrangement {
    rows: number;
    cols: number;
    cells: GridCell[]; // Sparse array - some cells may be empty
}

/**
 * Merge result with blob URLs.
 */
export interface MergeResult {
    resultUrl: string; // Full resolution merged image URL
    previewUrl: string; // Smaller preview image URL
    pagesMerged: number;
    dimensions: { width: number; height: number };
    originalFilename?: string;
}

// =============================================================================
// Type Aliases for Backwards Compatibility
// =============================================================================

/** @deprecated Use GridCell instead */
export type ServerGridCell = GridCell;

/** @deprecated Use GridArrangement instead */
export type ServerGridArrangement = GridArrangement;

/** @deprecated Use MergeResult instead */
export type ServerMergeResult = MergeResult;

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Response from the upload API endpoint.
 */
export interface UploadResponse {
    jobId: string;
    pages: import("@/lib/shared/types").PageInfo[];
    totalPages: number;
}

/**
 * Response from the process API endpoint.
 */
export interface ProcessResponse {
    resultUrl: string;
    previewUrl: string;
    dimensions: { width: number; height: number };
    pagesMerged: number;
}
