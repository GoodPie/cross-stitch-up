import type { ToolMetadata } from "@/lib/shared/types";

export const tools: ToolMetadata[] = [
    {
        id: "merge",
        name: "Pattern Merge",
        description: "Combine multi-page pattern PDFs into a single image",
        icon: "Layers",
        href: "/merge",
        status: "stable",
    },
    {
        id: "threads",
        name: "Thread Colors",
        description: "Browse and search thread colors by name, code, or find similar colors",
        icon: "Palette",
        href: "/threads",
        status: "stable",
    },
];
