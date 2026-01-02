/**
 * Server-side grid detection using Sharp.
 * Uses raw buffer pixel access for efficient image processing.
 */

import sharp from "sharp";
import type { GridBounds, GridDetectionConfig, StitchConfig } from "@/lib/tools/merge/types";
import {
    CONFIDENCE,
    ALIGNMENT,
    LINE_DETECTION,
    CORNER,
    GRID_SPACING,
    DEFAULT_DETECTION_CONFIG,
    DEFAULT_MARGINS,
} from "@/lib/tools/merge/constants";

// Re-export for consumers that import from this file
export { DEFAULT_DETECTION_CONFIG };

// =============================================================================
// TYPES
// =============================================================================

type ScanDirection = "horizontal" | "vertical";
type CornerType = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

interface DarkRun {
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

interface ImageContext {
    data: Buffer;
    width: number;
    height: number;
    channels: number;
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

interface SpacingAnalysis {
    isRegular: boolean;
    consistency: number;
}

// =============================================================================
// IMAGE CONTEXT CREATION
// =============================================================================

export async function createImageContext(imageBuffer: Buffer, config: GridDetectionConfig): Promise<ImageContext> {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
        throw new Error("Could not read image dimensions");
    }

    // Get raw pixel data (RGB or RGBA)
    const { data, info } = await image
        .ensureAlpha() // Ensure we have RGBA for consistent indexing
        .raw()
        .toBuffer({ resolveWithObject: true });

    return {
        data,
        width: info.width,
        height: info.height,
        channels: info.channels,
        config,
    };
}

// =============================================================================
// PIXEL ANALYSIS
// =============================================================================

function isDarkPixel(ctx: ImageContext, x: number, y: number): boolean {
    if (x < 0 || x >= ctx.width || y < 0 || y >= ctx.height) return false;

    const idx = (y * ctx.width + x) * ctx.channels;
    const r = ctx.data[idx];
    const g = ctx.data[idx + 1];
    const b = ctx.data[idx + 2];

    return r < ctx.config.darkPixelThreshold && g < ctx.config.darkPixelThreshold && b < ctx.config.darkPixelThreshold;
}

// =============================================================================
// LINE DETECTION
// =============================================================================

function findLongestDarkRun(ctx: ImageContext, position: number, direction: ScanDirection): DarkRun {
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

    // Check in the negative direction
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

    // Check in the positive direction
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

    const topCandidates = findBorderCandidates(ctx, 0, topEndY, "horizontal", true);
    topCandidates.sort((a, b) => a.position - b.position);
    const topCandidate = topCandidates[0] || null;

    if (!topCandidate) {
        return { top: null, bottom: null };
    }

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

        if (isWellAligned) {
            bestBottom = bottom;
            break;
        }

        if (!bestBottom && isAcceptablyAligned) {
            bestBottom = bottom;
        }
    }

    if (!bestBottom && bottomCandidates.length > 0) {
        bestBottom = bottomCandidates[0];
    }

    return { top: topCandidate, bottom: bestBottom };
}

function findVerticalBorderNear(ctx: ImageContext, expectedX: number, side: "left" | "right"): LineCandidate | null {
    const tolerance = ALIGNMENT.VERTICAL_SEARCH_TOLERANCE;
    const startX = Math.max(0, expectedX - tolerance);
    const endX = Math.min(ctx.width - 1, expectedX + tolerance);
    const minLength = ctx.height * ctx.config.minBorderFraction;

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

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => (side === "left" ? a.position - b.position : b.position - a.position));
    return candidates[0];
}

