import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { deleteByPrefix, getMergePath } from "@/lib/server/blob-storage";

interface CleanupRequest {
    jobId: string;
}

interface CleanupResponse {
    deleted: number;
    jobId: string;
}

/**
 * DELETE /api/merge/cleanup
 *
 * Cleanup blob storage for a merge job.
 * Requires authentication - only authenticated users can cleanup.
 * Anonymous users cannot cleanup (blobs will expire via TTL).
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<CleanupResponse | { error: string }>> {
    try {
        // Require authentication
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json(
                { error: "Authentication required. Please sign in to cleanup resources." },
                { status: 401 }
            );
        }

        const body = (await request.json()) as CleanupRequest;

        if (!body.jobId) {
            return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
        }

        // Validate jobId format (basic sanitization)
        if (!/^[a-zA-Z0-9_-]+$/.test(body.jobId)) {
            return NextResponse.json({ error: "Invalid jobId format" }, { status: 400 });
        }

        // Delete all blobs for this job
        const prefix = getMergePath(body.jobId, "");
        const deletedCount = await deleteByPrefix(prefix);

        return NextResponse.json({
            deleted: deletedCount,
            jobId: body.jobId,
        });
    } catch (error) {
        console.error("Cleanup error:", error);
        const message = error instanceof Error ? error.message : "Failed to cleanup";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
