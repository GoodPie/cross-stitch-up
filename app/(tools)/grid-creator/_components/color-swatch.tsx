"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ColorSwatchProps {
    readonly color: string;
    readonly label: string;
    readonly sublabel?: string;
    readonly hexCode?: string;
    readonly isSelected?: boolean;
    readonly size?: "sm" | "md";
    readonly children?: React.ReactNode;
    readonly onClick: () => void;
}

export function ColorSwatch({
    color,
    label,
    sublabel,
    hexCode,
    isSelected = false,
    size = "sm",
    children,
    onClick,
}: ColorSwatchProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onClick}
                    className={cn(
                        "rounded-md border shadow-sm transition-all hover:scale-110 focus:ring-2 focus:ring-offset-1 focus:outline-none",
                        isSelected && "ring-primary ring-2 ring-offset-1",
                        size === "sm" && "h-7 w-7",
                        size === "md" &&
                            "relative flex aspect-square items-center justify-center text-[10px] font-medium"
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${label}`}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent side={size === "sm" ? "bottom" : "left"} className={size === "md" ? "max-w-48" : undefined}>
                <p className="font-medium">{label}</p>
                {sublabel && <p className="text-muted-foreground text-xs">{sublabel}</p>}
                {hexCode && <p className="text-muted-foreground font-mono text-xs">{hexCode}</p>}
            </TooltipContent>
        </Tooltip>
    );
}
