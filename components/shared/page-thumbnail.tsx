"use client";

import { useMemo } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { PageRenderResult } from "@/lib/shared/types";

interface PageThumbnailProps {
    readonly page: PageRenderResult;
    readonly isSelected?: boolean;
    readonly isInGrid?: boolean;
    readonly gridPosition?: { row: number; col: number };
    readonly onRemove?: () => void;
    readonly draggable?: boolean;
    readonly onDragStart?: (e: React.DragEvent, page: PageRenderResult) => void;
}

export function PageThumbnail({
    page,
    isSelected = false,
    isInGrid = false,
    gridPosition,
    onRemove,
    draggable = true,
    onDragStart,
}: PageThumbnailProps) {
    // Convert canvas to data URL for display
    const imageUrl = useMemo(() => {
        return page.canvas.toDataURL("image/jpeg", 0.8);
    }, [page.canvas]);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(page.pageNumber));
        onDragStart?.(e, page);
    };

    return (
        <div
            tabIndex={0}
            role={"button"}
            draggable={draggable}
            onDragStart={handleDragStart}
            className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${isSelected ? "border-primary ring-primary/30 ring-2" : "border-border"} ${draggable ? "hover:border-primary/50 cursor-grab active:cursor-grabbing" : ""} ${isInGrid ? "h-full" : "aspect-3/4"} `}
        >
            {/* Thumbnail image */}
            <Image
                src={imageUrl}
                alt={`Page ${page.pageNumber}`}
                className="h-full w-full object-cover"
                draggable={false}
                fill={true}
            />

            {/* Page number badge */}
            <div className="bg-background/90 absolute top-2 left-2 rounded px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                Page {page.pageNumber}
            </div>

            {/* Grid position indicator (when in grid) */}
            {isInGrid && gridPosition && (
                <div className="bg-primary text-primary-foreground absolute bottom-2 left-2 rounded px-2 py-0.5 text-xs font-medium">
                    R{gridPosition.row + 1} C{gridPosition.col + 1}
                </div>
            )}

            {/* Remove button (when in grid) */}
            {isInGrid && onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="bg-destructive text-destructive-foreground absolute top-2 right-2 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove from grid"
                >
                    <X className="h-3 w-3" />
                </button>
            )}

            {/* Selected indicator (when in source list) */}
            {isSelected && !isInGrid && (
                <div className="bg-primary/20 absolute inset-0 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
}
