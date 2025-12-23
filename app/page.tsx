"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/header";
import { DropZone } from "@/components/drop-zone";
import { ProcessingState } from "@/components/processing-state";
import { ResultsState } from "@/components/results-state";
import { StitchConfigForm } from "@/components/stitch-config";
import { PageSelector } from "@/components/page-selector";
import { Footer } from "@/components/footer";
import type {
  StitchConfig,
  PageRenderResult,
  GridArrangement,
} from "@/lib/pdf/types";

export type AppState =
  | "config"
  | "upload"
  | "selecting"
  | "processing"
  | "success"
  | "error";

export interface MergedResult {
  imageUrl: string;
  pagesMerged: number;
  dimensions: { width: number; height: number };
  originalFilename: string;
  canvas?: HTMLCanvasElement;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("config");
  const [processingStage, setProcessingStage] = useState("");
  const [result, setResult] = useState<MergedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New state for user-driven flow
  const [stitchConfig, setStitchConfig] = useState<StitchConfig | null>(null);
  const [pdfPages, setPdfPages] = useState<PageRenderResult[]>([]);
  const [originalFilename, setOriginalFilename] = useState<string>("");

  const handleConfigContinue = useCallback((config: StitchConfig) => {
    setStitchConfig(config);
    setAppState("upload");
  }, []);

  const handleFileSelected = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      setAppState("error");
      return;
    }

    setOriginalFilename(file.name);
    setAppState("processing");
    setProcessingStage("Loading PDF...");
    setError(null);

    try {
      // Dynamic import to avoid SSR issues with pdfjs-dist
      const { loadAndRenderPdf } = await import("@/lib/pdf/pdf-loader");

      const pages = await loadAndRenderPdf(file, (stage) => {
        setProcessingStage(stage);
      });

      setPdfPages(pages);
      setAppState("selecting");
    } catch (err) {
      console.error("PDF loading error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load PDF. Please try a different file.",
      );
      setAppState("error");
    }
  }, []);

  const handleBackToConfig = useCallback(() => {
    setAppState("config");
    setPdfPages([]);
    setOriginalFilename("");
  }, []);

  const handleBackToUpload = useCallback(() => {
    setAppState("upload");
    setPdfPages([]);
  }, []);

  const handleMerge = useCallback(
    async (arrangement: GridArrangement) => {
      if (!stitchConfig) return;

      setAppState("processing");
      setProcessingStage("Extracting grid sections...");

      try {
        // Dynamic import for processing
        const { processSelectedPages } = await import("@/lib/pdf");

        const mergeResult = await processSelectedPages(
          pdfPages,
          arrangement,
          stitchConfig,
          (stage) => {
            setProcessingStage(stage);
          },
        );

        setResult({
          imageUrl: mergeResult.imageUrl,
          pagesMerged: mergeResult.pagesMerged,
          dimensions: mergeResult.dimensions,
          originalFilename,
          canvas: mergeResult.canvas,
        });
        setAppState("success");
      } catch (err) {
        console.error("PDF processing error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to process PDF. Please try again.",
        );
        setAppState("error");
      }
    },
    [pdfPages, stitchConfig, originalFilename],
  );

  const handleReset = useCallback(() => {
    setAppState("config");
    setResult(null);
    setError(null);
    setProcessingStage("");
    setStitchConfig(null);
    setPdfPages([]);
    setOriginalFilename("");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8 md:py-12">
        {appState === "config" && (
          <StitchConfigForm onContinue={handleConfigContinue} />
        )}
        {appState === "upload" && (
          <div className="space-y-4">
            <button
              onClick={handleBackToConfig}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to dimensions
            </button>
            {stitchConfig && (
              <div className="text-sm text-muted-foreground mb-4">
                Pattern size: {stitchConfig.width} × {stitchConfig.height}{" "}
                stitches
              </div>
            )}
            <DropZone onFileSelected={handleFileSelected} />
          </div>
        )}
        {appState === "selecting" && (
          <PageSelector
            pages={pdfPages}
            onBack={handleBackToUpload}
            onMerge={handleMerge}
          />
        )}
        {appState === "processing" && (
          <ProcessingState stage={processingStage} />
        )}
        {appState === "success" && result && (
          <ResultsState result={result} onReset={handleReset} />
        )}
        {appState === "error" && (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-serif font-semibold text-foreground">
              Oops! Something went wrong
            </h2>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={handleReset}
              className="inline-flex items-center px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all hover:shadow-md"
            >
              Start Over
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
