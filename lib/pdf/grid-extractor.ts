import type {GridBounds, GridDetectionConfig, StitchConfig} from './types'

/** When enabled, draws red border overlay on output canvas and logs detection steps */
export const DEBUG_GRID_DETECTION = false

const DEFAULT_DETECTION_CONFIG: GridDetectionConfig = {
  darkPixelThreshold: 50,
  maxGapPixels: 3,
  minBorderFraction: 0.4,
  borderExpansion: 0,      // Pixels to expand from detected border (0 = crop at border line)
  expectedBorderThickness: 2,
  thicknessTolerance: 2,
  searchRegions: {
    topMaxY: 0.35,
    bottomMinY: 0.65,
    leftMaxX: 0.30,
    rightMinX: 0.70,
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
}

/** Default margins (percentage of page dimensions) - fallback when detection fails */
const DEFAULT_MARGINS = {
  top: 0.12,
  bottom: 0.12,
  left: 0.08,
  right: 0.06,
}

interface LineCandidate {
  position: number    // Row (y) for horizontal, column (x) for vertical
  runStart: number    // Where the dark run starts
  runLength: number   // Length of the dark run
  thickness: number   // Adjacent rows/cols with similar runs
  confidence: number  // Score (0-1)
}

function mergeConfig(
    userConfig?: Partial<GridDetectionConfig>
): GridDetectionConfig {
  if (!userConfig) return DEFAULT_DETECTION_CONFIG

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
  }
}

/** Extracts grid area using fixed default margins (fallback method) */
export function extractGridArea(canvas: HTMLCanvasElement): GridBounds {
  const width = canvas.width
  const height = canvas.height

  const topMargin = Math.floor(height * DEFAULT_MARGINS.top)
  const bottomMargin = Math.floor(height * DEFAULT_MARGINS.bottom)
  const leftMargin = Math.floor(width * DEFAULT_MARGINS.left)
  const rightMargin = Math.floor(width * DEFAULT_MARGINS.right)

  return {
    x: leftMargin,
    y: topMargin,
    width: width - leftMargin - rightMargin,
    height: height - topMargin - bottomMargin,
  }
}

/** Detects black border lines surrounding the grid and crops to inside them */
export function extractGridWithoutAxisNumbers(
    canvas: HTMLCanvasElement,
    config?: StitchConfig
): GridBounds {
  const detectionConfig = mergeConfig(config?.gridDetection)
  return detectGridBoundaries(canvas, detectionConfig)
}

/** Crops a canvas to the specified bounds, returning a new canvas */
export function cropToGrid(
    sourceCanvas: HTMLCanvasElement,
    bounds: GridBounds
): HTMLCanvasElement {
  const croppedCanvas = document.createElement('canvas')
  croppedCanvas.width = bounds.width
  croppedCanvas.height = bounds.height

  const ctx = croppedCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas 2D context')
  }

  ctx.drawImage(
      sourceCanvas,
      bounds.x, bounds.y, bounds.width, bounds.height,
      0, 0, bounds.width, bounds.height
  )

  if (DEBUG_GRID_DETECTION) {
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, bounds.width - 4, bounds.height - 4)
    console.debug('Grid bounds detected:', bounds)
  }

  return croppedCanvas
}

/** Debug: Draws detected bounds on the source canvas */
export function drawDebugBounds(
    canvas: HTMLCanvasElement,
    bounds: GridBounds
): void {
  if (!DEBUG_GRID_DETECTION) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.strokeStyle = 'red'
  ctx.lineWidth = 3
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

  const markerSize = 20
  ctx.fillStyle = 'red'

  // Corner markers
  ctx.fillRect(bounds.x, bounds.y, markerSize, 3)
  ctx.fillRect(bounds.x, bounds.y, 3, markerSize)
  ctx.fillRect(bounds.x + bounds.width - markerSize, bounds.y, markerSize, 3)
  ctx.fillRect(bounds.x + bounds.width - 3, bounds.y, 3, markerSize)
  ctx.fillRect(bounds.x, bounds.y + bounds.height - 3, markerSize, 3)
  ctx.fillRect(bounds.x, bounds.y + bounds.height - markerSize, 3, markerSize)
  ctx.fillRect(bounds.x + bounds.width - markerSize, bounds.y + bounds.height - 3, markerSize, 3)
  ctx.fillRect(bounds.x + bounds.width - 3, bounds.y + bounds.height - markerSize, 3, markerSize)

  ctx.font = '16px monospace'
  ctx.fillText(
      `Bounds: (${bounds.x}, ${bounds.y}) ${bounds.width}×${bounds.height}`,
      bounds.x + 10,
      bounds.y - 10
  )
}

