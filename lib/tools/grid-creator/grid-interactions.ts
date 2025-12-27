/**
 * Grid Creator Tool - Interaction Handler
 *
 * Handles all user interactions with the grid canvas:
 * - Coordinate translation (screen -> canvas -> cell)
 * - Mouse events (hover, click, pan)
 * - Touch events (tap, drag, pinch)
 */

import type { CellPosition, ViewportState, RenderConfig, GridConfig } from "./types";
import { VIEWPORT_CONSTRAINTS } from "./types";

/**
 * Convert screen coordinates to canvas coordinates.
 * Accounts for viewport offset, scale, and canvas position.
 *
 * @param clientX - Screen X coordinate (from mouse/touch event)
 * @param clientY - Screen Y coordinate (from mouse/touch event)
 * @param canvas - Canvas element
 * @param viewport - Current viewport state
 * @returns Canvas coordinates { canvasX, canvasY }
 */
export function screenToCanvas(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
    viewport: ViewportState
): { canvasX: number; canvasY: number } {
    const rect = canvas.getBoundingClientRect();

    // Account for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const scaleX = canvas.width / dpr / rect.width;
    const scaleY = canvas.height / dpr / rect.height;

    // Convert screen to canvas coordinates
    const canvasX = ((clientX - rect.left) * scaleX) / viewport.scale + viewport.offsetX;
    const canvasY = ((clientY - rect.top) * scaleY) / viewport.scale + viewport.offsetY;

    return { canvasX, canvasY };
}

/**
 * Get cell position from canvas coordinates.
 * Returns null if coordinates are outside the grid.
 *
 * @param canvasX - X coordinate in canvas space
 * @param canvasY - Y coordinate in canvas space
 * @param renderConfig - Render configuration
 * @param gridConfig - Grid configuration for bounds checking
 * @returns Cell position or null if outside grid
 */
export function getCellFromCoords(
    canvasX: number,
    canvasY: number,
    renderConfig: RenderConfig,
    gridConfig: GridConfig
): CellPosition | null {
    const { cellSize } = renderConfig;

    const col = Math.floor(canvasX / cellSize);
    const row = Math.floor(canvasY / cellSize);

    // Bounds check
    if (col < 0 || col >= gridConfig.width) return null;
    if (row < 0 || row >= gridConfig.height) return null;

    return { row, col };
}

export interface InteractionCallbacks {
    onHover: (cell: CellPosition | null) => void;
    onClick: (cell: CellPosition) => void;
    onPan: (deltaX: number, deltaY: number) => void;
    onZoom: (newScale: number, centerX: number, centerY: number) => void;
}

interface InteractionState {
    isPanning: boolean;
    lastPanX: number;
    lastPanY: number;
    initialPinchDistance: number | null;
    initialScale: number;
}

/**
 * Create and attach all interaction handlers to a canvas.
 * Returns a cleanup function to remove all event listeners.
 *
 * @param canvas - Canvas element to attach handlers to
 * @param viewport - Current viewport state (getter)
 * @param renderConfig - Render configuration (getter)
 * @param gridConfig - Grid configuration
 * @param callbacks - Callback functions for interactions
 * @returns Object with cleanup function
 */
