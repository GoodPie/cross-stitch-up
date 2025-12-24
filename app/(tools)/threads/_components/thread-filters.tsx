"use client";

import { Search, X, Pipette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ThreadFiltersProps {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly brand: string;
    readonly onBrandChange: (value: string) => void;
    readonly brands: string[];
    readonly similarTo: string;
    readonly onSimilarToChange: (value: string) => void;
    readonly resultCount: number;
    readonly hasFilters: boolean;
    readonly onClearFilters: () => void;
}

export function ThreadFilters({
    search,
    onSearchChange,
    brand,
    onBrandChange,
    brands,
    similarTo,
    onSimilarToChange,
    resultCount,
    hasFilters,
    onClearFilters,
}: ThreadFiltersProps) {
    return (
        <div className="bg-card sticky top-20 z-50 space-y-4 rounded-lg border p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-4">
                {/* Search input */}
                <div className="min-w-50 flex-1 space-y-1.5">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            id="search"
                            type="text"
                            placeholder="Search by name or code..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Brand filter */}
                <div className="w-37.5 space-y-1.5">
                    <Label htmlFor="brand">Brand</Label>
                    <Select value={brand} onValueChange={onBrandChange}>
                        <SelectTrigger id="brand">
                            <SelectValue placeholder="All brands" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All brands</SelectItem>
                            {brands.map((b) => (
                                <SelectItem key={b} value={b}>
                                    {b}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Color similarity picker */}
                <div className="w-45 space-y-1.5">
                    <Label htmlFor="color-picker">Find similar colors</Label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Pipette className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="color-picker"
                                type="text"
                                placeholder="#FF5733"
                                value={similarTo}
                                onChange={(e) => onSimilarToChange(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <input
                            type="color"
                            value={similarTo || "#000000"}
                            onChange={(e) => onSimilarToChange(e.target.value)}
                            className="h-9 w-9 cursor-pointer rounded-md border p-0.5"
                            title="Pick a color"
                        />
                    </div>
                </div>
            </div>

            {/* Results count and clear */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    {resultCount.toLocaleString()} thread{resultCount !== 1 ? "s" : ""} found
                </span>
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-7 gap-1 px-2">
                        <X className="h-3 w-3" />
                        Clear filters
                    </Button>
                )}
            </div>
        </div>
    );
}
