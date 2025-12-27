/**
 * Grid Creator Tool - Type Definitions
 *
 * All types for the Grid Creator tool including:
 * - GridConfig: User-provided grid dimensions
 * - CellPosition: Cell coordinates with utilities
 * - CellState: Individual cell state
 * - ViewportState: Zoom/pan camera state
 * - VisibleRange: Viewport culling calculations
 * - GridState: Complete application state
 * - RenderConfig: Canvas rendering configuration
 */

/**
 * Configuration for grid creation.
 * Validated before grid generation.
 */
export interface GridConfig {
    /** Grid width in stitches (cells). Range: 1-500 */
    width: number;

    /** Grid height in stitches (cells). Range: 1-500 */
    height: number;
}

/**
 * Validation rules for GridConfig
 */
export const GRID_CONFIG_CONSTRAINTS = {
    MIN_DIMENSION: 1,
    MAX_DIMENSION: 500,
    DEFAULT_WIDTH: 50,
    DEFAULT_HEIGHT: 50,
} as const;

/**
 * Position of a cell in the grid.
 * Zero-indexed: (0,0) is top-left.
 */
export interface CellPosition {
    /** Row index (0 = top) */
    row: number;

    /** Column index (0 = left) */
    col: number;
}

/**
 * State of a single grid cell.
 * Sparse storage - only non-default cells are stored.
 */
export interface CellState {
    /** Whether the cell has been activated (filled) */
    active: boolean;

    /** Hex color of the cell (e.g., "#FF5733") */
    color?: string;

    /** Thread code for display (e.g., "DMC 310") */
    threadCode?: string;

    /** Symbol character for pattern display */
    symbol?: string;
}

/**
 * Tool modes for grid interaction.
 */
export type ToolMode = "select" | "paint" | "erase" | "eyedropper";

/**
 * View modes for displaying cells.
 * - color: Show cell colors only
 * - symbol: Show symbols only (on light gray background)
 * - both: Show symbols overlaid on colors
 */
export type ViewMode = "color" | "symbol" | "both";

export const DEFAULT_VIEW_MODE: ViewMode = "both";

/**
 * Selected thread color for painting.
 */
export interface SelectedColor {
    /** Hex color value */
    hex: string;
    /** Thread code (e.g., "DMC 310") */
    threadCode: string;
    /** Color name */
    name: string;
    /** Brand name */
    brand: string;
    /** Symbol character for pattern display (assigned per color) */
    symbol?: string;
}

/**
 * Default color for painting: Black (DMC 310).
 * This is the most commonly used color in cross-stitch patterns.
 */
export const DEFAULT_SELECTED_COLOR: SelectedColor = {
    hex: "#000000",
    threadCode: "DMC 310",
    name: "Black",
    brand: "DMC",
};

export const PALETTE_CONSTRAINTS = {
    MAX_RECENT_COLORS: 16,
} as const;

/**
 * Viewport state for canvas navigation.
 * Uses world coordinates for position, scale for zoom.
 */
export interface ViewportState {
    /** Zoom/scale level. 1.0 = 100%, range 0.1-4.0 */
    scale: number;

    /** Horizontal offset in world coordinates (pixels at scale=1) */
    offsetX: number;

    /** Vertical offset in world coordinates (pixels at scale=1) */
    offsetY: number;
}

export const DEFAULT_VIEWPORT: ViewportState = {
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
};

export const VIEWPORT_CONSTRAINTS = {
    MIN_SCALE: 0.1,
    MAX_SCALE: 4.0,
    SCALE_STEP: 0.1,
} as const;

/**
 * Range of cells currently visible in view-port.
 * Used for render culling - only draw visible cells.
 */
export interface VisibleRange {
    startCol: number;
    startRow: number;
    endCol: number;
    endRow: number;
}

/**
 * Application phases for Grid Creator.
 */
export type GridCreatorPhase =
    | "config" // User entering dimensions
    | "rendering" // Grid being generated
    | "interactive"; // Grid ready for interaction

/**
 * Colors for grid rendering.
 */
export interface RenderColors {
    background: string;
    gridLine: string;
    majorGridLine: string;
    hoverHighlight: string;
    activeCell: string;
}

/**
 * Computed rendering configuration.
 * Derived from GridConfig and container dimensions.
 */
export interface RenderConfig {
    /** Size of each cell in pixels */
    cellSize: number;

    /** Total canvas width in pixels */
    canvasWidth: number;

    /** Total canvas height in pixels */
    canvasHeight: number;

    /** Grid line width in pixels */
    lineWidth: number;

    /** Colors for rendering */
    colors: RenderColors;

    /** Current view mode for cell display */
    viewMode: ViewMode;
}

export const DEFAULT_RENDER_COLORS: RenderColors = {
    background: "#ffffff",
    gridLine: "#d1d5db",
    majorGridLine: "#9ca3af",
    hoverHighlight: "#dbeafe",
    activeCell: "#93c5fd",
};

export const RENDER_CONSTRAINTS = {
    MIN_CELL_SIZE: 8, // Minimum for touch targets
    MAX_CELL_SIZE: 50, // Maximum before wasting space
    LINE_WIDTH: 1,
    MAJOR_LINE_INTERVAL: 10, // Every 10th line is major
} as const;
