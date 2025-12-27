"use client";

import React from "react";
import type { CellPosition } from "@/lib/tools/grid-creator";

interface GridCellTooltipProps {
    readonly position: CellPosition | null;
}

/**
 * Displays the currently hovered cell coordinates.
 * Shows "Row X, Column Y" format with 1-based indexing for user-friendliness.
 */
export function GridCellTooltip({ position }: GridCellTooltipProps) {
    if (!position) return null;

    // Convert from 0-indexed to 1-indexed for display
    const row = position.row + 1;
    const col = position.col + 1;

    return (
        <div
            className="bg-background/80 pointer-events-none absolute bottom-4 left-4 rounded-md px-3 py-1.5 text-sm backdrop-blur"
            role="tooltip"
            aria-live="polite"
        >
            <span className="font-medium">Row {row}</span>
            <span className="text-muted-foreground">, </span>
            <span className="font-medium">Column {col}</span>
        </div>
    );
}
