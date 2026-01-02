"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/shared/drop-zone";
import { ProcessingState } from "@/components/shared/processing-state";
import { ResultsState } from "./_components/results-state";
import { StitchConfigForm } from "./_components/stitch-config-form";
import { PageSelector } from "./_components/page-selector";
import type { PageInfo } from "@/lib/shared/types";
import type { StitchConfig, GridArrangement, MergeResult } from "@/lib/tools/merge/types";

type MergeState = "config" | "upload" | "selecting" | "processing" | "success" | "error";

export default function MergePage() {
    const [mergeState, setMergeState] = useState<MergeState>("config");
    const [processingStage, setProcessingStage] = useState("");
    const [result, setResult] = useState<MergeResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Configuration and page state
    const [stitchConfig, setStitchConfig] = useState<StitchConfig | null>(null);
    const [pdfPages, setPdfPages] = useState<PageInfo[]>([]);
    const [originalFilename, setOriginalFilename] = useState<string>("");
    const [jobId, setJobId] = useState<string>("");

    const handleConfigContinue = useCallback((config: StitchConfig) => {
        setStitchConfig(config);
        setMergeState("upload");
    }, []);

    /**
     * Upload PDF via SSE for real-time progress updates
     */
    const handleFileSelected = useCallback(async (file: File) => {
        if (file.type !== "application/pdf") {
            setError("Please upload a PDF file");
            setMergeState("error");
            return;
        }

        setOriginalFilename(file.name);
        setMergeState("processing");
        setProcessingStage("Uploading PDF...");
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Use SSE for progress updates
            const response = await fetch("/api/merge/upload", {
                method: "POST",
                headers: {
                    Accept: "text/event-stream",
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(errorData.error || "Failed to upload PDF");
            }

            // Check if we got SSE response
            const contentType = response.headers.get("content-type");
            if (contentType?.includes("text/event-stream")) {
                // Handle SSE stream
                const reader = response.body?.getReader();
                if (!reader) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error("No response body");
                }

                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (!line.trim()) continue;

                        // Parse SSE event
                        const eventMatch = line.match(/event: (\w+)/);
                        const dataMatch = line.match(/data: ([\s\S]+)/);

                        if (eventMatch && dataMatch) {
                            const eventType = eventMatch[1];
                            const data = JSON.parse(dataMatch[1]);

                            switch (eventType) {
                                case "start":
                                    setProcessingStage(`Processing ${data.totalPages} pages...`);
                                    break;
                                case "progress":
                                    setProcessingStage(
                                        `${data.stage === "rendering" ? "Rendering" : "Uploading"} page ${data.page} of ${data.total}...`
                                    );
                                    break;
                                case "batch":
                                    setProcessingStage(`Processed ${data.pagesCompleted} of ${data.total} pages...`);
                                    break;
                                case "complete":
                                    setJobId(data.jobId);
                                    setPdfPages(data.pages);
                                    setMergeState("selecting");
                                    break;
                                case "error":
                                    // noinspection ExceptionCaughtLocallyJS
                                    throw new Error(data.message);
                            }
                        }
                    }
                }
            } else {
                // Non-SSE response (fallback)
                const data = await response.json();
                setJobId(data.jobId);
                setPdfPages(data.pages);
                setMergeState("selecting");
            }
        } catch (err) {
            console.error("PDF upload error:", err);
            setError(err instanceof Error ? err.message : "Failed to upload PDF. Please try again.");
            setMergeState("error");
        }
    }, []);

    const handleBackToConfig = useCallback(() => {
        setMergeState("config");
        setPdfPages([]);
        setOriginalFilename("");
        setJobId("");
    }, []);

    const handleBackToUpload = useCallback(() => {
        setMergeState("upload");
        setPdfPages([]);
    }, []);

    /**
     * Process and merge selected pages via API
     */
    const handleMerge = useCallback(
        async (arrangement: GridArrangement) => {
            if (!stitchConfig || !jobId) return;

            setMergeState("processing");
            setProcessingStage("Extracting grid sections...");

            try {
                const response = await fetch("/api/merge/process", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        jobId,
                        cells: arrangement.cells,
                        arrangement: {
                            rows: arrangement.rows,
                            cols: arrangement.cols,
                        },
                        stitchConfig,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error(errorData.error || "Failed to process merge");
                }

                setProcessingStage("Finalizing...");

                const processResult = await response.json();

                setResult({
                    resultUrl: processResult.resultUrl,
                    previewUrl: processResult.previewUrl,
                    pagesMerged: processResult.pagesMerged,
                    dimensions: processResult.dimensions,
                    originalFilename,
                });
                setMergeState("success");
            } catch (err) {
                console.error("Merge processing error:", err);
                setError(err instanceof Error ? err.message : "Failed to process merge. Please try again.");
                setMergeState("error");
            }
        },
        [stitchConfig, jobId, originalFilename]
    );

    const handleReset = useCallback(() => {
        setMergeState("config");
        setResult(null);
        setError(null);
        setProcessingStage("");
        setStitchConfig(null);
        setPdfPages([]);
        setOriginalFilename("");
        setJobId("");
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
                            Pattern size: {stitchConfig.width} x {stitchConfig.height} stitches
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
