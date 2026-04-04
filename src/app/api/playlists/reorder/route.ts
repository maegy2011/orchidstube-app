import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { playlists, playlistItems } from "@/lib/db/schema";
import { authenticateRequest } from "@/lib/auth/session";

// PUT: Reorder playlist items
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();
    const { playlistId, itemIds } = body;

    if (!playlistId || !Array.isArray(itemIds)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify playlist ownership
    const [playlist] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
      .limit(1);

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Update order by setting addedAt timestamps based on position
    // Use base time + index * 1000ms to maintain order
    const baseTime = new Date();
    for (let i = 0; i < itemIds.length; i++) {
      await db
        .update(playlistItems)
        .set({ addedAt: new Date(baseTime.getTime() + i * 1000) })
        .where(
          and(
            eq(playlistItems.id, itemIds[i]),
            eq(playlistItems.playlistId, playlistId),
            eq(playlistItems.userId, userId),
          ),
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering playlist items:", error);
    return NextResponse.json({ error: "Failed to reorder items" }, { status: 500 });
  }
}
