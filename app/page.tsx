import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToolCard } from "@/components/layout/tool-card";
import { tools } from "@/lib/tools/registry";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-background via-background to-muted/30">
      <Header />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Hero section */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            Cross Stitch Tools
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A collection of free tools to help you work with cross stitch
            patterns.
          </p>
        </div>

        {/* Tools grid */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
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
