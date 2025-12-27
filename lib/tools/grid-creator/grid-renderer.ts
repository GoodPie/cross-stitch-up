/**
 * Grid Creator Tool - Canvas Renderer
 *
 * Handles all canvas rendering for the grid including:
 * - Grid lines (regular and major every 10 cells)
 * - Cell fills (background, active, hovered)
 * - Symbol rendering for pattern display
 * - Viewport culling for performance
 */

import type { GridConfig, CellPosition, CellState, ViewportState, RenderConfig, VisibleRange, ViewMode } from "./types";
import { DEFAULT_RENDER_COLORS, RENDER_CONSTRAINTS, DEFAULT_VIEW_MODE } from "./types";
import { getVisibleRange } from "./utils";
import { SYMBOL_RENDER_CONSTRAINTS } from "./symbols";
import { getContrastColor } from "@/lib/tools/threads/color-utils";

/**
 * Calculate render configuration based on grid config and container dimensions.
 * Cell size is dynamically calculated to fit the container while meeting minimum requirements.
 *
 * @param config - Grid configuration
 * @param containerWidth - Container width in pixels
 * @param containerHeight - Container height in pixels
 * @param viewMode - Current view mode for symbol/color display
 */
export function calculateRenderConfig(
    config: GridConfig,
    containerWidth: number,
    containerHeight: number,
    viewMode: ViewMode = DEFAULT_VIEW_MODE
): RenderConfig {
    // Calculate cell size to fit container, respecting min/max constraints
    const maxCellWidth = containerWidth / config.width;
    const maxCellHeight = containerHeight / config.height;
    const idealCellSize = Math.min(maxCellWidth, maxCellHeight);

    const cellSize = Math.max(
        RENDER_CONSTRAINTS.MIN_CELL_SIZE,
        Math.min(RENDER_CONSTRAINTS.MAX_CELL_SIZE, Math.floor(idealCellSize))
    );

    // Calculate actual canvas dimensions
    const canvasWidth = cellSize * config.width;
    const canvasHeight = cellSize * config.height;

    return {
        cellSize,
        canvasWidth,
        canvasHeight,
        lineWidth: RENDER_CONSTRAINTS.LINE_WIDTH,
        colors: { ...DEFAULT_RENDER_COLORS },
        viewMode,
    };
}

/**
 * Render the entire grid to the canvas.
 * Uses viewport culling to only render visible cells for performance.
 *
 * @param ctx - Canvas 2D rendering context
 * @param config - Grid configuration
 * @param renderConfig - Render configuration
 * @param viewport - Current viewport state
 * @param cells - Map of cell states (sparse storage)
 * @param hoveredCell - Currently hovered cell position (or null)
 */
export function renderGrid(
    ctx: CanvasRenderingContext2D,
    config: GridConfig,
    renderConfig: RenderConfig,
    viewport: ViewportState,
    cells: Map<string, CellState>,
    hoveredCell: CellPosition | null
): void {
    const { cellSize, canvasWidth, canvasHeight, colors } = renderConfig;

    // Clear canvas with background color
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate visible range for viewport culling
    const visibleRange = getVisibleRange(viewport, config, cellSize, canvasWidth, canvasHeight);

    // Render active and hovered cells (pass scale for symbol size check)
    renderCells(ctx, cells, hoveredCell, renderConfig, visibleRange, viewport.scale);

    // Render grid lines on top
    renderGridLines(ctx, config, renderConfig);
}

/**
 * Render a symbol character within a cell.
 *
 * @param ctx - Canvas 2D rendering context
 * @param symbol - Symbol character to render
 * @param x - Cell x position
 * @param y - Cell y position
 * @param cellSize - Size of the cell
 * @param bgColor - Background color (for contrast calculation)
 * @param hasColorFill - Whether the cell has a color fill
 * @param scale - Viewport scale factor (for determining if symbols should render)
 */
function renderSymbol(
    ctx: CanvasRenderingContext2D,
    symbol: string,
    x: number,
    y: number,
    cellSize: number,
    bgColor: string | undefined,
    hasColorFill: boolean,
    scale: number = 1
): void {
    // Skip if effective cell size (accounting for zoom) is too small for readable symbols
    const effectiveCellSize = cellSize * scale;
    if (effectiveCellSize < SYMBOL_RENDER_CONSTRAINTS.MIN_CELL_SIZE) {
        return;
    }

    // Calculate font size (65% of cell size)
    const fontSize = Math.floor(cellSize * SYMBOL_RENDER_CONSTRAINTS.FONT_SIZE_RATIO);

    // Determine text color for contrast
    const textColor =
        hasColorFill && bgColor ? getContrastColor(bgColor) : SYMBOL_RENDER_CONSTRAINTS.DEFAULT_TEXT_COLOR;

    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const centerX = x + cellSize / 2;
    const centerY = y + cellSize / 2;

    ctx.fillText(symbol, centerX, centerY);
}

/**
 * Render all cells within the visible range.
 * Respects viewMode to show colors, symbols, or both.
 *
 * @param ctx Grid context
 * @param cells Cells and their states
 * @param hoveredCell Currently hovered cell position (or null)
 * @param renderConfig Render configuration
 * @param visibleRange Visible range for viewport culling
 * @param scale - Viewport scale factor for symbol size calculations
 */
