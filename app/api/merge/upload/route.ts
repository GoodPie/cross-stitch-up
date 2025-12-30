import { NextRequest, NextResponse } from "next/server";
import { renderPdfPagesWithSSE, type RenderResult } from "@/lib/server/pdf-renderer";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
        }

        // Check if SSE is requested
        const acceptSSE = request.headers.get("accept") === "text/event-stream";

        if (acceptSSE) {
            // Stream progress via Server-Sent Events
            const pdfBuffer = Buffer.from(await file.arrayBuffer());

            const stream = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();
                    const generator = renderPdfPagesWithSSE(pdfBuffer);

                    try {
                        let result: RenderResult | undefined;
                        for await (const event of generator) {
                            controller.enqueue(encoder.encode(event));
                            // Store the final result if it's returned
                            if (typeof event !== "string") {
                                result = event;
                            }
                        }
                        // Get the return value from the generator
                        const finalResult = await generator.return(result!);
                        if (finalResult.value) {
                            // Already sent via "complete" event
                        }
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : "Unknown error";
                        controller.enqueue(
                            encoder.encode(
                                `event: error\ndata: ${JSON.stringify({ message: errorMessage })}\n\n`
                            )
                        );
                    } finally {
                        controller.close();
                    }
                },
            });

            return new Response(stream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                },
            });
        }

        // Non-streaming response (simpler, waits for completion)
        const pdfBuffer = Buffer.from(await file.arrayBuffer());

        // Import non-SSE version for simple requests
        const { renderPdfPages } = await import("@/lib/server/pdf-renderer");
        const result = await renderPdfPages(pdfBuffer);

        return NextResponse.json({
            jobId: result.jobId,
            pages: result.pages,
            totalPages: result.totalPages,
        });
    } catch (error) {
        console.error("PDF upload error:", error);
        const message = error instanceof Error ? error.message : "Failed to process PDF";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