/** Main grid detection algorithm - detects borders and validates grid structure */
export function detectGridBoundaries(
    canvas: HTMLCanvasElement,
    config: GridDetectionConfig = DEFAULT_DETECTION_CONFIG
): GridBounds {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return extractGridArea(canvas)
  }

  const width = canvas.width
  const height = canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // --- Pixel Analysis ---

  const isDarkPixel = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false
    const idx = (y * width + x) * 4
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    return r < config.darkPixelThreshold &&
        g < config.darkPixelThreshold &&
        b < config.darkPixelThreshold
  }



  // --- Line Detection (with gap tolerance) ---

  const findLongestDarkRunInRow = (y: number): { start: number; length: number } => {
    let maxRun = { start: 0, length: 0 }
    let currentRun = { start: 0, length: 0 }
    let gapCount = 0

    for (let x = 0; x < width; x++) {
      if (isDarkPixel(x, y)) {
        if (currentRun.length === 0) currentRun.start = x
        currentRun.length++
        gapCount = 0
      } else {
        gapCount++
        if (gapCount <= config.maxGapPixels && currentRun.length > 0) {
          currentRun.length++
        } else {
          if (currentRun.length > maxRun.length) {
            maxRun = { ...currentRun }
          }
          currentRun = { start: 0, length: 0 }
          gapCount = 0
        }
      }
    }

    if (currentRun.length > maxRun.length) {
      maxRun = { ...currentRun }
    }

    return maxRun
  }

  const findLongestDarkRunInCol = (x: number): { start: number; length: number } => {
    let maxRun = { start: 0, length: 0 }
    let currentRun = { start: 0, length: 0 }
    let gapCount = 0

    for (let y = 0; y < height; y++) {
      if (isDarkPixel(x, y)) {
        if (currentRun.length === 0) currentRun.start = y
        currentRun.length++
        gapCount = 0
      } else {
        gapCount++
        if (gapCount <= config.maxGapPixels && currentRun.length > 0) {
          currentRun.length++
        } else {
          if (currentRun.length > maxRun.length) {
            maxRun = { ...currentRun }
          }
          currentRun = { start: 0, length: 0 }
          gapCount = 0
        }
      }
    }

    if (currentRun.length > maxRun.length) {
      maxRun = { ...currentRun }
    }

    return maxRun
  }

  // --- Thickness Detection ---

  const measureHorizontalThickness = (
      y: number,
      expectedStart: number,
      expectedLength: number
  ): number => {
    let thickness = 1
    const tolerance = Math.max(5, expectedLength * 0.05)

    // Check rows above
    for (let dy = 1; dy <= config.expectedBorderThickness + config.thicknessTolerance; dy++) {
      if (y - dy < 0) break
      const run = findLongestDarkRunInRow(y - dy)
      if (
          run.length >= expectedLength * 0.9 &&
          Math.abs(run.start - expectedStart) < tolerance
      ) {
        thickness++
      } else {
        break
      }
    }

    // Check rows below
    for (let dy = 1; dy <= config.expectedBorderThickness + config.thicknessTolerance; dy++) {
      if (y + dy >= height) break
      const run = findLongestDarkRunInRow(y + dy)
      if (
          run.length >= expectedLength * 0.9 &&
          Math.abs(run.start - expectedStart) < tolerance
      ) {
        thickness++
      } else {
        break
      }
    }

    return thickness
  }

  const measureVerticalThickness = (
      x: number,
      expectedStart: number,
      expectedLength: number
  ): number => {
    let thickness = 1
    const tolerance = Math.max(5, expectedLength * 0.05)

    // Check columns to the left
    for (let dx = 1; dx <= config.expectedBorderThickness + config.thicknessTolerance; dx++) {
      if (x - dx < 0) break
      const run = findLongestDarkRunInCol(x - dx)
      if (
          run.length >= expectedLength * 0.9 &&
          Math.abs(run.start - expectedStart) < tolerance
      ) {
        thickness++
      } else {
        break
      }
    }

    // Check columns to the right
    for (let dx = 1; dx <= config.expectedBorderThickness + config.thicknessTolerance; dx++) {
      if (x + dx >= width) break
      const run = findLongestDarkRunInCol(x + dx)
      if (
          run.length >= expectedLength * 0.9 &&
          Math.abs(run.start - expectedStart) < tolerance
      ) {
        thickness++
      } else {
        break
      }
    }

    return thickness
  }

  const findBestVerticalLine = (
      startX: number,
      endX: number,
      scanDirection: 'right' | 'left'
  ): LineCandidate | null => {
    const candidates: LineCandidate[] = []
    const minLength = height * config.minBorderFraction
    const minConfidence = 0.4

    const xValues = scanDirection === 'right'
        ? Array.from({ length: endX - startX }, (_, i) => startX + i)
        : Array.from({ length: startX - endX }, (_, i) => startX - i)

    for (const x of xValues) {
      const run = findLongestDarkRunInCol(x)

      if (run.length >= minLength) {
        const thickness = measureVerticalThickness(x, run.start, run.length)

        const lengthScore = Math.min(1, run.length / (height * 0.8))
        const thicknessScore = thickness >= config.expectedBorderThickness ? 1 :
            thickness / config.expectedBorderThickness

        const confidence = (lengthScore * 0.6) + (thicknessScore * 0.4)

        if (confidence >= minConfidence) {
          candidates.push({
            position: x,
            runStart: run.start,
            runLength: run.length,
            thickness,
            confidence,
          })
        }
      }
    }

    if (candidates.length === 0) return null

    // Sort by position (outermost first based on scan direction)
    if (scanDirection === 'right') {
      candidates.sort((a, b) => a.position - b.position)
    } else {
      candidates.sort((a, b) => b.position - a.position)
    }

    const outermost = candidates[0]
    const highestConfidence = candidates.reduce((max, c) =>
        c.confidence > max.confidence ? c : max, candidates[0])

    if (outermost.confidence >= 0.5) {
      return outermost
    }

    if (highestConfidence.confidence - outermost.confidence > 0.2) {
      const distance = Math.abs(highestConfidence.position - outermost.position)
      if (distance < 50) {
        return highestConfidence
      }
    }

    return outermost
  }

  /**
   * Find the best vertical line NEAR an expected position.
   * Used when horizontal lines give us a hint about where vertical borders should be.
   */
  const findBestVerticalLineNear = (
      expectedX: number,
      tolerance: number,
      side: 'left' | 'right'
  ): LineCandidate | null => {
    const candidates: LineCandidate[] = []
    const minLength = height * config.minBorderFraction
    const minConfidence = 0.3 // Lower threshold since we're searching constrained area

    const startX = Math.max(0, expectedX - tolerance)
    const endX = Math.min(width - 1, expectedX + tolerance)

    if (DEBUG_GRID_DETECTION) {
      console.log(`  Searching for ${side} border near x=${expectedX} (range: ${startX}-${endX})`)
    }

    for (let x = startX; x <= endX; x++) {
      const run = findLongestDarkRunInCol(x)

      if (run.length >= minLength) {
        const thickness = measureVerticalThickness(x, run.start, run.length)

        const lengthScore = Math.min(1, run.length / (height * 0.8))
        const thicknessScore = thickness >= config.expectedBorderThickness ? 1 :
            thickness / config.expectedBorderThickness

        // Bonus for being close to expected position
        const positionBonus = 1 - (Math.abs(x - expectedX) / tolerance) * 0.2

        const confidence = ((lengthScore * 0.5) + (thicknessScore * 0.3)) * positionBonus

        if (confidence >= minConfidence) {
          candidates.push({
            position: x,
            runStart: run.start,
            runLength: run.length,
            thickness,
            confidence,
          })
        }
      }
    }

    if (candidates.length === 0) {
      if (DEBUG_GRID_DETECTION) {
        console.log(`  No vertical line found near x=${expectedX} (±${tolerance}px)`)
      }
      return null
    }

    // For left side, prefer leftmost (smallest x); for right side, prefer rightmost (largest x)
    if (side === 'left') {
      candidates.sort((a, b) => a.position - b.position)
    } else {
      candidates.sort((a, b) => b.position - a.position)
    }

    if (DEBUG_GRID_DETECTION) {
      console.log(`  Found ${candidates.length} candidates, best at x=${candidates[0].position}`)
    }

    // Return the outermost candidate
    return candidates[0]
  }

  /**
   * Find horizontal lines and validate they form a consistent grid.
   * Returns candidates that are likely to be actual grid borders, not table lines.
   * The key insight: top and bottom borders should have the same x-range.
   */
  const findAndValidateHorizontalBorders = (): { top: LineCandidate | null; bottom: LineCandidate | null } => {
    const topCandidates: LineCandidate[] = []
    const bottomCandidates: LineCandidate[] = []
    const minLength = width * config.minBorderFraction
    const minConfidence = 0.4

    // Scan for top border candidates
    for (let y = 0; y < Math.floor(height * searchRegions.topMaxY); y++) {
      const run = findLongestDarkRunInRow(y)
      if (run.length >= minLength) {
        const thickness = measureHorizontalThickness(y, run.start, run.length)
        const lengthScore = Math.min(1, run.length / (width * 0.8))
        const thicknessScore = thickness >= config.expectedBorderThickness ? 1 :
            thickness / config.expectedBorderThickness
        const confidence = (lengthScore * 0.6) + (thicknessScore * 0.4)
        if (confidence >= minConfidence) {
          topCandidates.push({ position: y, runStart: run.start, runLength: run.length, thickness, confidence })
        }
      }
    }

    // Scan for bottom border candidates
    for (let y = height - 1; y > Math.floor(height * searchRegions.bottomMinY); y--) {
      const run = findLongestDarkRunInRow(y)
      if (run.length >= minLength) {
        const thickness = measureHorizontalThickness(y, run.start, run.length)
        const lengthScore = Math.min(1, run.length / (width * 0.8))
        const thicknessScore = thickness >= config.expectedBorderThickness ? 1 :
            thickness / config.expectedBorderThickness
        const confidence = (lengthScore * 0.6) + (thicknessScore * 0.4)
        if (confidence >= minConfidence) {
          bottomCandidates.push({ position: y, runStart: run.start, runLength: run.length, thickness, confidence })
        }
      }
    }

    if (topCandidates.length === 0 || bottomCandidates.length === 0) {
      return {
        top: topCandidates[0] || null,
        bottom: bottomCandidates[0] || null
      }
    }

    // Sort: top candidates by y ascending (first = topmost), bottom by y descending (first = bottommost)
    topCandidates.sort((a, b) => a.position - b.position)
    bottomCandidates.sort((a, b) => b.position - a.position)

    const topCandidate = topCandidates[0]

    // For bottom: validate that it aligns with the top border (similar x range)
    // This helps reject table lines that might be narrower or offset
    let bestBottom: LineCandidate | null = null

    for (const bottom of bottomCandidates) {
      // Check alignment with top border
      const startDiff = Math.abs(bottom.runStart - topCandidate.runStart)
      const lengthDiff = Math.abs(bottom.runLength - topCandidate.runLength)

      // Good alignment: starts within 15px and similar length (within 3%)
      const isWellAligned = startDiff <= 15 && lengthDiff <= topCandidate.runLength * 0.03

      // Acceptable alignment: starts within 30px and similar length (within 10%)
      const isAcceptablyAligned = startDiff <= 30 && lengthDiff <= topCandidate.runLength * 0.1

      if (DEBUG_GRID_DETECTION && !bestBottom) {
        console.log(`  Checking bottom at y=${bottom.position}: startDiff=${startDiff}px, lengthDiff=${lengthDiff}px (${(lengthDiff/topCandidate.runLength*100).toFixed(1)}%)`)
      }

      if (isWellAligned) {
        bestBottom = bottom
        if (DEBUG_GRID_DETECTION) {
          console.log(`  → Well aligned, using this as bottom border`)
        }
        break // Take the first (outermost) well-aligned bottom
      }

      // Fallback: accept if reasonably close
      if (!bestBottom && isAcceptablyAligned) {
        bestBottom = bottom
        if (DEBUG_GRID_DETECTION) {
          console.log(`  → Acceptably aligned, using as fallback`)
        }
      }
    }

    // If no aligned bottom found, just use the outermost
    if (!bestBottom) {
      bestBottom = bottomCandidates[0]
      if (DEBUG_GRID_DETECTION) {
        console.log(`  → No aligned bottom found, using outermost at y=${bestBottom.position}`)
      }
    }

    if (DEBUG_GRID_DETECTION) {
      console.log(`Top/Bottom alignment result:`)
      console.log(`  Top: y=${topCandidate.position}, x=${topCandidate.runStart}-${topCandidate.runStart + topCandidate.runLength} (len=${topCandidate.runLength})`)
      console.log(`  Bottom: y=${bestBottom.position}, x=${bestBottom.runStart}-${bestBottom.runStart + bestBottom.runLength} (len=${bestBottom.runLength})`)
    }

    return { top: topCandidate, bottom: bestBottom }
  }

  // === Corner Detection ===

  /**
   * Verifies a corner by checking for an L-shaped intersection.
   * Instead of just checking pixel density, we verify that:
   * 1. There are dark pixels extending horizontally from the corner
   * 2. There are dark pixels extending vertically from the corner
   * 3. The corner point itself (with some tolerance) is dark
   */
  const verifyCorner = (
      x: number,
      y: number,
      _hLineThickness: number,
      _vLineThickness: number,
      cornerType: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  ): boolean => {
    const checkSize = config.cornerDetection.cornerSize
    const tolerance = 5 // Allow corner to be off by a few pixels

    // Determine which directions to check based on corner type
    const hDir = cornerType.includes('Left') ? 1 : -1  // Check right for left corners, left for right corners
    const vDir = cornerType.includes('top') ? 1 : -1   // Check down for top corners, up for bottom corners

    // Check if corner region has dark pixels (with tolerance for exact position)
    let cornerFound = false
    for (let dy = -tolerance; dy <= tolerance && !cornerFound; dy++) {
      for (let dx = -tolerance; dx <= tolerance && !cornerFound; dx++) {
        if (isDarkPixel(x + dx, y + dy)) {
          cornerFound = true
        }
      }
    }

    if (!cornerFound) {
      if (DEBUG_GRID_DETECTION) {
        console.log(`  Corner ${cornerType} failed: no dark pixel near (${x}, ${y})`)
      }
      return false
    }

    // Check horizontal arm of the L
    let hDarkCount = 0
    for (let i = 0; i < checkSize; i++) {
      const checkX = x + (i * hDir)
      // Check a few rows around the corner point
      for (let dy = -2; dy <= 2; dy++) {
        if (isDarkPixel(checkX, y + dy)) {
          hDarkCount++
          break // Found dark pixel in this column
        }
      }
    }

    // Check vertical arm of the L
    let vDarkCount = 0
    for (let i = 0; i < checkSize; i++) {
      const checkY = y + (i * vDir)
      // Check a few columns around the corner point
      for (let dx = -2; dx <= 2; dx++) {
        if (isDarkPixel(x + dx, checkY)) {
          vDarkCount++
          break // Found dark pixel in this row
        }
      }
    }

    const hRatio = hDarkCount / checkSize
    const vRatio = vDarkCount / checkSize

    const isValid = hRatio >= 0.6 && vRatio >= 0.6

    if (DEBUG_GRID_DETECTION) {
      console.log(`  Corner ${cornerType} at (${x}, ${y}): hArm=${(hRatio * 100).toFixed(0)}%, vArm=${(vRatio * 100).toFixed(0)}% → ${isValid ? 'VALID' : 'INVALID'}`)
    }

    return isValid
  }

  /**
   * Check if detected borders align properly to form a rectangle.
   * Returns alignment score (0-1) and adjusted positions if needed.
   */
  const checkBorderAlignment = (
      top: LineCandidate,
      bottom: LineCandidate,
      left: LineCandidate,
      right: LineCandidate
  ): { score: number; aligned: boolean } => {
    const tolerance = 15 // Allow 15px misalignment

    // Check that horizontal lines span from left to right border
    const topLeftAlign = Math.abs(top.runStart - left.position)
    const topRightAlign = Math.abs((top.runStart + top.runLength) - right.position)
    const bottomLeftAlign = Math.abs(bottom.runStart - left.position)
    const bottomRightAlign = Math.abs((bottom.runStart + bottom.runLength) - right.position)

    // Check that vertical lines span from top to bottom border
    const leftTopAlign = Math.abs(left.runStart - top.position)
    const leftBottomAlign = Math.abs((left.runStart + left.runLength) - bottom.position)
    const rightTopAlign = Math.abs(right.runStart - top.position)
    const rightBottomAlign = Math.abs((right.runStart + right.runLength) - bottom.position)

    const alignments = [
      topLeftAlign, topRightAlign, bottomLeftAlign, bottomRightAlign,
      leftTopAlign, leftBottomAlign, rightTopAlign, rightBottomAlign
    ]

    // Count how many alignments are within tolerance
    const goodAlignments = alignments.filter(a => a <= tolerance).length
    const score = goodAlignments / alignments.length

    if (DEBUG_GRID_DETECTION) {
      console.log('Border alignment check:')
      console.log(`  Top line: starts at x=${top.runStart}, ends at x=${top.runStart + top.runLength}`)
      console.log(`  Left border at x=${left.position}, Right border at x=${right.position}`)
      console.log(`  Alignments (px off): TL=${topLeftAlign}, TR=${topRightAlign}, BL=${bottomLeftAlign}, BR=${bottomRightAlign}`)
      console.log(`  Alignments (px off): LT=${leftTopAlign}, LB=${leftBottomAlign}, RT=${rightTopAlign}, RB=${rightBottomAlign}`)
      console.log(`  Score: ${(score * 100).toFixed(0)}% (${goodAlignments}/8 within ${tolerance}px)`)
    }

    return {
      score,
      aligned: score >= 0.5 // At least half of alignments should be good
    }
  }

  // === Internal Grid Line Detection ===

  const findInternalGridLines = (
      bounds: GridBounds,
      direction: 'horizontal' | 'vertical'
  ): number[] => {
    const lines: number[] = []
    const minRunLength = direction === 'horizontal'
        ? bounds.width * 0.8
        : bounds.height * 0.8

    if (direction === 'horizontal') {
      // Scan for horizontal lines within the grid
      for (let y = bounds.y + 5; y < bounds.y + bounds.height - 5; y++) {
        const run = findLongestDarkRunInRow(y)
        if (
            run.length >= minRunLength &&
            run.start <= bounds.x + bounds.width * 0.1 &&
            run.start + run.length >= bounds.x + bounds.width * 0.9
        ) {
          // Check if this is a new line (not just thickness of previous)
          if (lines.length === 0 || y - lines[lines.length - 1] > 3) {
            lines.push(y)
          }
        }
      }
    } else {
      // Scan for vertical lines within the grid
      for (let x = bounds.x + 5; x < bounds.x + bounds.width - 5; x++) {
        const run = findLongestDarkRunInCol(x)
        if (
            run.length >= minRunLength &&
            run.start <= bounds.y + bounds.height * 0.1 &&
            run.start + run.length >= bounds.y + bounds.height * 0.9
        ) {
          if (lines.length === 0 || x - lines[lines.length - 1] > 3) {
            lines.push(x)
          }
        }
      }
    }

    return lines
  }

  const analyzeGridLineSpacing = (lines: number[]): {
    isRegular: boolean
    consistency: number
  } => {
    if (lines.length < 3) {
      return { isRegular: false, consistency: 0 }
    }

    // Calculate spacings between consecutive lines
    const spacings: number[] = []
    for (let i = 1; i < lines.length; i++) {
      spacings.push(lines[i] - lines[i - 1])
    }

    // Calculate median spacing
    const sortedSpacings = [...spacings].sort((a, b) => a - b)
    const medianSpacing = sortedSpacings[Math.floor(sortedSpacings.length / 2)]

    // Check how consistent the spacings are
    const tolerance = medianSpacing * config.gridLineVerification.spacingTolerance
    const consistentCount = spacings.filter(
        s => Math.abs(s - medianSpacing) <= tolerance
    ).length

    const consistency = consistentCount / spacings.length

    return {
      isRegular: consistency >= 0.7,
      consistency,
    }
  }

  // === Main Detection Logic ===

  if (DEBUG_GRID_DETECTION) {
    console.log('=== Grid Detection Debug (Improved Algorithm) ===')
    console.log(`Canvas: ${width}×${height}`)
    console.log(`Config:`, config)
  }

  // Find border candidates
  const { searchRegions } = config

  // Step 1: Find and validate horizontal lines (ensures top/bottom are from same grid)
  const { top: topCandidate, bottom: bottomCandidate } = findAndValidateHorizontalBorders()

  if (DEBUG_GRID_DETECTION) {
    console.log('Horizontal candidates found:')
    console.log('  Top:', topCandidate)
    console.log('  Bottom:', bottomCandidate)
  }

  // Step 2: Use horizontal line bounds to constrain vertical line search
  // The left border should be near where horizontal lines START
  // The right border should be near where horizontal lines END
  let leftSearchCenter: number | null = null
  let rightSearchCenter: number | null = null

  if (topCandidate && bottomCandidate) {
    // Use the average start/end positions from top and bottom lines
    leftSearchCenter = Math.round((topCandidate.runStart + bottomCandidate.runStart) / 2)
    rightSearchCenter = Math.round(
        (topCandidate.runStart + topCandidate.runLength + bottomCandidate.runStart + bottomCandidate.runLength) / 2
    )

    if (DEBUG_GRID_DETECTION) {
      console.log(`Vertical search guided by horizontal lines:`)
      console.log(`  Left search center: x=${leftSearchCenter} (±30px)`)
      console.log(`  Right search center: x=${rightSearchCenter} (±30px)`)
    }
  }

  // Find vertical lines - constrained to near expected positions if available
  const verticalSearchTolerance = 30 // How far from expected position to search

  const leftCandidate = leftSearchCenter !== null
      ? findBestVerticalLineNear(leftSearchCenter, verticalSearchTolerance, 'left')
      : findBestVerticalLine(0, Math.floor(width * searchRegions.leftMaxX), 'right')

  const rightCandidate = rightSearchCenter !== null
      ? findBestVerticalLineNear(rightSearchCenter, verticalSearchTolerance, 'right')
      : findBestVerticalLine(width - 1, Math.floor(width * searchRegions.rightMinX), 'left')

  if (DEBUG_GRID_DETECTION) {
    console.log('Vertical candidates found:')
    console.log('  Left:', leftCandidate)
    console.log('  Right:', rightCandidate)
  }

  // Fallback: If vertical lines weren't found or are misaligned with horizontal lines,
  // use the horizontal line endpoints directly
  let finalLeft = leftCandidate
  let finalRight = rightCandidate

  if (topCandidate && bottomCandidate) {
    const expectedLeftX = Math.round((topCandidate.runStart + bottomCandidate.runStart) / 2)
    const expectedRightX = Math.round(
        (topCandidate.runStart + topCandidate.runLength + bottomCandidate.runStart + bottomCandidate.runLength) / 2
    )

    // Check if detected vertical lines are significantly off from horizontal line endpoints
    const leftMisalignment = leftCandidate ? Math.abs(leftCandidate.position - expectedLeftX) : Infinity
    const rightMisalignment = rightCandidate ? Math.abs(rightCandidate.position - expectedRightX) : Infinity

    if (DEBUG_GRID_DETECTION) {
      console.log('Vertical line alignment check:')
      console.log(`  Expected left: x=${expectedLeftX}, detected: x=${leftCandidate?.position ?? 'none'}, off by ${leftMisalignment}px`)
      console.log(`  Expected right: x=${expectedRightX}, detected: x=${rightCandidate?.position ?? 'none'}, off by ${rightMisalignment}px`)
    }

    // If left is missing or significantly misaligned, create synthetic candidate from horizontal lines
    if (!leftCandidate || leftMisalignment > 20) {
      if (DEBUG_GRID_DETECTION) {
        console.log(`  Using horizontal line start (x=${expectedLeftX}) for left border`)
      }
      finalLeft = {
        position: expectedLeftX,
        runStart: topCandidate.position,
        runLength: bottomCandidate.position - topCandidate.position,
        thickness: 1,
        confidence: 0.6, // Moderate confidence since derived from horizontal lines
      }
    }

    // If right is missing or significantly misaligned, create synthetic candidate from horizontal lines
    if (!rightCandidate || rightMisalignment > 20) {
      if (DEBUG_GRID_DETECTION) {
        console.log(`  Using horizontal line end (x=${expectedRightX}) for right border`)
      }
      finalRight = {
        position: expectedRightX,
        runStart: topCandidate.position,
        runLength: bottomCandidate.position - topCandidate.position,
        thickness: 1,
        confidence: 0.6,
      }
    }
  }

  // Check if all borders were found
  if (!topCandidate || !bottomCandidate || !finalLeft || !finalRight) {
    if (DEBUG_GRID_DETECTION) {
      console.log('Detection FAILED - missing border(s), falling back to defaults')
    }
    return extractGridArea(canvas)
  }

  // Check border alignment first
  const alignment = checkBorderAlignment(
      topCandidate,
      bottomCandidate,
      finalLeft,
      finalRight
  )

  if (!alignment.aligned) {
    if (DEBUG_GRID_DETECTION) {
      console.log('Detection WARNING - borders poorly aligned, attempting to continue...')
    }
  }

  // Verify corners using the detected border positions
  // Use the intersection points based on the line positions
  const corners = {
    topLeft: verifyCorner(
        finalLeft.position,
        topCandidate.position,
        topCandidate.thickness,
        finalLeft.thickness,
        'topLeft'
    ),
    topRight: verifyCorner(
        finalRight.position,
        topCandidate.position,
        topCandidate.thickness,
        finalRight.thickness,
        'topRight'
    ),
    bottomLeft: verifyCorner(
        finalLeft.position,
        bottomCandidate.position,
        bottomCandidate.thickness,
        finalLeft.thickness,
        'bottomLeft'
    ),
    bottomRight: verifyCorner(
        finalRight.position,
        bottomCandidate.position,
        bottomCandidate.thickness,
        finalRight.thickness,
        'bottomRight'
    ),
  }

  const validCorners = Object.values(corners).filter(Boolean).length

  if (DEBUG_GRID_DETECTION) {
    console.log(`Valid corners: ${validCorners}/4`)
  }

  // Require at least 2 valid corners OR good alignment
  if (validCorners < 2 && !alignment.aligned) {
    if (DEBUG_GRID_DETECTION) {
      console.log('Detection FAILED - insufficient valid corners and poor alignment')
    }
    return extractGridArea(canvas)
  }

  // Calculate preliminary bounds
  const preliminaryBounds: GridBounds = {
    x: finalLeft.position,
    y: topCandidate.position,
    width: finalRight.position - finalLeft.position,
    height: bottomCandidate.position - topCandidate.position,
  }

  // Validate size
  if (
      preliminaryBounds.width < width * config.minBorderFraction ||
      preliminaryBounds.height < height * config.minBorderFraction
  ) {
    if (DEBUG_GRID_DETECTION) {
      console.log('Detection FAILED - detected grid too small')
    }
    return extractGridArea(canvas)
  }

  // Verify internal grid lines (if enabled)
  let gridLineConfidence = 1
  let internalLinesFound = 0

  if (config.gridLineVerification.enabled) {
    const hLines = findInternalGridLines(preliminaryBounds, 'horizontal')
    const vLines = findInternalGridLines(preliminaryBounds, 'vertical')

    const hAnalysis = analyzeGridLineSpacing(hLines)
    const vAnalysis = analyzeGridLineSpacing(vLines)

    internalLinesFound = hLines.length + vLines.length

    if (DEBUG_GRID_DETECTION) {
      console.log(`Internal lines found: ${hLines.length} horizontal, ${vLines.length} vertical`)
      console.log('Horizontal spacing:', hAnalysis)
      console.log('Vertical spacing:', vAnalysis)
    }

    // If we found internal lines, check their regularity
    if (internalLinesFound >= config.gridLineVerification.minInternalLines) {
      gridLineConfidence = (hAnalysis.consistency + vAnalysis.consistency) / 2

      // Boost confidence if lines are regularly spaced
      if (hAnalysis.isRegular || vAnalysis.isRegular) {
        gridLineConfidence = Math.min(1, gridLineConfidence + 0.2)
      }
    }
  }

  // Calculate overall confidence
  const borderConfidence = (
      topCandidate.confidence +
      bottomCandidate.confidence +
      finalLeft.confidence +
      finalRight.confidence
  ) / 4

  const cornerConfidence = validCorners / 4

  const overallConfidence = (
      borderConfidence * 0.3 +
      cornerConfidence * 0.25 +
      alignment.score * 0.25 +
      gridLineConfidence * 0.2
  )

  if (DEBUG_GRID_DETECTION) {
    console.log('Confidence scores:')
    console.log(`  Borders: ${(borderConfidence * 100).toFixed(1)}%`)
    console.log(`  Corners: ${(cornerConfidence * 100).toFixed(1)}%`)
    console.log(`  Alignment: ${(alignment.score * 100).toFixed(1)}%`)
    console.log(`  Grid lines: ${(gridLineConfidence * 100).toFixed(1)}%`)
    console.log(`  Overall: ${(overallConfidence * 100).toFixed(1)}%`)
  }

  // Require minimum overall confidence (lowered since we have more signals now)
  if (overallConfidence < 0.35) {
    if (DEBUG_GRID_DETECTION) {
      console.log('Detection FAILED - confidence too low')
    }
    return extractGridArea(canvas)
  }

  // Expand bounds outward to capture all content
  const expansion = config.borderExpansion
  const finalBounds: GridBounds = {
    x: Math.max(0, preliminaryBounds.x - expansion),
    y: Math.max(0, preliminaryBounds.y - expansion),
    width: Math.min(
        width - preliminaryBounds.x + expansion,
        preliminaryBounds.width + expansion * 2
    ),
    height: Math.min(
        height - preliminaryBounds.y + expansion,
        preliminaryBounds.height + expansion * 2
    ),
  }

  if (DEBUG_GRID_DETECTION) {
    console.log('Detection SUCCESS!')
    console.log(`Final bounds: (${finalBounds.x}, ${finalBounds.y}) ${finalBounds.width}×${finalBounds.height}`)
  }

  return finalBounds
}