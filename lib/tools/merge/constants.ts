/**
 * Shared constants for grid detection algorithm.
 * Used by server-side processing.
 */

import type { GridDetectionConfig } from "./types";

// =============================================================================
// GRID DETECTION ALGORITHM CONSTANTS
// =============================================================================

export const CONFIDENCE = {
    LENGTH_WEIGHT: 0.6,
    THICKNESS_WEIGHT: 0.4,
    MIN_CANDIDATE: 0.4,
    MIN_CANDIDATE_NEAR: 0.3,
    MIN_OUTERMOST: 0.5,
    CONFIDENCE_DIFF_THRESHOLD: 0.2,
    MIN_OVERALL: 0.35,
    BORDER_WEIGHT: 0.3,
    CORNER_WEIGHT: 0.25,
    ALIGNMENT_WEIGHT: 0.25,
    GRID_LINE_WEIGHT: 0.2,
    REGULARITY_BOOST: 0.2,
} as const;

export const ALIGNMENT = {
    WELL_ALIGNED_PX: 15,
    ACCEPTABLE_PX: 30,
    WELL_ALIGNED_PCT: 0.03,
    ACCEPTABLE_PCT: 0.1,
    BORDER_TOLERANCE_PX: 15,
    MIN_ALIGNED_FRACTION: 0.5,
    VERTICAL_SEARCH_TOLERANCE: 30,
    VERTICAL_MISALIGNMENT_THRESHOLD: 20,
    POSITION_BONUS_FACTOR: 0.2,
} as const;

export const LINE_DETECTION = {
    MIN_LENGTH_FRACTION: 0.8,
    RUN_MATCH_FRACTION: 0.9,
    TOLERANCE_MIN_PX: 5,
    TOLERANCE_FRACTION: 0.05,
    LINE_GAP_THRESHOLD: 3,
    INTERNAL_LINE_MARGIN: 5,
    INTERNAL_LINE_SPAN_START: 0.1,
    INTERNAL_LINE_SPAN_END: 0.9,
} as const;

export const CORNER = {
    POSITION_TOLERANCE: 5,
    ARM_CHECK_TOLERANCE: 2,
    MIN_ARM_RATIO: 0.6,
} as const;

export const GRID_SPACING = {
    MIN_LINES_FOR_ANALYSIS: 3,
    MIN_CONSISTENCY: 0.7,
} as const;

export const DEFAULT_DETECTION_CONFIG: GridDetectionConfig = {
    darkPixelThreshold: 50,
    maxGapPixels: 3,
    minBorderFraction: 0.4,
    borderExpansion: 0,
    expectedBorderThickness: 2,
    thicknessTolerance: 2,
    searchRegions: {
        topMaxY: 0.35,
        bottomMinY: 0.65,
        leftMaxX: 0.3,
        rightMinX: 0.7,
    },
    cornerDetection: {
        cornerSize: 10,
        minCornerDensity: 0.3,
    },
    gridLineVerification: {
        enabled: true,
        minInternalLines: 2,
        spacingTolerance: 0.1,
    },
};

export const DEFAULT_MARGINS = {
    top: 0.12,
    bottom: 0.12,
    left: 0.08,
    right: 0.06,
};
