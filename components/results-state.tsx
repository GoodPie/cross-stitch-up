"use client";

import {useState} from "react";
import {Download, RotateCcw, ZoomIn, ZoomOut} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {ExportDialog} from "@/components/export-dialog";
import type {MergedResult} from "@/app/page";
import {Image} from "next/dist/client/image-component";

interface ResultsStateProps {
    result: MergedResult;
    onReset: () => void;
}

export function ResultsState({result, onReset}: ResultsStateProps) {
    const [zoom, setZoom] = useState(1);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Success header */}
            <div className="text-center space-y-2">
                <div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-chart-2/20 text-chart-2 mb-2">
                    <svg
                        className="w-6 h-6"
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
                <h2 className="text-2xl font-serif font-bold text-foreground">
                    Pattern merged successfully!
                </h2>
                <p className="text-muted-foreground">
                    Your cross stitch pattern is ready to download
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Preview Panel */}
                <Card className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground">Preview</h3>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                            >
                                <ZoomOut className="h-4 w-4"/>
                            </Button>
                            <span className="text-sm text-muted-foreground w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                            >
                                <ZoomIn className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>

          <div className="relative overflow-auto bg-accent/30 rounded-xl p-4 max-h-80">
            <div
              className="mx-auto transition-transform duration-200 shadow-lg rounded-lg overflow-hidden"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
              }}
            >
              <img
                src={result.imageUrl || "/placeholder.svg"}
                alt="Merged cross stitch pattern"
                className="max-w-full h-auto"
              />
            </div>
          </div>

                    <p className="text-center text-sm text-muted-foreground">
                        {result.dimensions.width} × {result.dimensions.height} stitches
                    </p>
                </Card>

                {/* Actions Panel */}
                <div className="space-y-4">
                    <Card className="p-4 space-y-3">
                        <h3 className="font-medium text-foreground">Pattern Info</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between py-2 border-b border-border/50">
                                <span className="text-muted-foreground">Original file</span>
                                <span className="font-medium text-foreground truncate max-w-40">
                  {result.originalFilename}
                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border/50">
                                <span className="text-muted-foreground">Pages merged</span>
                                <span className="font-medium text-foreground">
                  {result.pagesMerged}
                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">Dimensions</span>
                                <span className="font-medium text-foreground">
                  {result.dimensions.width} × {result.dimensions.height}
                </span>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-3">
                        <Button
                            className="w-full gap-2 h-12 text-base rounded-xl"
                            onClick={() => setExportDialogOpen(true)}
                        >
                            <Download className="w-5 h-5"/>
                            Export Pattern
                        </Button>
                    </div>

                    <button
                        onClick={onReset}
                        className="w-full flex items-center justify-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <RotateCcw className="w-4 h-4"/>
                        Start over with a new pattern
                    </button>
                </div>
            </div>

            <ExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                canvas={result.canvas ?? null}
                filename={result.originalFilename}
            />
        </div>
    );
}
