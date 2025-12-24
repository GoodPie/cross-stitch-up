/**
 * Thread colour from the database
 */
export interface ThreadColour {
    id: string;
    brand: string;
    colour_code: string;
    name: string;
    r: number;
    g: number;
    b: number;
    hex: string;
}

/**
 * Filter options for thread search
 */
export interface ThreadFilters {
    /** Text search for name or code */
    search?: string;
    /** Filter by brand (e.g., "DMC") */
    brand?: string;
    /** Hex color to find similar threads (e.g., "#FF5733") */
    similarTo?: string;
    /** Sort order */
    sortBy?: "code" | "name" | "similarity";
}

/**
 * API response for threads endpoint
 */
export interface ThreadsResponse {
    threads: ThreadColour[];
    total: number;
    brands: string[];
}

/**
 * RGB color values
 */
export interface RGB {
    r: number;
    g: number;
    b: number;
}
