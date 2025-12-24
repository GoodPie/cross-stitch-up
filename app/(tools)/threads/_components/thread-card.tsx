"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ThreadColour } from "@/lib/tools/threads/types";
import { getContrastColor } from "@/lib/tools/threads/color-utils";
import { cn } from "@/lib/utils";

interface ThreadWithDistance extends ThreadColour {
    distance: number;
}

interface ThreadCardProps {
    readonly thread: ThreadWithDistance;
    readonly isSelected: boolean;
    readonly onSelect: () => void;
    readonly showDistance: boolean;
}

export function ThreadCard({ thread, isSelected, onSelect, showDistance }: ThreadCardProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const contrastColor = getContrastColor(thread.hex);

    const copyToClipboard = async (value: string, field: string) => {
        await navigator.clipboard.writeText(value);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 1500);
    };

    return (
        <div
            className={cn(
                "group relative cursor-pointer transition-all duration-200",
                isSelected && "col-span-2 row-span-2 sm:col-span-2 md:col-span-2"
            )}
        >
            <button
                type="button"
                onClick={onSelect}
                className={cn(
                    "relative flex h-full w-full flex-col overflow-hidden rounded-lg border shadow-sm transition-all",
                    "hover:ring-primary/50 hover:shadow-md hover:ring-2",
                    isSelected && "ring-primary ring-2"
                )}
                style={{ backgroundColor: thread.hex }}
            >
                {/* Color swatch with code */}
                <div
                    className={cn(
                        "flex flex-1 items-center justify-center p-2 text-center",
                        isSelected ? "min-h-[80px]" : "min-h-[60px]"
                    )}
                >
                    <span
                        className={cn(
                            "font-mono text-xs font-semibold",
                            contrastColor === "white" ? "text-white" : "text-black"
                        )}
                    >
                        {thread.colour_code}
                    </span>
                </div>

                {/* Distance badge when color similarity is active */}
                {showDistance && thread.distance > 0 && (
                    <div className="absolute top-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
                        {Math.round(thread.distance)}
                    </div>
                )}
            </button>

            {/* Expanded details */}
            {isSelected && (
                <div className="bg-card absolute top-full left-0 z-20 mt-1 w-64 rounded-lg border p-3 shadow-lg">
                    <div className="mb-2 flex items-start justify-between">
                        <div>
                            <h4 className="font-serif font-semibold">{thread.name}</h4>
                            <p className="text-muted-foreground text-xs">
                                {thread.brand} {thread.colour_code}
                            </p>
                        </div>
                        <div className="h-8 w-8 rounded border shadow-sm" style={{ backgroundColor: thread.hex }} />
                    </div>

                    <div className="space-y-2 text-sm">
                        {/* Hex */}
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">HEX</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 gap-1 px-2 font-mono text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(thread.hex, "hex");
                                }}
                            >
                                {thread.hex.toUpperCase()}
                                {copiedField === "hex" ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                            </Button>
                        </div>

                        {/* RGB */}
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">RGB</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 gap-1 px-2 font-mono text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(`${thread.r}, ${thread.g}, ${thread.b}`, "rgb");
                                }}
                            >
                                {thread.r}, {thread.g}, {thread.b}
                                {copiedField === "rgb" ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                            </Button>
                        </div>

                        {/* Code */}
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Code</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 gap-1 px-2 font-mono text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(thread.colour_code, "code");
                                }}
                            >
                                {thread.colour_code}
                                {copiedField === "code" ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
