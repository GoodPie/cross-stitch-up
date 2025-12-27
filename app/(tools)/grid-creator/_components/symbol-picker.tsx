"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Type, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    ALL_SYMBOLS,
    LETTER_SYMBOLS,
    NUMBER_SYMBOLS,
    PUNCTUATION_SYMBOLS,
    STITCH_SYMBOLS,
    type SymbolDefinition,
    type SymbolCategory,
} from "@/lib/tools/grid-creator/symbols";
import { getContrastColor } from "@/lib/tools/threads/color-utils";
import { cn } from "@/lib/utils";

interface SymbolPickerProps {
    readonly selectedSymbol: string | null;
    readonly onSymbolSelect: (symbol: SymbolDefinition) => void;
    readonly backgroundColor?: string;
    readonly disabled?: boolean;
}

const CATEGORY_TABS: { value: SymbolCategory | "all"; label: string; symbols: SymbolDefinition[] }[] = [
    { value: "all", label: "All", symbols: ALL_SYMBOLS },
    { value: "stitch", label: "Stitch", symbols: STITCH_SYMBOLS },
    { value: "letter", label: "Letters", symbols: LETTER_SYMBOLS },
    { value: "number", label: "Numbers", symbols: NUMBER_SYMBOLS },
    { value: "punctuation", label: "Other", symbols: PUNCTUATION_SYMBOLS },
];

export function SymbolPicker({ selectedSymbol, onSymbolSelect, backgroundColor, disabled }: SymbolPickerProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("stitch");

    const handleSymbolClick = useCallback(
        (symbol: SymbolDefinition) => {
            onSymbolSelect(symbol);
            setOpen(false);
        },
        [onSymbolSelect]
    );

    // Find the current symbol definition
    const currentSymbol = useMemo(() => {
        if (!selectedSymbol) return null;
        return ALL_SYMBOLS.find((s) => s.character === selectedSymbol);
    }, [selectedSymbol]);

    // Determine preview colors
    const previewBg = backgroundColor || "#f5f5f5";
    const previewText = backgroundColor ? getContrastColor(backgroundColor) : "#333333";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className={cn("h-8 w-20 gap-1.5", !selectedSymbol && "text-muted-foreground")}
                >
                    {selectedSymbol ? (
                        <>
                            <span
                                className="flex h-5 w-5 items-center justify-center rounded text-sm font-bold"
                                style={{ backgroundColor: previewBg, color: previewText }}
                            >
                                {selectedSymbol}
                            </span>
                            <span className="flex-1 min-w-0 truncate text-xs text-left">
                                {currentSymbol?.name || "Symbol"}
                            </span>
                        </>
                    ) : (
                        <>
                            <Type className="h-4 w-4" />
                            <span className="text-xs">None</span>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="border-b p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Type className="h-4 w-4" />
                            <h4 className="text-sm font-medium">Select Symbol</h4>
                        </div>
                        {selectedSymbol && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs">Current:</span>
                                <span
                                    className="flex h-6 w-6 items-center justify-center rounded border text-sm font-bold"
                                    style={{ backgroundColor: previewBg, color: previewText }}
                                >
                                    {selectedSymbol}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b px-3 pt-2">
                        <TabsList className="h-8 w-full">
                            {CATEGORY_TABS.map((tab) => (
                                <TabsTrigger key={tab.value} value={tab.value} className="flex-1 text-xs">
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {CATEGORY_TABS.map((tab) => (
                        <TabsContent key={tab.value} value={tab.value} className="mt-0">
                            <ScrollArea className="h-64">
                                <div className="grid grid-cols-8 gap-1 p-2">
                                    <TooltipProvider delayDuration={200}>
                                        {tab.symbols.map((symbol) => {
                                            const isSelected = selectedSymbol === symbol.character;

                                            return (
                                                <Tooltip key={symbol.id}>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSymbolClick(symbol)}
                                                            className={cn(
                                                                "hover:bg-accent relative flex aspect-square items-center justify-center rounded border text-lg font-bold transition-all hover:scale-110 focus:ring-2 focus:ring-offset-1 focus:outline-none",
                                                                isSelected &&
                                                                    "ring-primary bg-primary/10 ring-2 ring-offset-1"
                                                            )}
                                                            style={
                                                                backgroundColor
                                                                    ? {
                                                                          backgroundColor: previewBg,
                                                                          color: previewText,
                                                                      }
                                                                    : undefined
                                                            }
                                                            aria-label={`Select ${symbol.name}`}
                                                        >
                                                            {symbol.character}
                                                            {isSelected && (
                                                                <Check className="bg-primary text-primary-foreground absolute -top-1 -right-1 h-3 w-3 rounded-full" />
                                                            )}
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="text-xs">
                                                        <p className="font-medium">{symbol.name}</p>
                                                        <p className="text-muted-foreground capitalize">
                                                            {symbol.category}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </TooltipProvider>
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    ))}
                </Tabs>

                <div className="text-muted-foreground border-t p-2 text-center text-xs">
                    {ALL_SYMBOLS.length} symbols available
                </div>
            </PopoverContent>
        </Popover>
    );
}
