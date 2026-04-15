import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchHistory, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticateRequest } from "@/lib/auth/session";

async function ensureUser(userId: string) {
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      await db.insert(users).values({ id: userId, email: `${userId}@orchids.local` });
    }
  } catch (error) {
    // Unique constraint violation — user already exists from a concurrent request
    const isDuplicate = error instanceof Error && (
      error.message.includes("UNIQUE constraint failed") ||
      error.message.includes("duplicate key")
    );
    if (!isDuplicate) {
      console.error("Error ensuring user:", error);
      throw error;
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const data = await db.query.watchHistory.findMany({
      where: eq(watchHistory.userId, userId),
      orderBy: (watchHistory, { desc }) => [desc(watchHistory.watchedAt)],
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await req.json();
    const { videoId, videoTitle, videoThumbnail } = body;
    
    if (!videoId || !videoTitle) {
      return NextResponse.json({ error: "Video ID and title are required" }, { status: 400 });
    }

    await ensureUser(userId);

    try {
      await db.insert(watchHistory).values({
        userId,
        videoId,
        videoTitle,
        videoThumbnail,
        watchedAt: new Date(),
      });
      return NextResponse.json({ success: true, created: true });
    } catch (error: any) {
      // If duplicate (concurrent INSERT), update the watchedAt timestamp
      if (error?.message?.includes('UNIQUE constraint failed') || error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        await db.update(watchHistory)
          .set({ watchedAt: new Date() })
          .where(and(eq(watchHistory.userId, userId), eq(watchHistory.videoId, videoId)));
        return NextResponse.json({ success: true, updated: true });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error recording history:", error);
    return NextResponse.json(
      { error: "Failed to record history" },
      { status: 500 }
    );
  }
}
