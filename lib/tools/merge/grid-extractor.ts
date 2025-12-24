import type { GridBounds, GridDetectionConfig, StitchConfig } from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** When enabled, draws a red border overlay on output canvas and logs detection steps */
export const DEBUG_GRID_DETECTION = false;

/** Confidence score weights and thresholds */
const CONFIDENCE = {
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

/** Alignment tolerances in pixels and percentages */
const ALIGNMENT = {
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

/** Line detection thresholds (exported for reuse) */
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

/** Corner verification parameters */
const CORNER = {
    POSITION_TOLERANCE: 5,
    ARM_CHECK_TOLERANCE: 2,
    MIN_ARM_RATIO: 0.6,
} as const;

/** Grid line spacing analysis */
const GRID_SPACING = {
    MIN_LINES_FOR_ANALYSIS: 3,
    MIN_CONSISTENCY: 0.7,
} as const;

/** Default detection configuration (exported for reuse) */
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

/** Default margins (percentage of page dimensions) - fallback when detection fails */
const DEFAULT_MARGINS = {
    top: 0.12,
    bottom: 0.12,
    left: 0.08,
    right: 0.06,
};

// =============================================================================
// TYPES
// =============================================================================

export type ScanDirection = "horizontal" | "vertical";
type CornerType = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

export interface DarkRun {
    start: number;
    length: number;
}

interface LineCandidate {
    position: number;
    runStart: number;
    runLength: number;
    thickness: number;
    confidence: number;
}

export interface ImageContext {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    config: GridDetectionConfig;
}

interface DetectedBorders {
    top: LineCandidate;
    bottom: LineCandidate;
    left: LineCandidate;
    right: LineCandidate;
}

interface AlignmentResult {
    score: number;
    aligned: boolean;
}

export interface SpacingAnalysis {
    isRegular: boolean;
    consistency: number;
}

// =============================================================================
// PIXEL ANALYSIS
// =============================================================================

export function createImageContext(canvas: HTMLCanvasElement, config: GridDetectionConfig): ImageContext | null {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);

    return {
        data: imageData.data,
        width,
        height,
        config,
    };
}

export function isDarkPixel(ctx: ImageContext, x: number, y: number): boolean {
    if (x < 0 || x >= ctx.width || y < 0 || y >= ctx.height) return false;

    const idx = (y * ctx.width + x) * 4;
    const r = ctx.data[idx];
    const g = ctx.data[idx + 1];
    const b = ctx.data[idx + 2];

    return r < ctx.config.darkPixelThreshold && g < ctx.config.darkPixelThreshold && b < ctx.config.darkPixelThreshold;
}

// =============================================================================
// LINE DETECTION
// =============================================================================

export function findLongestDarkRun(ctx: ImageContext, position: number, direction: ScanDirection): DarkRun {
    const limit = direction === "horizontal" ? ctx.width : ctx.height;
    let maxRun: DarkRun = { start: 0, length: 0 };
    let currentRun: DarkRun = { start: 0, length: 0 };
    let gapCount = 0;

    for (let i = 0; i < limit; i++) {
        const x = direction === "horizontal" ? i : position;
        const y = direction === "horizontal" ? position : i;
        const dark = isDarkPixel(ctx, x, y);

        if (dark) {
            if (currentRun.length === 0) currentRun.start = i;
            currentRun.length++;
            gapCount = 0;
        } else {
            gapCount++;
            if (gapCount <= ctx.config.maxGapPixels && currentRun.length > 0) {
                currentRun.length++;
            } else {
                if (currentRun.length > maxRun.length) {
                    maxRun = { ...currentRun };
                }
                currentRun = { start: 0, length: 0 };
                gapCount = 0;
            }
        }
    }

    if (currentRun.length > maxRun.length) {
        maxRun = { ...currentRun };
    }

    return maxRun;
}

function measureLineThickness(ctx: ImageContext, position: number, run: DarkRun, direction: ScanDirection): number {
    const limit = direction === "horizontal" ? ctx.height : ctx.width;
    const maxDelta = ctx.config.expectedBorderThickness + ctx.config.thicknessTolerance;
    const tolerance = Math.max(LINE_DETECTION.TOLERANCE_MIN_PX, run.length * LINE_DETECTION.TOLERANCE_FRACTION);

    let thickness = 1;

    // Check in the negative direction (above for horizontal, left for vertical)
    for (let delta = 1; delta <= maxDelta; delta++) {
        const checkPos = position - delta;
        if (checkPos < 0) break;

        const checkRun = findLongestDarkRun(ctx, checkPos, direction);
        if (
            checkRun.length >= run.length * LINE_DETECTION.RUN_MATCH_FRACTION &&
            Math.abs(checkRun.start - run.start) < tolerance
        ) {
            thickness++;
        } else {
            break;
        }
    }

    // Check in the positive direction (below for horizontal, right for vertical)
    for (let delta = 1; delta <= maxDelta; delta++) {
        const checkPos = position + delta;
        if (checkPos >= limit) break;

        const checkRun = findLongestDarkRun(ctx, checkPos, direction);
        if (
            checkRun.length >= run.length * LINE_DETECTION.RUN_MATCH_FRACTION &&
            Math.abs(checkRun.start - run.start) < tolerance
        ) {
            thickness++;
        } else {
            break;
        }
    }

    return thickness;
}

function calculateLineConfidence(
    runLength: number,
    dimension: number,
    thickness: number,
    expectedThickness: number
): number {
    const lengthScore = Math.min(1, runLength / (dimension * LINE_DETECTION.MIN_LENGTH_FRACTION));
    const thicknessScore = thickness >= expectedThickness ? 1 : thickness / expectedThickness;
    return lengthScore * CONFIDENCE.LENGTH_WEIGHT + thicknessScore * CONFIDENCE.THICKNESS_WEIGHT;
}

function findBorderCandidates(
    ctx: ImageContext,
    startPos: number,
    endPos: number,
    direction: ScanDirection,
    scanForward: boolean
): LineCandidate[] {
    const candidates: LineCandidate[] = [];
    const dimension = direction === "horizontal" ? ctx.width : ctx.height;
    const minLength = dimension * ctx.config.minBorderFraction;

    const positions = scanForward
        ? Array.from({ length: endPos - startPos }, (_, i) => startPos + i)
        : Array.from({ length: startPos - endPos }, (_, i) => startPos - i);

    for (const pos of positions) {
        const run = findLongestDarkRun(ctx, pos, direction);

        if (run.length >= minLength) {
            const thickness = measureLineThickness(ctx, pos, run, direction);
            const confidence = calculateLineConfidence(
                run.length,
                dimension,
                thickness,
                ctx.config.expectedBorderThickness
            );

            if (confidence >= CONFIDENCE.MIN_CANDIDATE) {
                candidates.push({
                    position: pos,
                    runStart: run.start,
                    runLength: run.length,
                    thickness,
                    confidence,
                });
            }
        }
    }

    return candidates;
}

function selectBestCandidate(candidates: LineCandidate[], preferOutermost: boolean): LineCandidate | null {
    if (candidates.length === 0) return null;

    // Sort by position
    candidates.sort((a, b) => (preferOutermost ? a.position - b.position : b.position - a.position));

    const outermost = candidates[0];
    const highestConfidence = candidates.reduce((max, c) => (c.confidence > max.confidence ? c : max), candidates[0]);

    if (outermost.confidence >= CONFIDENCE.MIN_OUTERMOST) {
        return outermost;
    }

    if (highestConfidence.confidence - outermost.confidence > CONFIDENCE.CONFIDENCE_DIFF_THRESHOLD) {
        const distance = Math.abs(highestConfidence.position - outermost.position);
        if (distance < 50) {
            return highestConfidence;
        }
    }

    return outermost;
}

// =============================================================================
// BORDER FINDING
// =============================================================================

function findHorizontalBorders(ctx: ImageContext): {
    top: LineCandidate | null;
    bottom: LineCandidate | null;
} {
    const { searchRegions } = ctx.config;
    const topEndY = Math.floor(ctx.height * searchRegions.topMaxY);
    const bottomStartY = Math.floor(ctx.height * searchRegions.bottomMinY);

    // Find top candidates
    const topCandidates = findBorderCandidates(ctx, 0, topEndY, "horizontal", true);
    topCandidates.sort((a, b) => a.position - b.position);
    const topCandidate = topCandidates[0] || null;

    if (!topCandidate) {
        return { top: null, bottom: null };
    }

    // Find bottom candidates and validate alignment with top
    const bottomCandidates = findBorderCandidates(ctx, ctx.height - 1, bottomStartY, "horizontal", false);
    bottomCandidates.sort((a, b) => b.position - a.position);

    let bestBottom: LineCandidate | null = null;

    for (const bottom of bottomCandidates) {
        const startDiff = Math.abs(bottom.runStart - topCandidate.runStart);
        const lengthDiff = Math.abs(bottom.runLength - topCandidate.runLength);

        const isWellAligned =
            startDiff <= ALIGNMENT.WELL_ALIGNED_PX && lengthDiff <= topCandidate.runLength * ALIGNMENT.WELL_ALIGNED_PCT;

        const isAcceptablyAligned =
            startDiff <= ALIGNMENT.ACCEPTABLE_PX && lengthDiff <= topCandidate.runLength * ALIGNMENT.ACCEPTABLE_PCT;

        if (DEBUG_GRID_DETECTION && !bestBottom) {
            const pct = ((lengthDiff / topCandidate.runLength) * 100).toFixed(1);
            console.log(
                `  Checking bottom at y=${bottom.position}: startDiff=${startDiff}px, lengthDiff=${lengthDiff}px (${pct}%)`
            );
        }

        if (isWellAligned) {
            bestBottom = bottom;
            if (DEBUG_GRID_DETECTION) {
                console.log("  -> Well aligned, using this as bottom border");
            }
            break;
        }

        if (!bestBottom && isAcceptablyAligned) {
            bestBottom = bottom;
            if (DEBUG_GRID_DETECTION) {
                console.log("  -> Acceptably aligned, using as fallback");
            }
        }
    }

    if (!bestBottom && bottomCandidates.length > 0) {
        bestBottom = bottomCandidates[0];
        if (DEBUG_GRID_DETECTION) {
            console.log(`  -> No aligned bottom found, using outermost at y=${bestBottom.position}`);
        }
    }

    if (DEBUG_GRID_DETECTION && topCandidate && bestBottom) {
        console.log("Top/Bottom alignment result:");
        console.log(
            `  Top: y=${topCandidate.position}, x=${topCandidate.runStart}-${topCandidate.runStart + topCandidate.runLength}`
        );
        console.log(
            `  Bottom: y=${bestBottom.position}, x=${bestBottom.runStart}-${bestBottom.runStart + bestBottom.runLength}`
        );
    }

    return { top: topCandidate, bottom: bestBottom };
}

function findVerticalBorderNear(ctx: ImageContext, expectedX: number, side: "left" | "right"): LineCandidate | null {
    const tolerance = ALIGNMENT.VERTICAL_SEARCH_TOLERANCE;
    const startX = Math.max(0, expectedX - tolerance);
    const endX = Math.min(ctx.width - 1, expectedX + tolerance);
    const minLength = ctx.height * ctx.config.minBorderFraction;

    if (DEBUG_GRID_DETECTION) {
        console.log(`  Searching for ${side} border near x=${expectedX} (range: ${startX}-${endX})`);
    }

    const candidates: LineCandidate[] = [];

    for (let x = startX; x <= endX; x++) {
        const run = findLongestDarkRun(ctx, x, "vertical");

        if (run.length >= minLength) {
            const thickness = measureLineThickness(ctx, x, run, "vertical");
            const lengthScore = Math.min(1, run.length / (ctx.height * LINE_DETECTION.MIN_LENGTH_FRACTION));
            const thicknessScore =
                thickness >= ctx.config.expectedBorderThickness ? 1 : thickness / ctx.config.expectedBorderThickness;

            const positionBonus = 1 - (Math.abs(x - expectedX) / tolerance) * ALIGNMENT.POSITION_BONUS_FACTOR;
            const confidence =
                (lengthScore * CONFIDENCE.LENGTH_WEIGHT * 0.83 + thicknessScore * CONFIDENCE.THICKNESS_WEIGHT * 0.75) *
                positionBonus;

            if (confidence >= CONFIDENCE.MIN_CANDIDATE_NEAR) {
                candidates.push({
                    position: x,
                    runStart: run.start,
                    runLength: run.length,
                    thickness,
                    confidence,
                });
            }
        }
    }

    if (candidates.length === 0) {
        if (DEBUG_GRID_DETECTION) {
            console.log(`  No vertical line found near x=${expectedX} (+-${tolerance}px)`);
        }
        return null;
    }

    // For left side prefer leftmost, for right side prefer rightmost
    candidates.sort((a, b) => (side === "left" ? a.position - b.position : b.position - a.position));

    if (DEBUG_GRID_DETECTION) {
        console.log(`  Found ${candidates.length} candidates, best at x=${candidates[0].position}`);
    }

    return candidates[0];
}

function findVerticalBorders(
    ctx: ImageContext,
    horizontalBorders: {
        top: LineCandidate | null;
        bottom: LineCandidate | null;
    }
): { left: LineCandidate | null; right: LineCandidate | null } {
    const { searchRegions } = ctx.config;

    // If we have horizontal borders, use their endpoints to guide vertical search
    if (horizontalBorders.top && horizontalBorders.bottom) {
        const leftSearchCenter = Math.round((horizontalBorders.top.runStart + horizontalBorders.bottom.runStart) / 2);
        const rightSearchCenter = Math.round(
            (horizontalBorders.top.runStart +
                horizontalBorders.top.runLength +
                horizontalBorders.bottom.runStart +
                horizontalBorders.bottom.runLength) /
                2
        );

        if (DEBUG_GRID_DETECTION) {
            console.log("Vertical search guided by horizontal lines:");
            console.log(`  Left search center: x=${leftSearchCenter} (+-30px)`);
            console.log(`  Right search center: x=${rightSearchCenter} (+-30px)`);
        }

        const left = findVerticalBorderNear(ctx, leftSearchCenter, "left");
        const right = findVerticalBorderNear(ctx, rightSearchCenter, "right");

        return { left, right };
    }

    // Fallback: search full regions
    const leftEndX = Math.floor(ctx.width * searchRegions.leftMaxX);
    const rightStartX = Math.floor(ctx.width * searchRegions.rightMinX);

    const leftCandidates = findBorderCandidates(ctx, 0, leftEndX, "vertical", true);
    const rightCandidates = findBorderCandidates(ctx, ctx.width - 1, rightStartX, "vertical", false);

    return {
        left: selectBestCandidate(leftCandidates, true),
        right: selectBestCandidate(rightCandidates, false),
    };
}

function createSyntheticVerticalBorder(
    topBorder: LineCandidate,
    bottomBorder: LineCandidate,
    xPosition: number
): LineCandidate {
    return {
        position: xPosition,
        runStart: topBorder.position,
        runLength: bottomBorder.position - topBorder.position,
        thickness: 1,
        confidence: 0.6,
    };
}

function resolveVerticalBorders(
    horizontalBorders: { top: LineCandidate; bottom: LineCandidate },
    verticalBorders: { left: LineCandidate | null; right: LineCandidate | null }
): { left: LineCandidate; right: LineCandidate } | null {
    const { top, bottom } = horizontalBorders;
    let { left, right } = verticalBorders;

    const expectedLeftX = Math.round((top.runStart + bottom.runStart) / 2);
    const expectedRightX = Math.round((top.runStart + top.runLength + bottom.runStart + bottom.runLength) / 2);

    const leftMisalignment = left ? Math.abs(left.position - expectedLeftX) : Infinity;
    const rightMisalignment = right ? Math.abs(right.position - expectedRightX) : Infinity;

    if (DEBUG_GRID_DETECTION) {
        console.log("Vertical line alignment check:");
        console.log(
            `  Expected left: x=${expectedLeftX}, detected: x=${left?.position ?? "none"}, off by ${leftMisalignment}px`
        );
        console.log(
            `  Expected right: x=${expectedRightX}, detected: x=${right?.position ?? "none"}, off by ${rightMisalignment}px`
        );
    }

    if (!left || leftMisalignment > ALIGNMENT.VERTICAL_MISALIGNMENT_THRESHOLD) {
        if (DEBUG_GRID_DETECTION) {
            console.log(`  Using horizontal line start (x=${expectedLeftX}) for left border`);
        }
        left = createSyntheticVerticalBorder(top, bottom, expectedLeftX);
    }

    if (!right || rightMisalignment > ALIGNMENT.VERTICAL_MISALIGNMENT_THRESHOLD) {
        if (DEBUG_GRID_DETECTION) {
            console.log(`  Using horizontal line end (x=${expectedRightX}) for right border`);
        }
        right = createSyntheticVerticalBorder(top, bottom, expectedRightX);
    }

    return { left, right };
}

// =============================================================================
// VALIDATION
// =============================================================================

function verifyCorner(ctx: ImageContext, x: number, y: number, cornerType: CornerType): boolean {
    const checkSize = ctx.config.cornerDetection.cornerSize;
    const tolerance = CORNER.POSITION_TOLERANCE;

    // Determine check directions based on the corner type
    const hDir = cornerType.includes("Left") ? 1 : -1;
    const vDir = cornerType.includes("top") ? 1 : -1;

    // Check if the corner region has dark pixels
    let cornerFound = false;
    for (let dy = -tolerance; dy <= tolerance && !cornerFound; dy++) {
        for (let dx = -tolerance; dx <= tolerance && !cornerFound; dx++) {
            if (isDarkPixel(ctx, x + dx, y + dy)) {
                cornerFound = true;
            }
        }
    }

    if (!cornerFound) {
        if (DEBUG_GRID_DETECTION) {
            console.log(`  Corner ${cornerType} failed: no dark pixel near (${x}, ${y})`);
        }
        return false;
    }

    // Check horizontal arm
    let hDarkCount = 0;
    for (let i = 0; i < checkSize; i++) {
        const checkX = x + i * hDir;
        for (let dy = -CORNER.ARM_CHECK_TOLERANCE; dy <= CORNER.ARM_CHECK_TOLERANCE; dy++) {
            if (isDarkPixel(ctx, checkX, y + dy)) {
                hDarkCount++;
                break;
            }
        }
    }

    // Check vertical arm
    let vDarkCount = 0;
    for (let i = 0; i < checkSize; i++) {
        const checkY = y + i * vDir;
        for (let dx = -CORNER.ARM_CHECK_TOLERANCE; dx <= CORNER.ARM_CHECK_TOLERANCE; dx++) {
            if (isDarkPixel(ctx, x + dx, checkY)) {
                vDarkCount++;
                break;
            }
        }
    }

    const hRatio = hDarkCount / checkSize;
    const vRatio = vDarkCount / checkSize;
    const isValid = hRatio >= CORNER.MIN_ARM_RATIO && vRatio >= CORNER.MIN_ARM_RATIO;

    if (DEBUG_GRID_DETECTION) {
        console.log(
            `  Corner ${cornerType} at (${x}, ${y}): hArm=${(hRatio * 100).toFixed(0)}%, vArm=${(vRatio * 100).toFixed(0)}% -> ${isValid ? "VALID" : "INVALID"}`
        );
    }

    return isValid;
}

function validateCorners(ctx: ImageContext, borders: DetectedBorders): number {
    const corners: Record<CornerType, boolean> = {
        topLeft: verifyCorner(ctx, borders.left.position, borders.top.position, "topLeft"),
        topRight: verifyCorner(ctx, borders.right.position, borders.top.position, "topRight"),
        bottomLeft: verifyCorner(ctx, borders.left.position, borders.bottom.position, "bottomLeft"),
        bottomRight: verifyCorner(ctx, borders.right.position, borders.bottom.position, "bottomRight"),
    };

    const validCount = Object.values(corners).filter(Boolean).length;

    if (DEBUG_GRID_DETECTION) {
        console.log(`Valid corners: ${validCount}/4`);
    }

    return validCount;
}

function checkBorderAlignment(borders: DetectedBorders): AlignmentResult {
    const { top, bottom, left, right } = borders;
    const tolerance = ALIGNMENT.BORDER_TOLERANCE_PX;

    const alignments = [
        Math.abs(top.runStart - left.position),
        Math.abs(top.runStart + top.runLength - right.position),
        Math.abs(bottom.runStart - left.position),
        Math.abs(bottom.runStart + bottom.runLength - right.position),
        Math.abs(left.runStart - top.position),
        Math.abs(left.runStart + left.runLength - bottom.position),
        Math.abs(right.runStart - top.position),
        Math.abs(right.runStart + right.runLength - bottom.position),
    ];

    const goodAlignments = alignments.filter((a) => a <= tolerance).length;
    const score = goodAlignments / alignments.length;

    if (DEBUG_GRID_DETECTION) {
        console.log("Border alignment check:");
        console.log(`  Top line: starts at x=${top.runStart}, ends at x=${top.runStart + top.runLength}`);
        console.log(`  Left border at x=${left.position}, Right border at x=${right.position}`);
        console.log(`  Score: ${(score * 100).toFixed(0)}% (${goodAlignments}/8 within ${tolerance}px)`);
    }

    return {
        score,
        aligned: score >= ALIGNMENT.MIN_ALIGNED_FRACTION,
    };
}

// =============================================================================
// INTERNAL GRID LINE DETECTION
// =============================================================================

export function findInternalGridLines(ctx: ImageContext, bounds: GridBounds, direction: ScanDirection): number[] {
    const lines: number[] = [];
    const dimension = direction === "horizontal" ? bounds.width : bounds.height;
    const minRunLength = dimension * LINE_DETECTION.MIN_LENGTH_FRACTION;

    const startOffset = LINE_DETECTION.INTERNAL_LINE_MARGIN;
    const startBound = direction === "horizontal" ? bounds.y : bounds.x;
    const endBound = direction === "horizontal" ? bounds.y + bounds.height : bounds.x + bounds.width;

    for (let pos = startBound + startOffset; pos < endBound - startOffset; pos++) {
        const run = findLongestDarkRun(ctx, pos, direction);

        const boundsStart = direction === "horizontal" ? bounds.x : bounds.y;
        const boundsSize = direction === "horizontal" ? bounds.width : bounds.height;

        const spansGrid =
            run.length >= minRunLength &&
            run.start <= boundsStart + boundsSize * LINE_DETECTION.INTERNAL_LINE_SPAN_START &&
            run.start + run.length >= boundsStart + boundsSize * LINE_DETECTION.INTERNAL_LINE_SPAN_END;

        if (spansGrid) {
            if (lines.length === 0 || pos - (lines.at(-1) || 0) > LINE_DETECTION.LINE_GAP_THRESHOLD) {
                lines.push(pos);
            }
        }
    }

    return lines;
}

export function analyzeGridLineSpacing(lines: number[], spacingTolerance: number): SpacingAnalysis {
    if (lines.length < GRID_SPACING.MIN_LINES_FOR_ANALYSIS) {
        return { isRegular: false, consistency: 0 };
    }

    const spacings: number[] = [];
    for (let i = 1; i < lines.length; i++) {
        spacings.push(lines[i] - lines[i - 1]);
    }

    const sortedSpacings = [...spacings].sort((a, b) => a - b);
    const medianSpacing = sortedSpacings[Math.floor(sortedSpacings.length / 2)];
    const tolerance = medianSpacing * spacingTolerance;

    const consistentCount = spacings.filter((s) => Math.abs(s - medianSpacing) <= tolerance).length;

    const consistency = consistentCount / spacings.length;

    return {
        isRegular: consistency >= GRID_SPACING.MIN_CONSISTENCY,
        consistency,
    };
}

// =============================================================================
// CONFIDENCE SCORING
// =============================================================================

function calculateOverallConfidence(
    borders: DetectedBorders,
    validCorners: number,
    alignmentScore: number,
    gridLineConfidence: number
): number {
    const borderConfidence =
        (borders.top.confidence + borders.bottom.confidence + borders.left.confidence + borders.right.confidence) / 4;

    const cornerConfidence = validCorners / 4;

    return (
        borderConfidence * CONFIDENCE.BORDER_WEIGHT +
        cornerConfidence * CONFIDENCE.CORNER_WEIGHT +
        alignmentScore * CONFIDENCE.ALIGNMENT_WEIGHT +
        gridLineConfidence * CONFIDENCE.GRID_LINE_WEIGHT
    );
}

function calculateGridLineConfidence(ctx: ImageContext, bounds: GridBounds): number {
    if (!ctx.config.gridLineVerification.enabled) {
        return 1;
    }

    const hLines = findInternalGridLines(ctx, bounds, "horizontal");
    const vLines = findInternalGridLines(ctx, bounds, "vertical");
    const totalLines = hLines.length + vLines.length;

    if (DEBUG_GRID_DETECTION) {
        console.log(`Internal lines found: ${hLines.length} horizontal, ${vLines.length} vertical`);
    }

    if (totalLines < ctx.config.gridLineVerification.minInternalLines) {
        return 1;
    }

    const hAnalysis = analyzeGridLineSpacing(hLines, ctx.config.gridLineVerification.spacingTolerance);
    const vAnalysis = analyzeGridLineSpacing(vLines, ctx.config.gridLineVerification.spacingTolerance);

    if (DEBUG_GRID_DETECTION) {
        console.log("Horizontal spacing:", hAnalysis);
        console.log("Vertical spacing:", vAnalysis);
    }

    let confidence = (hAnalysis.consistency + vAnalysis.consistency) / 2;

    if (hAnalysis.isRegular || vAnalysis.isRegular) {
        confidence = Math.min(1, confidence + CONFIDENCE.REGULARITY_BOOST);
    }

    return confidence;
}

// =============================================================================
// PUBLIC API
// =============================================================================

function mergeConfig(userConfig?: Partial<GridDetectionConfig>): GridDetectionConfig {
    if (!userConfig) return DEFAULT_DETECTION_CONFIG;

    return {
        ...DEFAULT_DETECTION_CONFIG,
        ...userConfig,
        searchRegions: {
            ...DEFAULT_DETECTION_CONFIG.searchRegions,
            ...userConfig.searchRegions,
        },
        cornerDetection: {
            ...DEFAULT_DETECTION_CONFIG.cornerDetection,
            ...userConfig.cornerDetection,
        },
        gridLineVerification: {
            ...DEFAULT_DETECTION_CONFIG.gridLineVerification,
            ...userConfig.gridLineVerification,
        },
    };
}

/** Extracts grid area using fixed default margins (fallback method) */
export function extractGridArea(canvas: HTMLCanvasElement): GridBounds {
    const width = canvas.width;
    const height = canvas.height;

    return {
        x: Math.floor(width * DEFAULT_MARGINS.left),
        y: Math.floor(height * DEFAULT_MARGINS.top),
        width: Math.floor(width * (1 - DEFAULT_MARGINS.left - DEFAULT_MARGINS.right)),
        height: Math.floor(height * (1 - DEFAULT_MARGINS.top - DEFAULT_MARGINS.bottom)),
    };
}

/** Detects black borderlines surrounding the grid and crops to inside them */
export function extractGridWithoutAxisNumbers(canvas: HTMLCanvasElement, config?: StitchConfig): GridBounds {
    const detectionConfig = mergeConfig(config?.gridDetection);
    return detectGridBoundaries(canvas, detectionConfig);
}

/** Crops a canvas to the specified bounds, returning a new canvas */
export function cropToGrid(sourceCanvas: HTMLCanvasElement, bounds: GridBounds): HTMLCanvasElement {
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = bounds.width;
    croppedCanvas.height = bounds.height;

    const ctx = croppedCanvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not get canvas 2D context");
    }

    ctx.drawImage(sourceCanvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);

    if (DEBUG_GRID_DETECTION) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, bounds.width - 4, bounds.height - 4);
        console.debug("Grid bounds detected:", bounds);
    }

    return croppedCanvas;
}

