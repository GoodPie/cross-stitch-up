"use client";

import { useMemo } from "react";
import Image from 'next/image'
import { X } from "lucide-react";
import type { PageRenderResult } from "@/lib/pdf/types";

interface PageThumbnailProps {
  page: PageRenderResult;
  isSelected?: boolean;
  isInGrid?: boolean;
  gridPosition?: { row: number; col: number };
  onRemove?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, page: PageRenderResult) => void;
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
      draggable={draggable}
      onDragStart={handleDragStart}
      className={`
        relative group rounded-lg overflow-hidden border-2 transition-all duration-200
        ${isSelected ? "border-primary ring-2 ring-primary/30" : "border-border"}
        ${draggable ? "cursor-grab active:cursor-grabbing hover:border-primary/50" : ""}
        ${isInGrid ? "h-full" : "aspect-[3/4]"}
      `}
    >
      {/* Thumbnail image */}
      <Image
        src={imageUrl}
        alt={`Page ${page.pageNumber}`}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Page number badge */}
      <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium">
        Page {page.pageNumber}
      </div>

      {/* Grid position indicator (when in grid) */}
      {isInGrid && gridPosition && (
        <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-medium">
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
          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove from grid"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Selected indicator (when in source list) */}
      {isSelected && !isInGrid && (
        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
          <div className="bg-primary text-primary-foreground rounded-full p-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
