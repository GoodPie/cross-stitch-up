"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageThumbnail } from "@/components/shared/page-thumbnail";
import { GridCanvas } from "./grid-canvas";
import type { PageRenderResult } from "@/lib/shared/types";
import type { GridCell, GridArrangement } from "@/lib/tools/merge/types";

interface PageSelectorProps {
  pages: PageRenderResult[];
  onBack: () => void;
  onMerge: (arrangement: GridArrangement) => void;
}

export function PageSelector({ pages, onBack, onMerge }: PageSelectorProps) {
  const [gridDimensions, setGridDimensions] = useState({ rows: 2, cols: 2 });
  const [cells, setCells] = useState<GridCell[]>([]);

  // Track which pages are assigned to the grid
  const assignedPageNumbers = new Set(cells.map((c) => c.pageNumber));

  const handleCellAdd = useCallback(
    (pageNumber: number, row: number, col: number) => {
      // Find the page
      const page = pages.find((p) => p.pageNumber === pageNumber);
      if (!page) return;

      setCells((prev) => {
        // Remove any existing cell at this position
        const filtered = prev.filter((c) => !(c.row === row && c.col === col));
        // Remove the page from any other position
        const withoutPage = filtered.filter((c) => c.pageNumber !== pageNumber);
        // Add new cell
        return [
          ...withoutPage,
          {
            row,
            col,
            pageNumber,
            canvas: page.canvas,
          },
        ];
      });
    },
    [pages],
  );

  const handleCellRemove = useCallback((row: number, col: number) => {
    setCells((prev) => prev.filter((c) => !(c.row === row && c.col === col)));
  }, []);

  const handleRowsChange = (delta: number) => {
    const newRows = Math.max(1, Math.min(5, gridDimensions.rows + delta));
    setGridDimensions((prev) => ({ ...prev, rows: newRows }));
    // Remove cells that are now out of bounds
    setCells((prev) => prev.filter((c) => c.row < newRows));
  };

  const handleColsChange = (delta: number) => {
    const newCols = Math.max(1, Math.min(5, gridDimensions.cols + delta));
    setGridDimensions((prev) => ({ ...prev, cols: newCols }));
    // Remove cells that are now out of bounds
    setCells((prev) => prev.filter((c) => c.col < newCols));
  };

  const handleMerge = () => {
    if (cells.length === 0) return;

    onMerge({
      rows: gridDimensions.rows,
      cols: gridDimensions.cols,
      cells,
    });
  };

  const totalSlots = gridDimensions.rows * gridDimensions.cols;
  const filledSlots = cells.length;
  const canMerge = filledSlots > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-lg font-serif font-semibold">
          Arrange Pattern Pages
        </h2>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel: PDF pages */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">PDF Pages</h3>
            <span className="text-sm text-muted-foreground">
              {pages.length} pages
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto p-1">
            {pages.map((page) => (
              <PageThumbnail
                key={page.pageNumber}
                page={page}
                isSelected={assignedPageNumbers.has(page.pageNumber)}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Drag pages to the grid on the right to arrange your pattern
          </p>
        </div>

        {/* Right panel: Grid canvas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">Pattern Grid</h3>
            <span className="text-sm text-muted-foreground">
              {filledSlots} of {totalSlots} slots filled
            </span>
          </div>

          {/* Grid dimension controls */}
          <div className="flex items-center gap-6 p-3 bg-accent/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Rows:</Label>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleRowsChange(-1)}
                disabled={gridDimensions.rows <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-6 text-center font-medium">
                {gridDimensions.rows}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleRowsChange(1)}
                disabled={gridDimensions.rows >= 5}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Cols:</Label>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleColsChange(-1)}
                disabled={gridDimensions.cols <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-6 text-center font-medium">
                {gridDimensions.cols}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleColsChange(1)}
                disabled={gridDimensions.cols >= 5}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Grid canvas */}
          <div className="min-h-[300px]">
            <GridCanvas
              cells={cells}
              pages={pages}
              onCellAdd={handleCellAdd}
              onCellRemove={handleCellRemove}
              gridDimensions={gridDimensions}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={handleMerge} disabled={!canMerge}>
          Merge Pattern
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Tips */}
      <div className="bg-accent/50 rounded-xl p-4 border border-border/50">
        <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span> Tips
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Drag pages from the left into the grid positions</li>
          <li>• Adjust rows and columns to match your pattern layout</li>
          <li>• Click × on a placed page to remove it from the grid</li>
          <li>• Skip cover pages, color keys, and instruction pages</li>
        </ul>
      </div>
    </div>
  );
}