/** Debug: Draws detected bounds on the source canvas */
export function drawDebugBounds(canvas: HTMLCanvasElement, bounds: GridBounds): void {
    if (!DEBUG_GRID_DETECTION) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    const markerSize = 20;
    ctx.fillStyle = "red";

    // Corner markers
    ctx.fillRect(bounds.x, bounds.y, markerSize, 3);
    ctx.fillRect(bounds.x, bounds.y, 3, markerSize);
    ctx.fillRect(bounds.x + bounds.width - markerSize, bounds.y, markerSize, 3);
    ctx.fillRect(bounds.x + bounds.width - 3, bounds.y, 3, markerSize);
    ctx.fillRect(bounds.x, bounds.y + bounds.height - 3, markerSize, 3);
    ctx.fillRect(bounds.x, bounds.y + bounds.height - markerSize, 3, markerSize);
    ctx.fillRect(bounds.x + bounds.width - markerSize, bounds.y + bounds.height - 3, markerSize, 3);
    ctx.fillRect(bounds.x + bounds.width - 3, bounds.y + bounds.height - markerSize, 3, markerSize);

    ctx.font = "16px monospace";
    ctx.fillText(`Bounds: (${bounds.x}, ${bounds.y}) ${bounds.width}x${bounds.height}`, bounds.x + 10, bounds.y - 10);
}

