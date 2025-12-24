import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ReactNode } from "react";

export default function ToolsLayout({ children }: { readonly children: ReactNode }) {
    return (
        <div className="from-background via-background to-muted/30 flex min-h-screen flex-col bg-linear-to-br">
            <Header showBackLink />
            <main className="container mx-auto max-w-4xl flex-1 px-4 py-8">{children}</main>
            <Footer />
        </div>
    );
}
