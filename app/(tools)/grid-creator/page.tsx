"use client";

import React, { useState, useCallback } from "react";
import { RefreshCw, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GridConfigForm } from "./_components/grid-config-form";
import { GridCanvas, DEFAULT_VIEWPORT, VIEWPORT_CONSTRAINTS } from "./_components/grid-canvas";
import { GridControls } from "./_components/grid-controls";
import { GridCellTooltip } from "./_components/grid-cell-tooltip";
import type { GridConfig, CellPosition, ViewportState, GridCreatorPhase } from "@/lib/tools/grid-creator";

export default function GridCreatorPage() {
    // State machine
    const [phase, setPhase] = useState<GridCreatorPhase>("config");
    const [config, setConfig] = useState<GridConfig | null>(null);

    // Viewport state (managed here for controls)
    const [viewport, setViewport] = useState<ViewportState>(DEFAULT_VIEWPORT);

    // Hovered cell for tooltip
    const [hoveredCell, setHoveredCell] = useState<CellPosition | null>(null);

    const handleConfigSubmit = useCallback((newConfig: GridConfig) => {
        setConfig(newConfig);
        setPhase("rendering");
    }, []);

    const handleGridReady = useCallback(() => {
        setPhase("interactive");
    }, []);

    const handleReset = useCallback(() => {
        setPhase("config");
        setConfig(null);
        setViewport(DEFAULT_VIEWPORT);
        setHoveredCell(null);
    }, []);

    // =========================================================================
    // Zoom controls
    // =========================================================================

    const handleZoomIn = useCallback(() => {
        setViewport((prev) => ({
            ...prev,
            scale: Math.min(VIEWPORT_CONSTRAINTS.MAX_SCALE, prev.scale + VIEWPORT_CONSTRAINTS.SCALE_STEP),
        }));
    }, []);

    const handleZoomOut = useCallback(() => {
        setViewport((prev) => ({
            ...prev,
            scale: Math.max(VIEWPORT_CONSTRAINTS.MIN_SCALE, prev.scale - VIEWPORT_CONSTRAINTS.SCALE_STEP),
        }));
    }, []);

    const handleResetView = useCallback(() => {
        setViewport(DEFAULT_VIEWPORT);
    }, []);

    const handleViewportChange = useCallback((newViewport: ViewportState) => {
        setViewport(newViewport);
    }, []);

    const handleHoveredCellChange = useCallback((cell: CellPosition | null) => {
        setHoveredCell(cell);
    }, []);

    // =========================================================================
    // Render based on phase
    // =========================================================================

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="bg-accent text-accent-foreground mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                    <Grid3X3 className="h-8 w-8" />
                </div>
                <h1 className="text-foreground font-serif text-3xl font-bold md:text-4xl">Grid Creator</h1>
                <p className="text-muted-foreground mt-2">Create a blank cross-stitch grid for designing patterns</p>
            </div>

            {/* Config Phase */}
            {phase === "config" && <GridConfigForm onSubmit={handleConfigSubmit} />}

            {/* Rendering/Interactive Phase */}
            {(phase === "rendering" || phase === "interactive") && config && (
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="text-muted-foreground text-sm">
                            <span className="text-foreground font-medium">
                                {config.width} x {config.height}
                            </span>{" "}
                            grid ({(config.width * config.height).toLocaleString()} cells)
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Zoom Controls */}
                            <GridControls
                                scale={viewport.scale}
                                onZoomIn={handleZoomIn}
                                onZoomOut={handleZoomOut}
                                onReset={handleResetView}
                            />

                            {/* New Grid Button */}
                            <Button variant="outline" onClick={handleReset} className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                New Grid
                            </Button>
                        </div>
                    </div>

                    {/* Grid Container */}
                    <div className="bg-muted/30 relative aspect-square w-full overflow-hidden rounded-lg border md:aspect-[4/3]">
                        <GridCanvas
                            config={config}
                            viewport={viewport}
                            onReady={handleGridReady}
                            onViewportChange={handleViewportChange}
                            onHoveredCellChange={handleHoveredCellChange}
                        />

                        {phase === "interactive" && <GridCellTooltip position={hoveredCell} />}

                        {/* Loading overlay for rendering phase */}
                        {phase === "rendering" && (
                            <div className="bg-background/50 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                                <div className="text-center">
                                    <div className="border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                                    <p className="text-muted-foreground text-sm">Generating grid...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Usage Tips */}
                    {phase === "interactive" && (
                        <div className="border-border/50 bg-accent/50 rounded-xl border p-4">
                            <h3 className="text-foreground mb-2 flex items-center gap-2 font-medium">
                                <span className="text-lg">💡</span> Interaction Tips
                            </h3>
                            <ul className="text-muted-foreground grid gap-1 text-sm sm:grid-cols-2">
                                <li>• Click cells to toggle them on/off</li>
                                <li>• Scroll wheel to zoom in/out</li>
                                <li>• Shift + drag to pan when zoomed</li>
                                <li>• Pinch to zoom on touch devices</li>
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
