import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToolCard } from "@/components/layout/tool-card";
import { tools } from "@/lib/tools/registry";

export default function Home() {
    return (
        <div className="from-background via-background to-muted/30 flex min-h-screen flex-col bg-linear-to-br">
            <Header />
            <main className="container mx-auto max-w-4xl flex-1 px-4 py-12 md:py-16">
                {/* Hero section */}
                <div className="mb-12 space-y-4 text-center">
                    <h1 className="text-foreground font-serif text-3xl font-bold md:text-4xl">Cross Stitch Tools</h1>
                    <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                        A collection of free tools to help you work with cross stitch patterns.
                    </p>
                </div>

                {/* Tools grid */}
                <div className="space-y-4">
                    <h2 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                        Available Tools
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {tools.map((tool) => (
                            <ToolCard key={tool.id} tool={tool} />
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
