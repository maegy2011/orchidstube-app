import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { playlists, playlistItems } from "@/lib/db/schema";
import { authenticateRequest } from "@/lib/auth/session";

// GET: Return a single playlist by ID with all its items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const { id } = await params;

    // Verify ownership and get playlist
    const [playlist] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
      .limit(1);

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Get all items for this playlist ordered by addedAt
    const items = await db
      .select()
      .from(playlistItems)
      .where(and(eq(playlistItems.playlistId, id), eq(playlistItems.userId, userId)))
      .orderBy(asc(playlistItems.addedAt));

    return NextResponse.json({ playlist, items });
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 });
  }
}
