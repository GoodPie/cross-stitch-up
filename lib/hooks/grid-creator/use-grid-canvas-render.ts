import { useState, useEffect, useCallback, useRef } from "react";
import type {
    GridConfig,
    ViewportState,
    CellState,
    CellPosition,
    RenderConfig,
} from "@/lib/tools/grid-creator";
import { cellKey, renderGrid, renderCell } from "@/lib/tools/grid-creator";

export interface UseGridCanvasRenderOptions {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    config: GridConfig;
    renderConfig: RenderConfig | null;
    viewport: ViewportState;
    cells: Map<string, CellState>;
    cellsRef: React.MutableRefObject<Map<string, CellState>>;
    hoveredCell: CellPosition | null;
    onReady?: () => void;
}

interface UseGridCanvasRenderReturn {
    /** Whether canvas has completed first render */
    isReady: boolean;
    /** Ref to viewport for interaction handlers */
    viewportRef: React.MutableRefObject<ViewportState>;
    /** Ref to renderConfig for interaction handlers */
    renderConfigRef: React.MutableRefObject<RenderConfig | null>;
}

/**
 * Hook for canvas rendering with DPI scaling and incremental hover updates.
 *
 * Handles:
 * - Main grid rendering with device pixel ratio scaling
 * - Viewport transforms (zoom and pan)
 * - Incremental hover cell re-rendering (without full redraw)
 * - Ready state tracking
 */
export function useGridCanvasRender({
    canvasRef,
    config,
    renderConfig,
    viewport,
    cells,
    cellsRef,
    hoveredCell,
    onReady,
}: UseGridCanvasRenderOptions): UseGridCanvasRenderReturn {
    const [isReady, setIsReady] = useState(false);

    // Refs for interaction handlers (avoid stale closure issues)
    const viewportRef = useRef(viewport);
    const renderConfigRef = useRef<RenderConfig | null>(null);
    const prevHoveredCellRef = useRef<CellPosition | null>(null);

    // Update refs when state changes
    useEffect(() => {
        viewportRef.current = viewport;
    }, [viewport]);

    useEffect(() => {
        renderConfigRef.current = renderConfig;
    }, [renderConfig]);

    // Main render function
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !renderConfig) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        // Handle device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        const { canvasWidth, canvasHeight } = renderConfig;

        // Set actual canvas dimensions (physical pixels)
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;

        // Set display size (CSS pixels)
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

        // Scale context for high DPI
        ctx.scale(dpr, dpr);

        // Apply viewport transformations for zoom and pan
        ctx.save();
        ctx.scale(viewport.scale, viewport.scale);
        ctx.translate(-viewport.offsetX, -viewport.offsetY);

        // Render the grid without hover highlight (hover is handled by separate effect)
        renderGrid(ctx, config, renderConfig, viewport, cells, null);

        // Reset hover ref - let hover effect re-apply highlight after full render
        prevHoveredCellRef.current = null;

        ctx.restore();

        // Mark as ready after first render
        if (!isReady) {
            setIsReady(true);
            onReady?.();
        }
    }, [canvasRef, renderConfig, config, viewport, cells, isReady, onReady]);

    // Render on any state change
    useEffect(() => {
        // Use requestAnimationFrame for smooth rendering
        const frameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(frameId);
    }, [render]);

    // =========================================================================
    // Optimized hover rendering - incremental updates for hover-only changes
    // =========================================================================
    useEffect(() => {
        const canvas = canvasRef.current;
        const currentRenderConfig = renderConfigRef.current;
        if (!canvas || !currentRenderConfig || !isReady) return;

        const prevHovered = prevHoveredCellRef.current;
        const currentHovered = hoveredCell;

        // Skip if hover hasn't changed
        if (
            prevHovered?.row === currentHovered?.row &&
            prevHovered?.col === currentHovered?.col
        ) {
            return;
        }

        // Get canvas context
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const currentViewport = viewportRef.current;
        const currentCells = cellsRef.current;

        // Apply transformations
        // Note: dpr scale is already applied by main render and persists on the canvas
        // Only apply viewport transforms here
        ctx.save();
        ctx.scale(currentViewport.scale, currentViewport.scale);
        ctx.translate(-currentViewport.offsetX, -currentViewport.offsetY);

        // Re-render previous hovered cell (remove highlight)
        if (prevHovered) {
            const prevCellState = currentCells.get(cellKey(prevHovered));
            renderCell(
                ctx,
                prevHovered,
                prevCellState,
                currentRenderConfig,
                false,
                currentViewport.scale
            );
        }

        // Render new hovered cell (add highlight)
        if (currentHovered) {
            const currentCellState = currentCells.get(cellKey(currentHovered));
            renderCell(
                ctx,
                currentHovered,
                currentCellState,
                currentRenderConfig,
                true,
                currentViewport.scale
            );
        }

        ctx.restore();

        // Update ref
        prevHoveredCellRef.current = currentHovered;
    }, [canvasRef, cellsRef, hoveredCell, isReady]);

    return {
        isReady,
        viewportRef,
        renderConfigRef,
    };
}
