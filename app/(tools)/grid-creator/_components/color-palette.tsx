"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Search, X, Palette, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SymbolPicker } from "./symbol-picker";
import type { SelectedColor, SymbolDefinition } from "@/lib/tools/grid-creator";
import type { ThreadColour } from "@/lib/tools/threads/types";
import { filterBySearch, filterByBrand, getContrastColor } from "@/lib/tools/threads/color-utils";
import { cn } from "@/lib/utils";

interface ColorPaletteProps {
    readonly threads: ThreadColour[];
    readonly brands: string[];
    readonly selectedColor: SelectedColor | null;
    readonly recentColors: SelectedColor[];
    readonly onColorSelect: (color: SelectedColor) => void;
    readonly onSymbolSelect: (symbol: SymbolDefinition) => void;
}

const MAX_VISIBLE_THREADS = 50;

export function ColorPalette({
    threads,
    brands,
    selectedColor,
    recentColors,
    onColorSelect,
    onSymbolSelect,
}: ColorPaletteProps) {
    const [search, setSearch] = useState("");
    const [brand, setBrand] = useState("all");
    const [isThreadsOpen, setIsThreadsOpen] = useState(false);

    // Filter threads based on search and brand
    const filteredThreads = useMemo(() => {
        let result = threads;
        result = filterByBrand(result, brand);
        result = filterBySearch(result, search);
        return result.slice(0, MAX_VISIBLE_THREADS);
    }, [threads, search, brand]);

    const hasFilters = search !== "" || brand !== "all";

    const handleClearFilters = useCallback(() => {
        setSearch("");
        setBrand("all");
    }, []);

    const handleThreadSelect = useCallback(
        (thread: ThreadColour) => {
            onColorSelect({
                hex: thread.hex,
                threadCode: `${thread.brand} ${thread.colour_code}`,
                name: thread.name,
                brand: thread.brand,
            });
        },
        [onColorSelect]
    );

    return (
        <div className="bg-background flex h-full w-64 flex-col border-l">
            {/* Header */}
            <div className="border-b p-3">
                <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <h3 className="font-medium">Color Palette</h3>
                </div>
            </div>

            {/* Selected Color */}
            <div className="border-b p-3">
                <Label className="text-muted-foreground mb-2 block text-xs uppercase">Selected Color</Label>
                {selectedColor ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div
                                className="h-10 w-10 rounded-md border shadow-sm"
                                style={{ backgroundColor: selectedColor.hex }}
                            />
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium">{selectedColor.name}</p>
                                <p className="text-muted-foreground truncate text-xs">{selectedColor.threadCode}</p>
                            </div>
                        </div>

                        {/* Symbol Assignment */}
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">Symbol:</span>
                            <SymbolPicker
                                selectedSymbol={selectedColor.symbol || null}
                                onSymbolSelect={onSymbolSelect}
                                backgroundColor={selectedColor.hex}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-muted-foreground flex h-10 items-center text-sm">No color selected</div>
                )}
            </div>

            {/* Recent Colors */}
            {recentColors.length > 0 && (
                <div className="border-b p-3">
                    <Label className="text-muted-foreground mb-2 block text-xs uppercase">Recent Colors</Label>
                    <div className="flex flex-wrap gap-1">
                        <TooltipProvider delayDuration={200}>
                            {recentColors.map((color) => {
                                const isSelected = selectedColor?.hex === color.hex;
                                return (
                                    <Tooltip key={color.threadCode}>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() => onColorSelect(color)}
                                                className={cn(
                                                    "h-7 w-7 rounded-md border shadow-sm transition-all hover:scale-110 focus:ring-2 focus:ring-offset-1 focus:outline-none",
                                                    isSelected && "ring-primary ring-2 ring-offset-1"
                                                )}
                                                style={{ backgroundColor: color.hex }}
                                                aria-label={`Select ${color.name}`}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-xs">
                                            <p className="font-medium">{color.name}</p>
                                            <p className="text-muted-foreground">{color.threadCode}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </TooltipProvider>
                    </div>
                </div>
            )}

            {/* Thread Browser */}
            <Collapsible open={isThreadsOpen} onOpenChange={setIsThreadsOpen} className="flex min-h-0 flex-1 flex-col">
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="hover:bg-muted flex w-full items-center justify-between border-b p-3 transition-colors"
                    >
                        <Label className="text-muted-foreground cursor-pointer text-xs uppercase">Browse Threads</Label>
                        <ChevronDown
                            className={cn(
                                "text-muted-foreground h-4 w-4 transition-transform",
                                isThreadsOpen && "rotate-180"
                            )}
                        />
                    </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="flex min-h-0 flex-1 flex-col data-[state=closed]:hidden">
                    {/* Filters */}
                    <div className="space-y-2 border-b p-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                            <Input
                                type="text"
                                placeholder="Search threads..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8 pl-8 text-sm"
                            />
                        </div>

                        {/* Brand filter */}
                        <Select value={brand} onValueChange={setBrand}>
                            <SelectTrigger className="h-8 text-sm">
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

                        {/* Results and clear */}
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                                {filteredThreads.length}
                                {filteredThreads.length >= MAX_VISIBLE_THREADS && "+"} threads
                            </span>
                            {hasFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearFilters}
                                    className="h-6 gap-1 px-2 text-xs"
                                >
                                    <X className="h-3 w-3" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Thread Grid */}
                    <ScrollArea className="min-h-0 flex-1">
                        <div className="grid grid-cols-6 gap-1 p-2">
                            <TooltipProvider delayDuration={200}>
                                {filteredThreads.map((thread) => {
                                    const isSelected = selectedColor?.hex === thread.hex;
                                    const textColor = getContrastColor(thread.hex);

                                    return (
                                        <Tooltip key={thread.id}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={() => handleThreadSelect(thread)}
                                                    className={cn(
                                                        "relative flex aspect-square items-center justify-center rounded border text-[10px] font-medium shadow-sm transition-all hover:scale-110 focus:ring-2 focus:ring-offset-1 focus:outline-none",
                                                        isSelected && "ring-primary ring-2 ring-offset-1"
                                                    )}
                                                    style={{
                                                        backgroundColor: thread.hex,
                                                        color: textColor,
                                                    }}
                                                    aria-label={`Select ${thread.name} (${thread.brand} ${thread.colour_code})`}
                                                >
                                                    {thread.colour_code}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="max-w-48">
                                                <p className="font-medium">{thread.name}</p>
                                                <p className="text-muted-foreground text-xs">
                                                    {thread.brand} {thread.colour_code}
                                                </p>
                                                <p className="text-muted-foreground font-mono text-xs">{thread.hex}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </TooltipProvider>
                        </div>

                        {filteredThreads.length === 0 && (
                            <div className="text-muted-foreground p-4 text-center text-sm">
                                No threads found. Try adjusting your search.
                            </div>
                        )}
                    </ScrollArea>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
