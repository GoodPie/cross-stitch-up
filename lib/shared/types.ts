export interface PageRenderResult {
    pageNumber: number;
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
}

export interface ProcessingProgress {
    stage: string;
    progress: number; // 0-100
}

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
