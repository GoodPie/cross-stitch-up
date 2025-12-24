"use client";

import { useState } from "react";
import { Download, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExportDialog } from "@/components/shared/export-dialog";
import type { MergeResult } from "@/lib/tools/merge/types";

interface ResultsStateProps {
  result: MergeResult;
  onReset: () => void;
}

export function ResultsState({ result, onReset }: ResultsStateProps) {
  const [zoom, setZoom] = useState(1);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="space-y-2 text-center">
        <div className="bg-chart-2/20 text-chart-2 mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full">
          <svg
            className="h-6 w-6"
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
        <h2 className="text-foreground font-serif text-2xl font-bold">
          Pattern merged successfully!
        </h2>
        <p className="text-muted-foreground">
          Your cross stitch pattern is ready to download
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Preview Panel */}
        <Card className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground font-medium">Preview</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-muted-foreground w-12 text-center text-sm">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-accent/30 relative max-h-80 overflow-auto rounded-xl p-4">
            <div
              className="mx-auto overflow-hidden rounded-lg shadow-lg transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.imageUrl || "/placeholder.svg"}
                alt="Merged cross stitch pattern"
                className="h-auto max-w-full"
              />
            </div>
          </div>

          <p className="text-muted-foreground text-center text-sm">
            {result.dimensions.width} × {result.dimensions.height} stitches
          </p>
        </Card>

        {/* Actions Panel */}
        <div className="space-y-4">
          <Card className="space-y-3 p-4">
            <h3 className="text-foreground font-medium">Pattern Info</h3>
            <div className="space-y-2 text-sm">
              <div className="border-border/50 flex justify-between border-b py-2">
                <span className="text-muted-foreground">Original file</span>
                <span className="text-foreground max-w-40 truncate font-medium">
                  {result.originalFilename ?? "Unknown"}
                </span>
              </div>
              <div className="border-border/50 flex justify-between border-b py-2">
                <span className="text-muted-foreground">Pages merged</span>
                <span className="text-foreground font-medium">
                  {result.pagesMerged}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Dimensions</span>
                <span className="text-foreground font-medium">
                  {result.dimensions.width} × {result.dimensions.height}
                </span>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Button
              className="h-12 w-full gap-2 rounded-xl text-base"
              onClick={() => setExportDialogOpen(true)}
            >
              <Download className="h-5 w-5" />
              Export Pattern
            </Button>
          </div>

          <button
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-2 py-2 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Start over with a new pattern
          </button>
        </div>
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        canvas={result.canvas ?? null}
        filename={result.originalFilename || "cross-stitch-pattern"}
      />
    </div>
  );
}
