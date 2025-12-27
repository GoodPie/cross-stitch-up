import { Grid3X3 } from "lucide-react";

interface GridCreatorHeaderProps {
    readonly title?: string;
    readonly description?: string;
}

export function GridCreatorHeader({
    title = "Grid Creator",
    description = "Create a blank cross-stitch grid for designing patterns",
}: GridCreatorHeaderProps) {
    return (
        <div className="mb-4 text-center">
            <div className="bg-accent text-accent-foreground mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                <Grid3X3 className="h-8 w-8" />
            </div>
            <h1 className="text-foreground font-serif text-3xl font-bold md:text-4xl">{title}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
        </div>
    );
}
