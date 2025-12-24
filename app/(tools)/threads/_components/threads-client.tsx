"use client";

import {useMemo, useState} from "react";
import type {ThreadColour} from "@/lib/tools/threads/types";
import {filterByBrand, filterBySearch, hexToRgb, sortByColorSimilarity} from "@/lib/tools/threads/color-utils";
import {ThreadFilters} from "./thread-filters";
import {ThreadGrid} from "./thread-grid";

interface ThreadsClientProps {
    readonly threads: ThreadColour[];
    readonly brands: string[];
}

export function ThreadsClient({ threads, brands }: ThreadsClientProps) {
    const [search, setSearch] = useState("");
    const [brand, setBrand] = useState("all");
    const [similarTo, setSimilarTo] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const filteredThreads = useMemo(() => {
        let result = threads;

        // Filter by brand
        result = filterByBrand(result, brand);

        // Filter by search text
        result = filterBySearch(result, search);

        // Sort by color similarity if a color is selected
        if (similarTo && hexToRgb(similarTo)) {
            return sortByColorSimilarity(result, similarTo);
        }

        return result.map((t) => ({ ...t, distance: 0 }));
    }, [threads, search, brand, similarTo]);

    const handleClearFilters = () => {
        setSearch("");
        setBrand("all");
        setSimilarTo("");
    };

    const hasFilters = search !== "" || brand !== "all" || similarTo !== "";

    return (
        <div className="space-y-6">
            <ThreadFilters
                search={search}
                onSearchChange={setSearch}
                brand={brand}
                onBrandChange={setBrand}
                brands={brands}
                similarTo={similarTo}
                onSimilarToChange={setSimilarTo}
                resultCount={filteredThreads.length}
                hasFilters={hasFilters}
                onClearFilters={handleClearFilters}
            />

            <ThreadGrid
                threads={filteredThreads}
                selectedId={selectedId}
                onSelect={setSelectedId}
                showDistance={!!similarTo && !!hexToRgb(similarTo)}
            />
        </div>
    );
}
