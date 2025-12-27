"use client";

import React, { useState, useCallback } from "react";
import { RefreshCw, Grid3X3, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GridConfigForm } from "./grid-config-form";
import { GridCanvas, DEFAULT_VIEWPORT, VIEWPORT_CONSTRAINTS } from "./grid-canvas";
import { GridControls } from "./grid-controls";
import { GridCellTooltip } from "./grid-cell-tooltip";
import { ToolModeSelector } from "./tool-mode-selector";
import { ViewModeSelector } from "./view-mode-selector";
import { ColorPalette } from "./color-palette";
import type {
    GridConfig,
    CellPosition,
    ViewportState,
    GridCreatorPhase,
    ToolMode,
    ViewMode,
    SelectedColor,
    SymbolDefinition,
} from "@/lib/tools/grid-creator";
import { PALETTE_CONSTRAINTS, DEFAULT_VIEW_MODE, DEFAULT_SELECTED_COLOR } from "@/lib/tools/grid-creator";
import type { ThreadColour } from "@/lib/tools/threads/types";

interface GridCreatorClientProps {
    readonly threads: ThreadColour[];
    readonly brands: string[];
}

export function GridCreatorClient({ threads, brands }: GridCreatorClientProps) {
    // State machine
    const [phase, setPhase] = useState<GridCreatorPhase>("config");
    const [config, setConfig] = useState<GridConfig | null>(null);

    // Viewport state
    const [viewport, setViewport] = useState<ViewportState>(DEFAULT_VIEWPORT);

    // Hovered cell for tooltip
    const [hoveredCell, setHoveredCell] = useState<CellPosition | null>(null);

    // Tool mode and color state
    const [toolMode, setToolMode] = useState<ToolMode>("select");
    const [selectedColor, setSelectedColor] = useState<SelectedColor | null>(DEFAULT_SELECTED_COLOR);
    const [recentColors, setRecentColors] = useState<SelectedColor[]>([DEFAULT_SELECTED_COLOR]);

    // View mode for symbol/color display
    const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);

    // Color-to-symbol mapping (hex -> symbol character)
    const [colorSymbolMap, setColorSymbolMap] = useState<Map<string, string>>(new Map());

    // Sidebar visibility on mobile
    const [showPalette, setShowPalette] = useState(false);

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
        setToolMode("select");
    }, []);

    // Color selection handler - updates recent colors and includes symbol
    const handleColorSelect = useCallback(
        (color: SelectedColor) => {
            // Include symbol from the map if one exists for this color
            const symbol = colorSymbolMap.get(color.hex);
            const colorWithSymbol = symbol ? { ...color, symbol } : color;

            setSelectedColor(colorWithSymbol);

            // Add to recent colors (avoid duplicates, max 16)
            setRecentColors((prev) => {
                const filtered = prev.filter((c) => c.hex !== colorWithSymbol.hex);
                const updated = [colorWithSymbol, ...filtered];
                return updated.slice(0, PALETTE_CONSTRAINTS.MAX_RECENT_COLORS);
            });

            // Auto-switch to paint mode when selecting a color
            setToolMode("paint");
        },
        [colorSymbolMap]
    );

    // Symbol selection handler - updates the color-symbol mapping
    const handleSymbolSelect = useCallback(
        (symbol: SymbolDefinition) => {
            if (!selectedColor) return;

            // Update the color-symbol mapping
            setColorSymbolMap((prev) => {
                const newMap = new Map(prev);
                newMap.set(selectedColor.hex, symbol.character);
                return newMap;
            });

            // Update current selected color with the symbol
            setSelectedColor((prev) => (prev ? { ...prev, symbol: symbol.character } : null));

            // Also update recent colors to include the new symbol
            setRecentColors((prev) =>
                prev.map((c) => (c.hex === selectedColor.hex ? { ...c, symbol: symbol.character } : c))
            );
        },
        [selectedColor]
    );

    // Eyedropper handler - picks color from cell
    const handleEyedrop = useCallback((color: SelectedColor | null) => {
        if (color) {
            setSelectedColor(color);

            // Add to recent colors
            setRecentColors((prev) => {
                const filtered = prev.filter((c) => c.hex !== color.hex);
                const updated = [color, ...filtered];
                return updated.slice(0, PALETTE_CONSTRAINTS.MAX_RECENT_COLORS);
            });

            // Switch to paint mode after picking
            setToolMode("paint");
        }
    }, []);

    // Zoom controls
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

    return (
        <div className="flex h-[calc(100vh-12rem)] min-h-[600px] gap-0">
            {/* Main Content */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header */}
                <div className="mb-4 text-center">
                    <div className="bg-accent text-accent-foreground mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                        <Grid3X3 className="h-8 w-8" />
                    </div>
                    <h1 className="text-foreground font-serif text-3xl font-bold md:text-4xl">Grid Creator</h1>
                    <p className="text-muted-foreground mt-2">
                        Create a blank cross-stitch grid for designing patterns
                    </p>
                </div>

                {/* Config Phase */}
                {phase === "config" && (
                    <div className="mx-auto w-full max-w-md">
                        <GridConfigForm onSubmit={handleConfigSubmit} />
                    </div>
                )}

                {/* Rendering/Interactive Phase */}
                {(phase === "rendering" || phase === "interactive") && config && (
                    <div className="flex min-h-0 flex-1 flex-col space-y-4">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 px-4">
                            <div className="flex items-center gap-4">
                                <div className="text-muted-foreground text-sm">
                                    <span className="text-foreground font-medium">
                                        {config.width} x {config.height}
                                    </span>{" "}
                                    grid
                                </div>

                                {/* Tool Mode Selector */}
                                {phase === "interactive" && (
                                    <ToolModeSelector
                                        mode={toolMode}
                                        onModeChange={setToolMode}
                                        hasSelectedColor={selectedColor !== null}
                                    />
                                )}

                                {/* View Mode Selector */}
                                {phase === "interactive" && (
                                    <ViewModeSelector mode={viewMode} onModeChange={setViewMode} />
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Selected Color Indicator (mobile) */}
                                {phase === "interactive" && selectedColor && (
                                    <div className="flex items-center gap-2 md:hidden">
                                        <div
                                            className="h-8 w-8 rounded border shadow-sm"
                                            style={{ backgroundColor: selectedColor.hex }}
                                        />
                                    </div>
                                )}

                                {/* Palette Toggle (mobile) */}
                                {phase === "interactive" && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setShowPalette(!showPalette)}
                                        className="md:hidden"
                                        aria-label="Toggle color palette"
                                    >
                                        <Palette className="h-4 w-4" />
                                    </Button>
                                )}

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
                                    <span className="hidden sm:inline">New Grid</span>
                                </Button>
                            </div>
                        </div>

                        {/* Grid Container */}
                        <div className="bg-muted/30 relative min-h-0 flex-1 overflow-hidden rounded-lg border">
                            <GridCanvas
                                config={config}
                                viewport={viewport}
                                viewMode={viewMode}
                                toolMode={toolMode}
                                selectedColor={selectedColor}
                                onReady={handleGridReady}
                                onViewportChange={handleViewportChange}
                                onHoveredCellChange={handleHoveredCellChange}
                                onEyedrop={handleEyedrop}
                            />

                            {phase === "interactive" && <GridCellTooltip position={hoveredCell} />}

                            {/* Loading overlay */}
                            {phase === "rendering" && (
                                <div className="bg-background/50 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                                    <div className="text-center">
                                        <div className="border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                                        <p className="text-muted-foreground text-sm">Generating grid...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Color Palette Sidebar - Desktop: always visible, Mobile: toggle */}
            {phase === "interactive" && config && (
                <div className={`${showPalette ? "fixed inset-x-0 top-[72px] bottom-0 z-50 md:relative md:inset-auto md:top-auto" : "hidden md:block"}`}>
                    {/* Mobile backdrop */}
                    {showPalette && (
                        <button
                            type="button"
                            className="bg-background/80 absolute inset-0 backdrop-blur-sm md:hidden"
                            onClick={() => setShowPalette(false)}
                            aria-label="Close color palette"
                        />
                    )}

                    {/* Palette */}
                    <div className="pointer-events-none relative h-full md:static">
                        <div className="pointer-events-auto absolute right-0 h-full md:static">
                            <ColorPalette
                                threads={threads}
                                brands={brands}
                                selectedColor={selectedColor}
                                recentColors={recentColors}
                                onColorSelect={handleColorSelect}
                                onSymbolSelect={handleSymbolSelect}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
