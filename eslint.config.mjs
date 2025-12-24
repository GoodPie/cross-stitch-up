import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import unicorn from "eslint-plugin-unicorn";

const eslintConfig = defineConfig([
    // Next.js + TypeScript
    ...nextVitals,
    ...nextTs,
    // Accessibility rules (jsx-a11y plugin provided by eslint-config-next)
    {
        files: ["**/*.{jsx,tsx}"],
        rules: {
            // Non-interactive elements should not have interactive handlers
            "jsx-a11y/no-static-element-interactions": "error",
            "jsx-a11y/interactive-supports-focus": "error",
            // Mouse events must have corresponding keyboard events for accessibility
            "jsx-a11y/mouse-events-have-key-events": "error",
            "jsx-a11y/click-events-have-key-events": "error",
            // Anchors must have accessible content
            "jsx-a11y/anchor-has-content": "error",
            // Prefer semantic HTML elements over ARIA roles
            "jsx-a11y/prefer-tag-over-role": "error",
        },
    },

    // React props should be read-only for immutability
    {
        files: ["**/*.tsx"],
        rules: {
            "react/prefer-read-only-props": "error",
        },
    },

    // Unicorn rules
    {
        files: ["**/*.{js,mjs,cjs,ts,tsx}"],
        plugins: { unicorn },
        rules: {
            "unicorn/prefer-number-properties": "error",
            "unicorn/prefer-at": "error",
        },
    },

    // Code clarity rules
    {
        files: ["**/*.{js,mjs,cjs,ts,tsx}"],
        rules: {
            // Nested ternaries reduce readability - use if/else or early returns
            "no-nested-ternary": "error",
            // Lexical declarations in case clauses need block scoping
            "no-case-declarations": "error",
            // No array index keys - use object keys instead
            "react/no-array-index-key": "error",
        },
    },

    // JSON linting
    {
        files: ["**/*.json"],
        ignores: ["package-lock.json"],
        plugins: { json },
        language: "json/json",
        extends: ["json/recommended"],
    },

    // Markdown linting
    {
        files: ["**/*.md"],
        plugins: { markdown },
        language: "markdown/gfm",
        extends: ["markdown/recommended"],
    },

    // Global ignores
    globalIgnores([".next/**", "out/**", "build/**", "public/**", "next-env.d.ts", "pnpm-lock.yaml"]),

    // Prettier (must be last)
    eslintConfigPrettier,
]);

export default eslintConfig;
