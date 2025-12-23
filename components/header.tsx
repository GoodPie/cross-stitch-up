import { Scissors } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
          <Scissors className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-serif font-bold text-foreground">
            Cross Stitch-up
          </h1>
          <p className="text-xs text-muted-foreground">
            Combine your pattern pages into one
          </p>
        </div>
      </div>
    </header>
  );
}
