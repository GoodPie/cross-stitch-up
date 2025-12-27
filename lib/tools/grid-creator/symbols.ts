/**
 * Grid Creator Tool - Symbol Definitions
 *
 * Comprehensive symbol set for cross stitch pattern display.
 * ~100 symbols including ASCII characters and traditional cross stitch icons.
 */

/**
 * Symbol definition for the symbol picker and renderer.
 */
export interface SymbolDefinition {
    /** Unique identifier */
    id: string;
    /** Display character (Unicode) */
    character: string;
    /** Category for grouping in picker */
    category: "letter" | "number" | "punctuation" | "stitch";
    /** Human-readable name */
    name: string;
}

/**
 * Symbol categories for filtering.
 */
export const SYMBOL_CATEGORIES = {
    LETTER: "letter",
    NUMBER: "number",
    PUNCTUATION: "punctuation",
    STITCH: "stitch",
} as const;

export type SymbolCategory = (typeof SYMBOL_CATEGORIES)[keyof typeof SYMBOL_CATEGORIES];

/**
 * Letter symbols (A-Z)
 */
export const LETTER_SYMBOLS: SymbolDefinition[] = [
    { id: "A", character: "A", category: "letter", name: "Letter A" },
    { id: "B", character: "B", category: "letter", name: "Letter B" },
    { id: "C", character: "C", category: "letter", name: "Letter C" },
    { id: "D", character: "D", category: "letter", name: "Letter D" },
    { id: "E", character: "E", category: "letter", name: "Letter E" },
    { id: "F", character: "F", category: "letter", name: "Letter F" },
    { id: "G", character: "G", category: "letter", name: "Letter G" },
    { id: "H", character: "H", category: "letter", name: "Letter H" },
    { id: "I", character: "I", category: "letter", name: "Letter I" },
    { id: "J", character: "J", category: "letter", name: "Letter J" },
    { id: "K", character: "K", category: "letter", name: "Letter K" },
    { id: "L", character: "L", category: "letter", name: "Letter L" },
    { id: "M", character: "M", category: "letter", name: "Letter M" },
    { id: "N", character: "N", category: "letter", name: "Letter N" },
    { id: "O", character: "O", category: "letter", name: "Letter O" },
    { id: "P", character: "P", category: "letter", name: "Letter P" },
    { id: "Q", character: "Q", category: "letter", name: "Letter Q" },
    { id: "R", character: "R", category: "letter", name: "Letter R" },
    { id: "S", character: "S", category: "letter", name: "Letter S" },
    { id: "T", character: "T", category: "letter", name: "Letter T" },
    { id: "U", character: "U", category: "letter", name: "Letter U" },
    { id: "V", character: "V", category: "letter", name: "Letter V" },
    { id: "W", character: "W", category: "letter", name: "Letter W" },
    { id: "X", character: "X", category: "letter", name: "Letter X" },
    { id: "Y", character: "Y", category: "letter", name: "Letter Y" },
    { id: "Z", character: "Z", category: "letter", name: "Letter Z" },
];

/**
 * Number symbols (0-9)
 */
export const NUMBER_SYMBOLS: SymbolDefinition[] = [
    { id: "0", character: "0", category: "number", name: "Number 0" },
    { id: "1", character: "1", category: "number", name: "Number 1" },
    { id: "2", character: "2", category: "number", name: "Number 2" },
    { id: "3", character: "3", category: "number", name: "Number 3" },
    { id: "4", character: "4", category: "number", name: "Number 4" },
    { id: "5", character: "5", category: "number", name: "Number 5" },
    { id: "6", character: "6", category: "number", name: "Number 6" },
    { id: "7", character: "7", category: "number", name: "Number 7" },
    { id: "8", character: "8", category: "number", name: "Number 8" },
    { id: "9", character: "9", category: "number", name: "Number 9" },
];

/**
 * Punctuation and basic ASCII symbols
 */
export const PUNCTUATION_SYMBOLS: SymbolDefinition[] = [
    { id: "plus", character: "+", category: "punctuation", name: "Plus" },
    { id: "minus", character: "-", category: "punctuation", name: "Minus" },
    { id: "times", character: "×", category: "punctuation", name: "Times" },
    { id: "divide", character: "÷", category: "punctuation", name: "Divide" },
    { id: "equals", character: "=", category: "punctuation", name: "Equals" },
    { id: "hash", character: "#", category: "punctuation", name: "Hash" },
    { id: "at", character: "@", category: "punctuation", name: "At" },
    { id: "ampersand", character: "&", category: "punctuation", name: "Ampersand" },
    { id: "percent", character: "%", category: "punctuation", name: "Percent" },
    { id: "asterisk", character: "*", category: "punctuation", name: "Asterisk" },
    { id: "caret", character: "^", category: "punctuation", name: "Caret" },
    { id: "tilde", character: "~", category: "punctuation", name: "Tilde" },
    { id: "pipe", character: "|", category: "punctuation", name: "Pipe" },
    { id: "colon", character: ":", category: "punctuation", name: "Colon" },
    { id: "semicolon", character: ";", category: "punctuation", name: "Semicolon" },
    { id: "exclaim", character: "!", category: "punctuation", name: "Exclamation" },
    { id: "question", character: "?", category: "punctuation", name: "Question" },
    { id: "dollar", character: "$", category: "punctuation", name: "Dollar" },
    { id: "less", character: "<", category: "punctuation", name: "Less Than" },
    { id: "greater", character: ">", category: "punctuation", name: "Greater Than" },
    { id: "slash", character: "/", category: "punctuation", name: "Forward Slash" },
    { id: "backslash", character: "\\", category: "punctuation", name: "Backslash" },
    { id: "underscore", character: "_", category: "punctuation", name: "Underscore" },
    { id: "period", character: ".", category: "punctuation", name: "Period" },
];

