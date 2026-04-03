import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { playlists, playlistItems } from "@/lib/db/schema";
import { authenticateRequest } from "@/lib/auth/session";

// POST: Add a video to a playlist
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();
    const { playlistId, videoId, title, thumbnail, channelName, duration } = body;

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 });
    }

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Video title is required" }, { status: 400 });
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

    try {
      const id = crypto.randomUUID();
      const now = new Date();

      await db.insert(playlistItems).values({
        id,
        playlistId,
        userId,
        videoId,
        title: title || "",
        thumbnail: thumbnail || null,
        channelName: channelName || null,
        duration: duration || null,
        addedAt: now,
      });

      return NextResponse.json(
        {
          id,
          playlistId,
          userId,
          videoId,
          title: title || "",
          thumbnail: thumbnail || null,
          channelName: channelName || null,
          duration: duration || null,
          addedAt: now.toISOString(),
          created: true,
        },
        { status: 201 },
      );
    } catch (error: any) {
      if (error?.message?.includes("UNIQUE constraint failed") || error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
        // Video already exists in this playlist
        const [existing] = await db
          .select()
          .from(playlistItems)
          .where(
            and(
              eq(playlistItems.playlistId, playlistId),
              eq(playlistItems.videoId, videoId),
            ),
          )
          .limit(1);

        return NextResponse.json({ success: true, alreadyExists: true, ...existing });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error adding video to playlist:", error);
    return NextResponse.json({ error: "Failed to add video to playlist" }, { status: 500 });
  }
}

// DELETE: Remove a video from a playlist
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();
    const { playlistId, videoId } = body;

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 });
    }

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    await db
      .delete(playlistItems)
      .where(
        and(
          eq(playlistItems.playlistId, playlistId),
          eq(playlistItems.videoId, videoId),
          eq(playlistItems.userId, userId),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing video from playlist:", error);
    return NextResponse.json({ error: "Failed to remove video from playlist" }, { status: 500 });
  }
}
