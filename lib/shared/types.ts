export interface PageRenderResult {
    pageNumber: number;
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
}

/**
 * Server-side page info returned from API.
 * Replaces PageRenderResult when using server-side PDF processing.
 */
export interface PageInfo {
    pageNumber: number;
    thumbnailUrl: string; // 200px thumbnail in Blob storage
    imageUrl: string; // Full resolution in Blob storage
    width: number;
    height: number;
}

export interface ProcessingProgress {
    stage: string;
    progress: number; // 0-100
}

/**
 * Processing stage constants for type-safe stage messages.
 * Use these instead of magic strings throughout the codebase.
 */
export const ProcessingStages = {
    // PDF loading stages
    READING_PDF: "Reading PDF...",
    // Merge tool stages
    EXTRACTING_GRIDS: "Extracting grid sections...",
    MERGING_PATTERN: "Merging pattern...",
    FINALIZING: "Finalizing...",
} as const;

/**
 * Helper functions for dynamic processing stage messages.
 */
export const ProcessingStageHelpers = {
    /** Generate message for rendering a specific page */
    renderingPage: (current: number, total: number): string => `Rendering page ${current} of ${total}...`,
    /** Generate message for extracting grid from a specific page */
    extractingGridFromPage: (pageNumber: number): string => `Extracting grid from page ${pageNumber}...`,
} as const;

export type ProcessingStage = (typeof ProcessingStages)[keyof typeof ProcessingStages];

export interface ExportOptions {
    format: "png" | "pdf";
    sizeMode: "pixels" | "print";
    width: number;
    height: number;
    dpi?: number; // For print mode
    maintainAspectRatio: boolean;
}

export interface ToolMetadata {
    id: string;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    href: string;
    status: "stable" | "beta" | "coming-soon";
}
