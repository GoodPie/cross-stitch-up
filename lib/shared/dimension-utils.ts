/**
 * Shared utilities for dimension-based config forms.
 */

export interface DimensionPreset {
    label: string;
    value: string;
}

export interface Dimensions {
    width: number;
    height: number;
}

/**
 * Parse a preset value like "100x100" into dimensions.
 * Returns null for "custom" preset.
 */
export function parsePreset(value: string): Dimensions | null {
    if (value === "custom") return null;
    const [w, h] = value.split("x").map(Number);
    return { width: w, height: h };
}

/**
 * Validate a dimension value against constraints.
 * Returns an error message if invalid, undefined if valid.
 */
export function validateDimension(
    value: string,
    fieldName: string,
    constraints: { min: number; max: number }
): string | undefined {
    const trimmed = value.trim();

    // Check for non-numeric characters (parseInt would accept "50abc" as 50)
    if (!/^\d+$/.test(trimmed)) {
        return `${fieldName} must be a valid number`;
    }

    const num = Number.parseInt(trimmed, 10);
    if (Number.isNaN(num)) {
        return `${fieldName} must be a number`;
    }
    if (num < constraints.min) {
        return `${fieldName} must be at least ${constraints.min}`;
    }
    if (num > constraints.max) {
        return `${fieldName} must be at most ${constraints.max}`;
    }
    return undefined;
}
