interface TipsCardProps {
    readonly title: string;
    readonly tips: string[];
}

/**
 * Card displaying tips with bullet points.
 */
export function TipsCard({ title, tips }: TipsCardProps) {
    return (
        <div className="border-border/50 bg-accent/50 rounded-xl border p-4">
            <h3 className="text-foreground mb-2 flex items-center gap-2 font-medium">
                <span className="text-lg">&#128161;</span> {title}
            </h3>
            <ul className="text-muted-foreground space-y-1 text-sm">
                {tips.map((tip) => (
                    <li key={tip}>&#8226; {tip}</li>
                ))}
            </ul>
        </div>
    );
}
