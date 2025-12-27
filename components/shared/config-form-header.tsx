interface ConfigFormHeaderProps {
    readonly icon: React.ReactNode;
    readonly title: string;
    readonly description: string;
}

/**
 * Header section with icon, title, and description for config forms.
 */
export function ConfigFormHeader({ icon, title, description }: ConfigFormHeaderProps) {
    return (
        <div className="space-y-4">
            <div className="bg-accent text-accent-foreground inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                {icon}
            </div>
            <div className="space-y-2">
                <h2 className="text-foreground font-serif text-xl font-semibold md:text-2xl">{title}</h2>
                <p className="text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
