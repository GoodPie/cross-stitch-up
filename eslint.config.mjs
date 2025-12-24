import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
    // Next.js + TypeScript
    ...nextVitals,
    ...nextTs,

    // React props should be read-only for immutability
    {
        files: ["**/*.tsx"],
        rules: {
            "react/prefer-read-only-props": "error",
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