export function createInteractionHandlers(
    canvas: HTMLCanvasElement,
    getViewport: () => ViewportState,
    getRenderConfig: () => RenderConfig,
    gridConfig: GridConfig,
    callbacks: InteractionCallbacks
): { cleanup: () => void } {
    const state: InteractionState = {
        isPanning: false,
        lastPanX: 0,
        lastPanY: 0,
        initialPinchDistance: null,
        initialScale: 1,
    };

    // =========================================================================
    // Mouse Handlers
    // =========================================================================

    const handleMouseMove = (e: MouseEvent) => {
        const viewport = getViewport();
        const renderConfig = getRenderConfig();

        if (state.isPanning) {
            const deltaX = (e.clientX - state.lastPanX) / viewport.scale;
            const deltaY = (e.clientY - state.lastPanY) / viewport.scale;
            callbacks.onPan(-deltaX, -deltaY);
            state.lastPanX = e.clientX;
            state.lastPanY = e.clientY;
            return;
        }

        // Hover detection
        const { canvasX, canvasY } = screenToCanvas(e.clientX, e.clientY, canvas, viewport);
        const cell = getCellFromCoords(canvasX, canvasY, renderConfig, gridConfig);
        callbacks.onHover(cell);
    };

    const handleMouseDown = (e: MouseEvent) => {
        // Right click or middle click for panning
        if (e.button === 1 || e.button === 2) {
            state.isPanning = true;
            state.lastPanX = e.clientX;
            state.lastPanY = e.clientY;
            e.preventDefault();
            return;
        }

        // Left click - check if we can pan (zoomed in) or it's a cell click
        const viewport = getViewport();
        if (viewport.scale > 1 && e.shiftKey) {
            // Shift+click to pan when zoomed
            state.isPanning = true;
            state.lastPanX = e.clientX;
            state.lastPanY = e.clientY;
            return;
        }

        // Cell click
        const renderConfig = getRenderConfig();
        const { canvasX, canvasY } = screenToCanvas(e.clientX, e.clientY, canvas, viewport);
        const cell = getCellFromCoords(canvasX, canvasY, renderConfig, gridConfig);
        if (cell) {
            callbacks.onClick(cell);
        }
    };

    const handleMouseUp = () => {
        state.isPanning = false;
    };

    const handleMouseLeave = () => {
        state.isPanning = false;
        callbacks.onHover(null);
    };

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        const viewport = getViewport();

        // Zoom with mouse wheel
        const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(
            VIEWPORT_CONSTRAINTS.MIN_SCALE,
            Math.min(VIEWPORT_CONSTRAINTS.MAX_SCALE, viewport.scale + zoomDelta)
        );

        if (newScale !== viewport.scale) {
            callbacks.onZoom(newScale, e.clientX, e.clientY);
        }
    };

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
    };

    // =========================================================================
    // Touch Handlers
    // =========================================================================

    const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
            // Single touch - could be tap or pan
            state.lastPanX = e.touches[0].clientX;
            state.lastPanY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            // Two touches - pinch to zoom
            state.initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
            state.initialScale = getViewport().scale;
            state.isPanning = false;
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();

        if (e.touches.length === 1 && state.isPanning) {
            // Panning
            const viewport = getViewport();
            const touch = e.touches[0];
            const deltaX = (touch.clientX - state.lastPanX) / viewport.scale;
            const deltaY = (touch.clientY - state.lastPanY) / viewport.scale;
            callbacks.onPan(-deltaX, -deltaY);
            state.lastPanX = touch.clientX;
            state.lastPanY = touch.clientY;
        } else if (e.touches.length === 2 && state.initialPinchDistance) {
            // Pinch zoom
            const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
            const scale = state.initialScale * (currentDistance / state.initialPinchDistance);
            const newScale = Math.max(VIEWPORT_CONSTRAINTS.MIN_SCALE, Math.min(VIEWPORT_CONSTRAINTS.MAX_SCALE, scale));

            // Center point of pinch
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            callbacks.onZoom(newScale, centerX, centerY);
        } else if (e.touches.length === 1) {
            // Start panning if moved enough (5px threshold)
            const touch = e.touches[0];
            const dx = Math.abs(touch.clientX - state.lastPanX);
            const dy = Math.abs(touch.clientY - state.lastPanY);
            if (dx > 5 || dy > 5) {
                state.isPanning = true;
                // Apply first delta immediately to avoid "jump"
                const viewport = getViewport();
                const deltaX = (touch.clientX - state.lastPanX) / viewport.scale;
                const deltaY = (touch.clientY - state.lastPanY) / viewport.scale;
                callbacks.onPan(-deltaX, -deltaY);
                state.lastPanX = touch.clientX;
                state.lastPanY = touch.clientY;
            }
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (e.touches.length === 0) {
            // All touches ended
            if (!state.isPanning && e.changedTouches.length === 1) {
                // This was a tap - treat as click
                const touch = e.changedTouches[0];
                const viewport = getViewport();
                const renderConfig = getRenderConfig();
                const { canvasX, canvasY } = screenToCanvas(touch.clientX, touch.clientY, canvas, viewport);
                const cell = getCellFromCoords(canvasX, canvasY, renderConfig, gridConfig);
                if (cell) {
                    callbacks.onClick(cell);
                }
            }
            state.isPanning = false;
            state.initialPinchDistance = null;
            callbacks.onHover(null);
        } else if (e.touches.length === 1) {
            // One touch remaining - reset pan state
            state.lastPanX = e.touches[0].clientX;
            state.lastPanY = e.touches[0].clientY;
            state.initialPinchDistance = null;
        }
    };

    const handleTouchCancel = () => {
        // Reset state when touch is cancelled (e.g., iOS notification, gesture interruption)
        state.isPanning = false;
        state.initialPinchDistance = null;
        callbacks.onHover(null);
    };

    // =========================================================================
    // Attach Event Listeners
    // =========================================================================

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("contextmenu", handleContextMenu);

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    // =========================================================================
    // Cleanup Function
    // =========================================================================

    return {
        cleanup: () => {
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
            canvas.removeEventListener("wheel", handleWheel);
            canvas.removeEventListener("contextmenu", handleContextMenu);

            canvas.removeEventListener("touchstart", handleTouchStart);
            canvas.removeEventListener("touchmove", handleTouchMove);
            canvas.removeEventListener("touchend", handleTouchEnd);
            canvas.removeEventListener("touchcancel", handleTouchCancel);
        },
    };
}
