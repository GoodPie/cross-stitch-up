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
        },
    },

    // React props should be read-only for immutability
    {
        files: ["**/*.tsx"],
        rules: {
            "react/prefer-read-only-props": "error",
        },
    },

    // Prefer Number static methods over global equivalents
    {
        files: ["**/*.{js,mjs,cjs,ts,tsx}"],
        plugins: { unicorn },
        rules: {
            "unicorn/prefer-number-properties": "error",
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
