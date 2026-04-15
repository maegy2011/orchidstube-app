import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, count as drizzleCount } from "drizzle-orm";
import { db } from "@/lib/db";
import { playlists, playlistItems } from "@/lib/db/schema";
import { authenticateRequest } from "@/lib/auth/session";

// GET: Return all playlists for authenticated user with videoCount
export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const userPlaylists = await db
      .select({
        id: playlists.id,
        userId: playlists.userId,
        name: playlists.name,
        description: playlists.description,
        thumbnail: playlists.thumbnail,
        createdAt: playlists.createdAt,
        updatedAt: playlists.updatedAt,
      })
      .from(playlists)
      .where(eq(playlists.userId, userId))
      .orderBy(desc(playlists.createdAt));

    // Get video counts for all playlists
    const playlistIds = userPlaylists.map((p) => p.id);

    let videoCounts: Record<string, number> = {};
    if (playlistIds.length > 0) {
      const counts = await db
        .select({
          playlistId: playlistItems.playlistId,
          count: drizzleCount(),
        })
        .from(playlistItems)
        .where(eq(playlistItems.userId, userId))
        .groupBy(playlistItems.playlistId);

      videoCounts = Object.fromEntries(
        counts.map((c) => [c.playlistId, c.count]),
      );
    }

    const result = userPlaylists.map((p) => ({
      ...p,
      videoCount: videoCounts[p.id] || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
  }
}

// POST: Create a new playlist
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(playlists).values({
      id,
      userId,
      name: name.trim(),
      description: description?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        id,
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        thumbnail: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        videoCount: 0,
        created: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating playlist:", error);
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
  }
}

// PUT: Update a playlist
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();
    const { id, name, description, thumbnail } = body;

    if (!id) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 });
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Playlist name cannot be empty" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (thumbnail !== undefined) {
      updateData.thumbnail = thumbnail?.trim() || null;
    }

    await db
      .update(playlists)
      .set(updateData)
      .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));

    // Return updated playlist
    const [updated] = await db
      .select()
      .from(playlists)
      .where(eq(playlists.id, id))
      .limit(1);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating playlist:", error);
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 });
  }
}

// DELETE: Delete a playlist
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 });
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Delete playlist (cascade will delete items)
    await db
      .delete(playlists)
      .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 });
  }
}
