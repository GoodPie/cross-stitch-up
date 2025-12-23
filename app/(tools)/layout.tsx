import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {ReactNode} from "react";

export default function ToolsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-background via-background to-muted/30">
      <Header showBackLink />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
