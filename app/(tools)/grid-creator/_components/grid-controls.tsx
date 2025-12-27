"use client";

import React from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VIEWPORT_CONSTRAINTS } from "@/lib/tools/grid-creator";

interface GridControlsProps {
    readonly scale: number;
    readonly onZoomIn: () => void;
    readonly onZoomOut: () => void;
    readonly onReset: () => void;
}

export function GridControls({ scale, onZoomIn, onZoomOut, onReset }: GridControlsProps) {
    const zoomPercentage = Math.round(scale * 100);
    const canZoomIn = scale < VIEWPORT_CONSTRAINTS.MAX_SCALE;
    const canZoomOut = scale > VIEWPORT_CONSTRAINTS.MIN_SCALE;
    const isDefaultZoom = scale === 1.0;

    return (
        <div className="bg-background flex items-center gap-2 rounded-lg border p-1 shadow-sm">
            {/* Zoom Out Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onZoomOut}
                disabled={!canZoomOut}
                aria-label="Zoom out"
                className="h-8 w-8"
            >
                <ZoomOut className="h-4 w-4" />
            </Button>

            {/* Zoom Level Display */}
            <span
                className="min-w-[4rem] text-center text-sm font-medium tabular-nums"
                aria-live="polite"
                aria-label={`Zoom level: ${zoomPercentage}%`}
            >
                {zoomPercentage}%
            </span>

            {/* Zoom In Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onZoomIn}
                disabled={!canZoomIn}
                aria-label="Zoom in"
                className="h-8 w-8"
            >
                <ZoomIn className="h-4 w-4" />
            </Button>

            {/* Separator */}
            <div className="bg-border mx-1 h-6 w-px" />

            {/* Reset View Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onReset}
                disabled={isDefaultZoom}
                aria-label="Reset view to default zoom"
                className="h-8 w-8"
            >
                <RotateCcw className="h-4 w-4" />
            </Button>
        </div>
    );
}
