import type { RGB, ThreadColour } from "./types";

/**
 * Calculate Euclidean distance between two colors in RGB space.
 * Lower values mean more similar colors.
 */
export function colorDistance(c1: RGB, c2: RGB): number {
    const rDiff = c1.r - c2.r;
    const gDiff = c1.g - c2.g;
    const bDiff = c1.b - c2.b;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

/**
 * Parse a hex color string to RGB values.
 * Supports both "#RRGGBB" and "RRGGBB" formats.
 */
export function hexToRgb(hex: string): RGB | null {
    const cleanHex = hex.replace(/^#/, "");

    if (cleanHex.length !== 6) {
        return null;
    }

    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);

    if (!result) {
        return null;
    }

    return {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
    };
}

/**
 * Sort threads by color similarity to a target color.
 * Returns a new sorted array with distance included.
 */
export function sortByColorSimilarity(
    threads: ThreadColour[],
    targetHex: string
): (ThreadColour & { distance: number })[] {
    const targetRgb = hexToRgb(targetHex);

    if (!targetRgb) {
        return threads.map((t) => ({ ...t, distance: 0 }));
    }

    return threads
        .map((thread) => ({
            ...thread,
            distance: colorDistance(targetRgb, { r: thread.r, g: thread.g, b: thread.b }),
        }))
        .sort((a, b) => a.distance - b.distance);
}

/**
 * Filter threads by text search (matches name or code).
 * Case-insensitive search.
 */
export function filterBySearch(threads: ThreadColour[], search: string): ThreadColour[] {
    const searchLower = search.toLowerCase().trim();

    if (!searchLower) {
        return threads;
    }

    return threads.filter(
        (thread) =>
            thread.name.toLowerCase().includes(searchLower) ||
            thread.colour_code.toLowerCase().includes(searchLower)
    );
}

/**
 * Filter threads by brand.
 */
export function filterByBrand(threads: ThreadColour[], brand: string): ThreadColour[] {
    if (!brand || brand === "all") {
        return threads;
    }

    return threads.filter((thread) => thread.brand === brand);
}

/**
 * Get contrast color (black or white) for text on a given background.
 * Uses relative luminance calculation.
 */
export function getContrastColor(hex: string): "black" | "white" {
    const rgb = hexToRgb(hex);

    if (!rgb) {
        return "black";
    }

    // Calculate relative luminance
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

    return luminance > 0.5 ? "black" : "white";
}