function findVerticalBorders(
    ctx: ImageContext,
    horizontalBorders: { top: LineCandidate | null; bottom: LineCandidate | null }
): { left: LineCandidate | null; right: LineCandidate | null } {
    const { searchRegions } = ctx.config;

    if (horizontalBorders.top && horizontalBorders.bottom) {
        const leftSearchCenter = Math.round((horizontalBorders.top.runStart + horizontalBorders.bottom.runStart) / 2);
        const rightSearchCenter = Math.round(
            (horizontalBorders.top.runStart +
                horizontalBorders.top.runLength +
                horizontalBorders.bottom.runStart +
                horizontalBorders.bottom.runLength) /
                2
        );

        const left = findVerticalBorderNear(ctx, leftSearchCenter, "left");
        const right = findVerticalBorderNear(ctx, rightSearchCenter, "right");

        return { left, right };
    }

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

    if (!left || leftMisalignment > ALIGNMENT.VERTICAL_MISALIGNMENT_THRESHOLD) {
        left = createSyntheticVerticalBorder(top, bottom, expectedLeftX);
    }

    if (!right || rightMisalignment > ALIGNMENT.VERTICAL_MISALIGNMENT_THRESHOLD) {
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

    const hDir = cornerType.includes("Left") ? 1 : -1;
    const vDir = cornerType.includes("top") ? 1 : -1;

    let cornerFound = false;
    for (let dy = -tolerance; dy <= tolerance && !cornerFound; dy++) {
        for (let dx = -tolerance; dx <= tolerance && !cornerFound; dx++) {
            if (isDarkPixel(ctx, x + dx, y + dy)) {
                cornerFound = true;
            }
        }
    }

    if (!cornerFound) return false;

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

    return hRatio >= CORNER.MIN_ARM_RATIO && vRatio >= CORNER.MIN_ARM_RATIO;
}

function validateCorners(ctx: ImageContext, borders: DetectedBorders): number {
    const corners: Record<CornerType, boolean> = {
        topLeft: verifyCorner(ctx, borders.left.position, borders.top.position, "topLeft"),
        topRight: verifyCorner(ctx, borders.right.position, borders.top.position, "topRight"),
        bottomLeft: verifyCorner(ctx, borders.left.position, borders.bottom.position, "bottomLeft"),
        bottomRight: verifyCorner(ctx, borders.right.position, borders.bottom.position, "bottomRight"),
    };

    return Object.values(corners).filter(Boolean).length;
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

    return {
        score,
        aligned: score >= ALIGNMENT.MIN_ALIGNED_FRACTION,
    };
}

// =============================================================================
// INTERNAL GRID LINE DETECTION
// =============================================================================

function findInternalGridLines(ctx: ImageContext, bounds: GridBounds, direction: ScanDirection): number[] {
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

function analyzeGridLineSpacing(lines: number[], spacingTolerance: number): SpacingAnalysis {
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

    if (totalLines < ctx.config.gridLineVerification.minInternalLines) {
        return 1;
    }

    const hAnalysis = analyzeGridLineSpacing(hLines, ctx.config.gridLineVerification.spacingTolerance);
    const vAnalysis = analyzeGridLineSpacing(vLines, ctx.config.gridLineVerification.spacingTolerance);

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
export function extractGridArea(width: number, height: number): GridBounds {
    return {
        x: Math.floor(width * DEFAULT_MARGINS.left),
        y: Math.floor(height * DEFAULT_MARGINS.top),
        width: Math.floor(width * (1 - DEFAULT_MARGINS.left - DEFAULT_MARGINS.right)),
        height: Math.floor(height * (1 - DEFAULT_MARGINS.top - DEFAULT_MARGINS.bottom)),
    };
}

/** Main grid detection algorithm - detects borders and validates grid structure */
export async function detectGridBoundaries(
    imageBuffer: Buffer,
    config: GridDetectionConfig = DEFAULT_DETECTION_CONFIG
): Promise<GridBounds> {
    // Create image context
    const ctx = await createImageContext(imageBuffer, config);

    // Step 1: Find horizontal borders
    const horizontalBorders = findHorizontalBorders(ctx);

    if (!horizontalBorders.top || !horizontalBorders.bottom) {
        return extractGridArea(ctx.width, ctx.height);
    }

    // Step 2: Find vertical borders (guided by horizontal)
    const verticalBorders = findVerticalBorders(ctx, horizontalBorders);

    // Step 3: Resolve vertical borders (use synthetic if needed)
    const resolvedVertical = resolveVerticalBorders(
        { top: horizontalBorders.top, bottom: horizontalBorders.bottom },
        verticalBorders
    );

    if (!resolvedVertical) {
        return extractGridArea(ctx.width, ctx.height);
    }

    const borders: DetectedBorders = {
        top: horizontalBorders.top,
        bottom: horizontalBorders.bottom,
        left: resolvedVertical.left,
        right: resolvedVertical.right,
    };

    // Step 4: Check border alignment
    const alignment = checkBorderAlignment(borders);

    // Step 5: Validate corners
    const validCorners = validateCorners(ctx, borders);

    if (validCorners < 2 && !alignment.aligned) {
        return extractGridArea(ctx.width, ctx.height);
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
        return extractGridArea(ctx.width, ctx.height);
    }

    // Step 8: Calculate grid line confidence
    const gridLineConfidence = calculateGridLineConfidence(ctx, preliminaryBounds);

    // Step 9: Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(borders, validCorners, alignment.score, gridLineConfidence);

    if (overallConfidence < CONFIDENCE.MIN_OVERALL) {
        return extractGridArea(ctx.width, ctx.height);
    }

    // Step 10: Apply border expansion and return final bounds
    const expansion = config.borderExpansion;

    return {
        x: Math.max(0, preliminaryBounds.x - expansion),
        y: Math.max(0, preliminaryBounds.y - expansion),
        width: Math.min(ctx.width - preliminaryBounds.x + expansion, preliminaryBounds.width + expansion * 2),
        height: Math.min(ctx.height - preliminaryBounds.y + expansion, preliminaryBounds.height + expansion * 2),
    };
}

/** Crops an image buffer to the specified bounds using Sharp */
export async function cropToGrid(imageBuffer: Buffer, bounds: GridBounds): Promise<Buffer> {
    return sharp(imageBuffer)
        .extract({
            left: bounds.x,
            top: bounds.y,
            width: bounds.width,
            height: bounds.height,
        })
        .png()
        .toBuffer();
}

/** Detects grid and crops image, returning the cropped buffer */
export async function extractGridWithoutAxisNumbers(
    imageBuffer: Buffer,
    config?: StitchConfig
): Promise<{ buffer: Buffer; bounds: GridBounds }> {
    const detectionConfig = mergeConfig(config?.gridDetection);
    const bounds = await detectGridBoundaries(imageBuffer, detectionConfig);
    const croppedBuffer = await cropToGrid(imageBuffer, bounds);

    return { buffer: croppedBuffer, bounds };
}