/**
 * Cross stitch specific symbols - geometric shapes and traditional icons
 */
export const STITCH_SYMBOLS: SymbolDefinition[] = [
    // Filled shapes
    { id: "filled-circle", character: "●", category: "stitch", name: "Filled Circle" },
    { id: "filled-square", character: "■", category: "stitch", name: "Filled Square" },
    { id: "filled-diamond", character: "◆", category: "stitch", name: "Filled Diamond" },
    { id: "filled-triangle-up", character: "▲", category: "stitch", name: "Filled Triangle Up" },
    { id: "filled-triangle-down", character: "▼", category: "stitch", name: "Filled Triangle Down" },
    { id: "filled-triangle-left", character: "◀", category: "stitch", name: "Filled Triangle Left" },
    { id: "filled-triangle-right", character: "▶", category: "stitch", name: "Filled Triangle Right" },
    { id: "filled-star", character: "★", category: "stitch", name: "Filled Star" },
    { id: "filled-heart", character: "♥", category: "stitch", name: "Filled Heart" },

    // Empty shapes
    { id: "empty-circle", character: "○", category: "stitch", name: "Empty Circle" },
    { id: "empty-square", character: "□", category: "stitch", name: "Empty Square" },
    { id: "empty-diamond", character: "◇", category: "stitch", name: "Empty Diamond" },
    { id: "empty-triangle-up", character: "△", category: "stitch", name: "Empty Triangle Up" },
    { id: "empty-triangle-down", character: "▽", category: "stitch", name: "Empty Triangle Down" },
    { id: "empty-star", character: "☆", category: "stitch", name: "Empty Star" },
    { id: "empty-heart", character: "♡", category: "stitch", name: "Empty Heart" },

    // Cross stitch specific
    { id: "cross", character: "╳", category: "stitch", name: "Cross" },
    { id: "half-cross-right", character: "╱", category: "stitch", name: "Half Cross Right" },
    { id: "half-cross-left", character: "╲", category: "stitch", name: "Half Cross Left" },
    { id: "horizontal-line", character: "─", category: "stitch", name: "Horizontal Line" },
    { id: "vertical-line", character: "│", category: "stitch", name: "Vertical Line" },

    // Additional geometric
    { id: "small-circle", character: "•", category: "stitch", name: "Small Circle" },
    { id: "ring", character: "◎", category: "stitch", name: "Ring" },
    { id: "double-circle", character: "◉", category: "stitch", name: "Double Circle" },
    { id: "square-with-cross", character: "⊠", category: "stitch", name: "Square with Cross" },
    { id: "square-with-plus", character: "⊞", category: "stitch", name: "Square with Plus" },
    { id: "lozenge", character: "◊", category: "stitch", name: "Lozenge" },
    { id: "small-square", character: "▪", category: "stitch", name: "Small Square" },
    { id: "small-square-empty", character: "▫", category: "stitch", name: "Small Empty Square" },

    // Arrows and pointers
    { id: "arrow-up", character: "↑", category: "stitch", name: "Arrow Up" },
    { id: "arrow-down", character: "↓", category: "stitch", name: "Arrow Down" },
    { id: "arrow-left", character: "←", category: "stitch", name: "Arrow Left" },
    { id: "arrow-right", character: "→", category: "stitch", name: "Arrow Right" },

    // Miscellaneous
    { id: "club", character: "♣", category: "stitch", name: "Club" },
    { id: "spade", character: "♠", category: "stitch", name: "Spade" },
    { id: "diamond-suit", character: "♦", category: "stitch", name: "Diamond Suit" },
    { id: "music-note", character: "♪", category: "stitch", name: "Music Note" },
    { id: "sun", character: "☀", category: "stitch", name: "Sun" },
    { id: "moon", character: "☽", category: "stitch", name: "Moon" },
    { id: "snowflake", character: "❄", category: "stitch", name: "Snowflake" },
    { id: "flower", character: "✿", category: "stitch", name: "Flower" },
];

/**
 * All symbols combined.
 * Total: ~100 symbols
 */
export const ALL_SYMBOLS: SymbolDefinition[] = [
    ...LETTER_SYMBOLS,
    ...NUMBER_SYMBOLS,
    ...PUNCTUATION_SYMBOLS,
    ...STITCH_SYMBOLS,
];

/**
 * Get symbols filtered by category.
 */
export function getSymbolsByCategory(category: SymbolCategory): SymbolDefinition[] {
    return ALL_SYMBOLS.filter((s) => s.category === category);
}

/**
 * Find a symbol by its ID.
 */
export function findSymbolById(id: string): SymbolDefinition | undefined {
    return ALL_SYMBOLS.find((s) => s.id === id);
}

/**
 * Find a symbol by its character.
 */
export function findSymbolByCharacter(character: string): SymbolDefinition | undefined {
    return ALL_SYMBOLS.find((s) => s.character === character);
}

/**
 * Symbol rendering constraints.
 */
export const SYMBOL_RENDER_CONSTRAINTS = {
    /** Minimum effective cell size (with zoom) to render symbols */
    MIN_CELL_SIZE: 8,
    /** Symbol font size as percentage of cell size */
    FONT_SIZE_RATIO: 0.65,
    /** Background color for symbol-only mode */
    SYMBOL_ONLY_BACKGROUND: "#f5f5f5",
    /** Default text color when no contrast calculation needed */
    DEFAULT_TEXT_COLOR: "#333333",
} as const;
