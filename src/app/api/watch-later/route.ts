import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { watchLater } from "@/lib/db/schema";
import { authenticateRequest } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const items = await db
      .select()
      .from(watchLater)
      .where(eq(watchLater.userId, userId))
      .orderBy(watchLater.createdAt);

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching watch later:", error);
    return NextResponse.json({ error: "Failed to fetch watch later" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();
    const { videoId, title, thumbnail, channelName, duration } = body;

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    try {
      const id = crypto.randomUUID();
      await db.insert(watchLater).values({
        id,
        userId,
        videoId,
        title: title || "",
        thumbnail: thumbnail || "",
        channelName: channelName || "",
        duration: duration || "",
        createdAt: new Date(),
      });
      return NextResponse.json({ id, userId, videoId, title, thumbnail, channelName, duration, createdAt: new Date().toISOString(), created: true }, { status: 201 });
    } catch (error: any) {
      if (error?.message?.includes('UNIQUE constraint failed') || error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const [existing] = await db.select().from(watchLater)
          .where(and(eq(watchLater.userId, userId), eq(watchLater.videoId, videoId))).limit(1);
        return NextResponse.json({ success: true, alreadyExists: true, ...existing });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error adding to watch later:", error);
    return NextResponse.json({ error: "Failed to add to watch later" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    await db
      .delete(watchLater)
      .where(and(eq(watchLater.userId, userId), eq(watchLater.videoId, videoId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from watch later:", error);
    return NextResponse.json({ error: "Failed to remove from watch later" }, { status: 500 });
  }
}
