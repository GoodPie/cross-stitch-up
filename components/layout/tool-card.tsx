import Link from "next/link";
import { ArrowRight, Layers, Scissors, Palette, Grid3X3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ToolMetadata } from "@/lib/shared/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Layers,
    Scissors,
    Palette,
    Grid3X3,
};

interface ToolCardProps {
    tool: ToolMetadata;
}

export function ToolCard({ tool }: ToolCardProps) {
    const Icon = iconMap[tool.icon] || Layers;
    const isComingSoon = tool.status === "coming-soon";

    const content = (
        <Card
            className={`group relative p-6 transition-all duration-200 ${
                isComingSoon
                    ? "cursor-not-allowed opacity-60"
                    : "hover:border-primary/50 cursor-pointer hover:shadow-lg"
            }`}
        >
            <div className="flex items-start gap-4">
                <div className="bg-accent text-accent-foreground flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl">
                    <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-foreground font-serif font-semibold">{tool.name}</h3>
                        {tool.status === "beta" && (
                            <Badge variant="secondary" className="text-xs">
                                Beta
                            </Badge>
                        )}
                        {isComingSoon && (
                            <Badge variant="outline" className="text-xs">
                                Coming Soon
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm">{tool.description}</p>
                </div>
                {!isComingSoon && (
                    <ArrowRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-all group-hover:translate-x-1" />
                )}
            </div>
        </Card>
    );

    if (isComingSoon) {
        return content;
    }

    return <Link href={tool.href}>{content}</Link>;
}
