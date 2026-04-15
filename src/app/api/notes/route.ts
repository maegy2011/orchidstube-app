import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { videoNotes } from "@/lib/db/schema";
import { authenticateRequest } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const videoId = request.nextUrl.searchParams.get("videoId");
    const whereClause = videoId
      ? and(eq(videoNotes.userId, userId), eq(videoNotes.videoId, videoId))
      : eq(videoNotes.userId, userId);

    const items = await db
      .select()
      .from(videoNotes)
      .where(whereClause)
      .orderBy(desc(videoNotes.createdAt));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();
    const { videoId, videoTitle, content, hashtags, startTime, endTime } = body;

    if (!videoId || !content) {
      return NextResponse.json({ error: "Video ID and content are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.insert(videoNotes).values({
      id,
      userId,
      videoId,
      videoTitle: videoTitle || "",
      content,
      hashtags: hashtags ? JSON.stringify(hashtags) : null,
      startTime: startTime ?? 0,
      endTime: endTime ?? 0,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id, userId, videoId, videoTitle, content, hashtags, startTime, endTime, createdAt: now, updatedAt: now }, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();
    const { id, content, hashtags, startTime, endTime } = body;

    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (content !== undefined) updates.content = content;
    if (hashtags !== undefined) updates.hashtags = hashtags ? JSON.stringify(hashtags) : null;
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;

    await db
      .update(videoNotes)
      .set(updates)
      .where(and(eq(videoNotes.id, id), eq(videoNotes.userId, userId)));

    const [updated] = await db
      .select()
      .from(videoNotes)
      .where(eq(videoNotes.id, id))
      .limit(1);

    if (!updated) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...updated,
      hashtags: updated.hashtags ? JSON.parse(updated.hashtags) : undefined,
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    await db
      .delete(videoNotes)
      .where(and(eq(videoNotes.id, id), eq(videoNotes.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
