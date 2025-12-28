import type { Metadata } from "next";
import { GridCreatorClient } from "./_components/grid-creator-client";
import { fetchThreads } from "@/lib/tools/threads/fetch-threads";

export const metadata: Metadata = {
    title: "Grid Creator | Cross Stitch-up",
    description: "Create a blank cross-stitch grid for designing patterns",
};

// Cache for 1 hour (reuse threads data)
export const revalidate = 3600;

export default async function GridCreatorPage() {
    const { threads, brands } = await fetchThreads();

    return (
        <main className="w-full px-4 py-8 md:px-6 lg:px-8">
            <GridCreatorClient threads={threads} brands={brands} />
        </main>
    );
}
