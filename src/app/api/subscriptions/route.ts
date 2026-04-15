import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
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

    const data = await db.query.subscriptions.findMany({
      where: eq(subscriptions.userId, userId),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
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
    const { channelId, channelTitle, channelThumbnail } = body;
    
    if (!channelId || !channelTitle) {
      return NextResponse.json({ error: "Channel ID and title are required" }, { status: 400 });
    }

    await ensureUser(userId);

    const existing = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.userId, userId), eq(subscriptions.channelId, channelId)),
    });

    if (existing) {
      return NextResponse.json({ message: "Already subscribed" });
    }

    await db.insert(subscriptions).values({
      userId,
      channelId,
      channelTitle,
      channelThumbnail,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await req.json();
    const { channelId } = body;
    
    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
    }

    await db.delete(subscriptions).where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.channelId, channelId))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
