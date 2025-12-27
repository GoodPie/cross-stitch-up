"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ColorSwatch } from "./color-swatch";
import type { SelectedColor } from "@/lib/tools/grid-creator";
import type { ThreadColour } from "@/lib/tools/threads/types";
import { filterBySearch, filterByBrand, getContrastColor } from "@/lib/tools/threads/color-utils";
import { cn } from "@/lib/utils";

interface ThreadBrowserProps {
    readonly threads: ThreadColour[];
    readonly brands: string[];
    readonly selectedColor: SelectedColor | null;
    readonly onColorSelect: (color: SelectedColor) => void;
}

const MAX_VISIBLE_THREADS = 50;

export function ThreadBrowser({ threads, brands, selectedColor, onColorSelect }: ThreadBrowserProps) {
    const [search, setSearch] = useState("");
    const [brand, setBrand] = useState("all");
    const [isOpen, setIsOpen] = useState(false);

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
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex min-h-0 flex-1 flex-col">
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className="hover:bg-muted flex w-full items-center justify-between border-b p-3 transition-colors"
                >
                    <Label className="text-muted-foreground cursor-pointer text-xs uppercase">Browse Threads</Label>
                    <ChevronDown
                        className={cn("text-muted-foreground h-4 w-4 transition-transform", isOpen && "rotate-180")}
                    />
                </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="flex min-h-0 flex-1 flex-col data-[state=closed]:hidden">
                {/* Filters */}
                <div className="space-y-2 border-b p-3">
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
                                    <ColorSwatch
                                        key={thread.id}
                                        color={thread.hex}
                                        label={thread.name}
                                        sublabel={`${thread.brand} ${thread.colour_code}`}
                                        hexCode={thread.hex}
                                        isSelected={isSelected}
                                        size="md"
                                        onClick={() => handleThreadSelect(thread)}
                                    >
                                        <span style={{ color: textColor }}>{thread.colour_code}</span>
                                    </ColorSwatch>
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
    );
}
