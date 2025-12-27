"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/shared/drop-zone";
import { ProcessingState } from "@/components/shared/processing-state";
import { ResultsState } from "./_components/results-state";
import { StitchConfigForm } from "./_components/stitch-config-form";
import { PageSelector } from "./_components/page-selector";
import type { PageRenderResult } from "@/lib/shared/types";
import type { StitchConfig, GridArrangement, MergeResult } from "@/lib/tools/merge/types";

type MergeState = "config" | "upload" | "selecting" | "processing" | "success" | "error";

export default function MergePage() {
    const [mergeState, setMergeState] = useState<MergeState>("config");
    const [processingStage, setProcessingStage] = useState("");
    const [result, setResult] = useState<MergeResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // New state for user-driven flow
    const [stitchConfig, setStitchConfig] = useState<StitchConfig | null>(null);
    const [pdfPages, setPdfPages] = useState<PageRenderResult[]>([]);
    const [originalFilename, setOriginalFilename] = useState<string>("");

    const handleConfigContinue = useCallback((config: StitchConfig) => {
        setStitchConfig(config);
        setMergeState("upload");
    }, []);

    const handleFileSelected = useCallback(async (file: File) => {
        if (file.type !== "application/pdf") {
            setError("Please upload a PDF file");
            setMergeState("error");
            return;
        }

        setOriginalFilename(file.name);
        setMergeState("processing");
        setProcessingStage("Loading PDF...");
        setError(null);

        try {
            // Dynamic import to avoid SSR issues with pdfjs-dist
            const { loadAndRenderPdf } = await import("@/lib/shared/pdf-loader");

            const pages = await loadAndRenderPdf(file, (stage) => {
                setProcessingStage(stage);
            });

            setPdfPages(pages);
            setMergeState("selecting");
        } catch (err) {
            console.error("PDF loading error:", err);
            setError(err instanceof Error ? err.message : "Failed to load PDF. Please try a different file.");
            setMergeState("error");
        }
    }, []);

    const handleBackToConfig = useCallback(() => {
        setMergeState("config");
        setPdfPages([]);
        setOriginalFilename("");
    }, []);

    const handleBackToUpload = useCallback(() => {
        setMergeState("upload");
        setPdfPages([]);
    }, []);

    const handleMerge = useCallback(
        async (arrangement: GridArrangement) => {
            if (!stitchConfig) return;

            setMergeState("processing");
            setProcessingStage("Extracting grid sections...");

            try {
                // Dynamic import for processing
                const { processSelectedPages } = await import("@/lib/tools/merge");

                const mergeResult = await processSelectedPages(pdfPages, arrangement, stitchConfig, (stage) => {
                    setProcessingStage(stage);
                });

                setResult({
                    imageUrl: mergeResult.imageUrl,
                    pagesMerged: mergeResult.pagesMerged,
                    dimensions: mergeResult.dimensions,
                    originalFilename,
                    canvas: mergeResult.canvas,
                });
                setMergeState("success");
            } catch (err) {
                console.error("PDF processing error:", err);
                setError(err instanceof Error ? err.message : "Failed to process PDF. Please try again.");
                setMergeState("error");
            }
        },
        [pdfPages, stitchConfig, originalFilename]
    );

    const handleReset = useCallback(() => {
        setMergeState("config");
        setResult(null);
        setError(null);
        setProcessingStage("");
        setStitchConfig(null);
        setPdfPages([]);
        setOriginalFilename("");
    }, []);

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            {mergeState === "config" && <StitchConfigForm onContinue={handleConfigContinue} />}
            {mergeState === "upload" && (
                <div className="space-y-4">
                    <button
                        onClick={handleBackToConfig}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to dimensions
                    </button>
                    {stitchConfig && (
                        <div className="text-muted-foreground mb-4 text-sm">
                            Pattern size: {stitchConfig.width} × {stitchConfig.height} stitches
                        </div>
                    )}
                    <DropZone onFileSelected={handleFileSelected} />
                </div>
            )}
            {mergeState === "selecting" && (
                <PageSelector pages={pdfPages} onBack={handleBackToUpload} onMerge={handleMerge} />
            )}
            {mergeState === "processing" && <ProcessingState stage={processingStage} />}
            {mergeState === "success" && result && <ResultsState result={result} onReset={handleReset} />}
            {mergeState === "error" && (
                <div className="space-y-4 text-center">
                    <div className="bg-destructive/10 inline-flex h-16 w-16 items-center justify-center rounded-full">
                        <svg className="text-destructive h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-foreground font-serif text-xl font-semibold">Oops! Something went wrong</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <button
                        onClick={handleReset}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-xl px-6 py-2 font-medium transition-all hover:shadow-md"
                    >
                        Start Over
                    </button>
                </div>
            )}
        </div>
    );
}
