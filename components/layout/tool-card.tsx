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
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-lg hover:border-primary/50 cursor-pointer"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-accent-foreground">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-serif font-semibold text-foreground">
              {tool.name}
            </h3>
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
          <p className="text-sm text-muted-foreground">{tool.description}</p>
        </div>
        {!isComingSoon && (
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        )}
      </div>
    </Card>
  );

  if (isComingSoon) {
    return content;
  }

  return <Link href={tool.href}>{content}</Link>;
}
