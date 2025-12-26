"use client";

import { useMemo } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { PageRenderResult } from "@/lib/shared/types";

interface PageThumbnailProps {
    readonly page: PageRenderResult;
    readonly isSelected?: boolean;
    readonly isInGrid?: boolean;
    readonly gridPosition?: { row: number; col: number };
    readonly onRemove?: () => void;
    readonly draggable?: boolean;
}

export function PageThumbnail({
    page,
    isSelected = false,
    isInGrid = false,
    gridPosition,
    onRemove,
    draggable = true,
}: PageThumbnailProps) {
    // Only use useDraggable when draggable is true and not in grid
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `page-${page.pageNumber}`,
        disabled: !draggable || isInGrid,
        data: {
            pageNumber: page.pageNumber,
            page,
        },
    });

    // Convert canvas to data URL for display
    const imageUrl = useMemo(() => {
        return page.canvas.toDataURL("image/jpeg", 0.8);
    }, [page.canvas]);

    const style = transform
        ? {
              transform: CSS.Translate.toString(transform),
          }
        : undefined;

    const isDraggableEnabled = draggable && !isInGrid;

    return (
        <div
            ref={isDraggableEnabled ? setNodeRef : undefined}
            style={style}
            {...(isDraggableEnabled ? { ...listeners, ...attributes } : {})}
            className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${isSelected ? "border-primary ring-primary/30 ring-2" : "border-border"} ${isDraggableEnabled ? "hover:border-primary/50 cursor-grab active:cursor-grabbing" : ""} ${isInGrid ? "h-full" : "aspect-3/4"} ${isDragging ? "opacity-50" : ""} `}
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
