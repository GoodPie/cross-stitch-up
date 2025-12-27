import { useState, useCallback } from "react";
import type { ViewportState } from "@/lib/tools/grid-creator";
import { DEFAULT_VIEWPORT, VIEWPORT_CONSTRAINTS, clampViewport } from "@/lib/tools/grid-creator";

export interface UseGridViewportOptions {
    /** Initial viewport for restoration */
    initialViewport?: ViewportState;
}

interface UseGridViewportReturn {
    viewport: ViewportState;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleResetView: () => void;
    handleViewportChange: (viewport: ViewportState) => void;
    resetViewport: () => void;
}

/**
 * Hook for managing viewport state and zoom controls.
 *
 * Handles:
 * - Zoom in/out with step increments
 * - Reset to default view
 * - External viewport changes (from pan/zoom gestures)
 * - Clamping values to valid ranges
 */
export function useGridViewport(options?: UseGridViewportOptions): UseGridViewportReturn {
    const [viewport, setViewport] = useState<ViewportState>(options?.initialViewport ?? DEFAULT_VIEWPORT);

    const handleZoomIn = useCallback(() => {
        setViewport((prev) =>
            clampViewport({
                ...prev,
                scale: prev.scale + VIEWPORT_CONSTRAINTS.SCALE_STEP,
            })
        );
    }, []);

    const handleZoomOut = useCallback(() => {
        setViewport((prev) =>
            clampViewport({
                ...prev,
                scale: prev.scale - VIEWPORT_CONSTRAINTS.SCALE_STEP,
            })
        );
    }, []);

    const handleResetView = useCallback(() => {
        setViewport(DEFAULT_VIEWPORT);
    }, []);

    const handleViewportChange = useCallback((newViewport: ViewportState) => {
        setViewport(newViewport);
    }, []);

    const resetViewport = useCallback(() => {
        setViewport(DEFAULT_VIEWPORT);
    }, []);

    return {
        viewport,
        handleZoomIn,
        handleZoomOut,
        handleResetView,
        handleViewportChange,
        resetViewport,
    };
}