/** Main grid detection algorithm - detects borders and validates grid structure */
export function detectGridBoundaries(
    canvas: HTMLCanvasElement,
    config: GridDetectionConfig = DEFAULT_DETECTION_CONFIG
): GridBounds {
    // Create image context
    const ctx = createImageContext(canvas, config);
    if (!ctx) {
        return extractGridArea(canvas);
    }

    if (DEBUG_GRID_DETECTION) {
        console.log("=== Grid Detection Debug ===");
        console.log(`Canvas: ${ctx.width}x${ctx.height}`);
    }

    // Step 1: Find horizontal borders
    const horizontalBorders = findHorizontalBorders(ctx);

    if (DEBUG_GRID_DETECTION) {
        console.log("Horizontal candidates found:");
        console.log("  Top:", horizontalBorders.top);
        console.log("  Bottom:", horizontalBorders.bottom);
    }

    if (!horizontalBorders.top || !horizontalBorders.bottom) {
        if (DEBUG_GRID_DETECTION) {
            console.log("Detection FAILED - missing horizontal border(s)");
        }
        return extractGridArea(canvas);
    }

    // Step 2: Find vertical borders (guided by horizontal)
    const verticalBorders = findVerticalBorders(ctx, horizontalBorders);

    if (DEBUG_GRID_DETECTION) {
        console.log("Vertical candidates found:");
        console.log("  Left:", verticalBorders.left);
        console.log("  Right:", verticalBorders.right);
    }

    // Step 3: Resolve vertical borders (use synthetic if needed)
    const resolvedVertical = resolveVerticalBorders(
        { top: horizontalBorders.top, bottom: horizontalBorders.bottom },
        verticalBorders
    );

    if (!resolvedVertical) {
        if (DEBUG_GRID_DETECTION) {
            console.log("Detection FAILED - could not resolve vertical borders");
        }
        return extractGridArea(canvas);
    }

    const borders: DetectedBorders = {
        top: horizontalBorders.top,
        bottom: horizontalBorders.bottom,
        left: resolvedVertical.left,
        right: resolvedVertical.right,
    };

    // Step 4: Check border alignment
    const alignment = checkBorderAlignment(borders);

    if (!alignment.aligned && DEBUG_GRID_DETECTION) {
        console.log("Detection WARNING - borders poorly aligned, attempting to continue...");
    }

    // Step 5: Validate corners
    const validCorners = validateCorners(ctx, borders);

    if (validCorners < 2 && !alignment.aligned) {
        if (DEBUG_GRID_DETECTION) {
            console.log("Detection FAILED - insufficient valid corners and poor alignment");
        }
        return extractGridArea(canvas);
    }

    // Step 6: Calculate preliminary bounds
    const preliminaryBounds: GridBounds = {
        x: borders.left.position,
        y: borders.top.position,
        width: borders.right.position - borders.left.position,
        height: borders.bottom.position - borders.top.position,
    };

    // Step 7: Validate size
    if (
        preliminaryBounds.width < ctx.width * config.minBorderFraction ||
        preliminaryBounds.height < ctx.height * config.minBorderFraction
    ) {
        if (DEBUG_GRID_DETECTION) {
            console.log("Detection FAILED - detected grid too small");
        }
        return extractGridArea(canvas);
    }

    // Step 8: Calculate grid line confidence
    const gridLineConfidence = calculateGridLineConfidence(ctx, preliminaryBounds);

    // Step 9: Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(borders, validCorners, alignment.score, gridLineConfidence);

    if (DEBUG_GRID_DETECTION) {
        const borderConf =
            (borders.top.confidence + borders.bottom.confidence + borders.left.confidence + borders.right.confidence) /
            4;
        console.log("Confidence scores:");
        console.log(`  Borders: ${(borderConf * 100).toFixed(1)}%`);
        console.log(`  Corners: ${((validCorners / 4) * 100).toFixed(1)}%`);
        console.log(`  Alignment: ${(alignment.score * 100).toFixed(1)}%`);
        console.log(`  Grid lines: ${(gridLineConfidence * 100).toFixed(1)}%`);
        console.log(`  Overall: ${(overallConfidence * 100).toFixed(1)}%`);
    }

    if (overallConfidence < CONFIDENCE.MIN_OVERALL) {
        if (DEBUG_GRID_DETECTION) {
            console.log("Detection FAILED - confidence too low");
        }
        return extractGridArea(canvas);
    }

    // Step 10: Apply border expansion and return final bounds
    const expansion = config.borderExpansion;
    const finalBounds: GridBounds = {
        x: Math.max(0, preliminaryBounds.x - expansion),
        y: Math.max(0, preliminaryBounds.y - expansion),
        width: Math.min(ctx.width - preliminaryBounds.x + expansion, preliminaryBounds.width + expansion * 2),
        height: Math.min(ctx.height - preliminaryBounds.y + expansion, preliminaryBounds.height + expansion * 2),
    };

    if (DEBUG_GRID_DETECTION) {
        console.log("Detection SUCCESS!");
        console.log(`Final bounds: (${finalBounds.x}, ${finalBounds.y}) ${finalBounds.width}x${finalBounds.height}`);
    }

    return finalBounds;
}
