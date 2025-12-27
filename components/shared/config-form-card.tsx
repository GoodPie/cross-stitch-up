interface ConfigFormCardProps {
    readonly children: React.ReactNode;
}

/**
 * Decorative card wrapper with cross-stitch corner decorations.
 * Used for dimension configuration forms.
 */
export function ConfigFormCard({ children }: ConfigFormCardProps) {
    return (
        <div className="relative">
            <div className="border-muted-foreground/30 rounded-2xl border-2 p-8 text-center md:p-12">
                {/* Cross-stitch corner decorations */}
                <div className="border-secondary-foreground/20 absolute top-3 left-3 h-6 w-6 rounded-tl border-t-2 border-l-2" />
                <div className="border-secondary-foreground/20 absolute top-3 right-3 h-6 w-6 rounded-tr border-t-2 border-r-2" />
                <div className="border-secondary-foreground/20 absolute bottom-3 left-3 h-6 w-6 rounded-bl border-b-2 border-l-2" />
                <div className="border-secondary-foreground/20 absolute right-3 bottom-3 h-6 w-6 rounded-br border-r-2 border-b-2" />
                {children}
            </div>
        </div>
    );
}