function renderCells(
    ctx: CanvasRenderingContext2D,
    cells: Map<string, CellState>,
    hoveredCell: CellPosition | null,
    renderConfig: RenderConfig,
    visibleRange: VisibleRange,
    scale: number = 1
): void {
    const { cellSize, colors, viewMode } = renderConfig;
    const showColor = viewMode === "color" || viewMode === "both";
    const showSymbol = viewMode === "symbol" || viewMode === "both";

    // First pass: render active cells with their colors and/or symbols
    for (const [key, state] of cells.entries()) {
        if (!state.active) continue;

        const [row, col] = key.split("-").map(Number);

        // Skip if outside visible range
        if (
            row < visibleRange.startRow ||
            row > visibleRange.endRow ||
            col < visibleRange.startCol ||
            col > visibleRange.endCol
        ) {
            continue;
        }

        const x = col * cellSize;
        const y = row * cellSize;

        // Render cell background
        if (showColor && state.color) {
            // Color mode or both: use cell's color
            ctx.fillStyle = state.color;
            ctx.fillRect(x, y, cellSize, cellSize);
        } else if (!showColor && state.active) {
            // Symbol-only mode: use light gray background
            ctx.fillStyle = SYMBOL_RENDER_CONSTRAINTS.SYMBOL_ONLY_BACKGROUND;
            ctx.fillRect(x, y, cellSize, cellSize);
        } else if (state.active) {
            // Fallback: use default active color
            ctx.fillStyle = colors.activeCell;
            ctx.fillRect(x, y, cellSize, cellSize);
        }

        // Render symbol if applicable
        if (showSymbol && state.symbol) {
            renderSymbol(ctx, state.symbol, x, y, cellSize, state.color, showColor && !!state.color, scale);
        }
    }

    // Second pass: render hovered cell (semi-transparent overlay)
    if (hoveredCell) {
        const { row, col } = hoveredCell;
        if (
            row >= visibleRange.startRow &&
            row <= visibleRange.endRow &&
            col >= visibleRange.startCol &&
            col <= visibleRange.endCol
        ) {
            ctx.fillStyle = colors.hoverHighlight;
            const x = col * cellSize;
            const y = row * cellSize;
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }
}

/**
 * Render grid lines (regular and major).
 */
function renderGridLines(ctx: CanvasRenderingContext2D, config: GridConfig, renderConfig: RenderConfig): void {
    const { cellSize, canvasWidth, canvasHeight, lineWidth, colors } = renderConfig;

    // Draw all vertical lines
    for (let col = 0; col <= config.width; col++) {
        const x = Math.floor(col * cellSize) + 0.5; // +0.5 for crisp 1px lines
        const isMajor = col % RENDER_CONSTRAINTS.MAJOR_LINE_INTERVAL === 0;

        ctx.strokeStyle = isMajor ? colors.majorGridLine : colors.gridLine;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }

    // Draw all horizontal lines
    for (let row = 0; row <= config.height; row++) {
        const y = Math.floor(row * cellSize) + 0.5;
        const isMajor = row % RENDER_CONSTRAINTS.MAJOR_LINE_INTERVAL === 0;

        ctx.strokeStyle = isMajor ? colors.majorGridLine : colors.gridLine;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }
}

/**
 * Render a single cell.
 * Used for incremental updates when only one cell changes.
 * Respects viewMode for symbol/color display.
 *
 * @param ctx - Canvas 2D rendering context
 * @param position - Cell position to render
 * @param state - Cell state (undefined means default/inactive)
 * @param renderConfig - Render configuration
 * @param isHovered - Whether this cell is currently hovered
 * @param scale - Viewport scale factor for symbol size calculations
 */
export function renderCell(
    ctx: CanvasRenderingContext2D,
    position: CellPosition,
    state: CellState | undefined,
    renderConfig: RenderConfig,
    isHovered: boolean,
    scale: number = 1
): void {
    const { cellSize, colors, viewMode } = renderConfig;
    const { row, col } = position;
    const showColor = viewMode === "color" || viewMode === "both";
    const showSymbol = viewMode === "symbol" || viewMode === "both";

    const x = col * cellSize;
    const y = row * cellSize;

    // Determine fill color based on state and view mode
    let fillColor = colors.background;
    let hasColorFill = false;

    if (state?.active) {
        if (showColor && state.color) {
            // Color mode or both: use cell's color
            fillColor = state.color;
            hasColorFill = true;
        } else if (!showColor) {
            // Symbol-only mode: use light gray background
            fillColor = SYMBOL_RENDER_CONSTRAINTS.SYMBOL_ONLY_BACKGROUND;
        } else {
            // Fallback: use default active color
            fillColor = colors.activeCell;
            hasColorFill = true;
        }
    }

    if (isHovered) {
        fillColor = colors.hoverHighlight;
    }

    // Fill cell
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, cellSize, cellSize);

    // Render symbol if applicable (and not hovered)
    if (!isHovered && showSymbol && state?.active && state?.symbol) {
        renderSymbol(ctx, state.symbol, x, y, cellSize, state.color, hasColorFill, scale);
    }

    // Redraw cell borders
    const isMajorCol =
        col % RENDER_CONSTRAINTS.MAJOR_LINE_INTERVAL === 0 || (col + 1) % RENDER_CONSTRAINTS.MAJOR_LINE_INTERVAL === 0;
    const isMajorRow =
        row % RENDER_CONSTRAINTS.MAJOR_LINE_INTERVAL === 0 || (row + 1) % RENDER_CONSTRAINTS.MAJOR_LINE_INTERVAL === 0;

    ctx.strokeStyle = isMajorCol || isMajorRow ? colors.majorGridLine : colors.gridLine;
    ctx.lineWidth = renderConfig.lineWidth;
    ctx.strokeRect(x + 0.5, y + 0.5, cellSize, cellSize);
}
