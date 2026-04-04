import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { authenticateRequest } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const key = request.nextUrl.searchParams.get("key");
    const whereClause = key
      ? and(eq(userSettings.userId, userId), eq(userSettings.key, key))
      : eq(userSettings.userId, userId);

    const items = await db.select().from(userSettings).where(whereClause);

    const result: Record<string, string> = {};
    for (const item of items) {
      result[item.key] = item.value;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Settings object is required" }, { status: 400 });
    }

    const entries = Object.entries(settings).filter(
      ([k, v]) => typeof k === "string" && k.length > 0 && v !== undefined
    );

    if (entries.length === 0) {
      return NextResponse.json({ success: true });
    }

    const now = new Date().toISOString();

    // Use a transaction to ensure all-or-nothing semantics
    await db.transaction(async (tx) => {
      for (const [key, value] of entries) {
        // Use UPSERT (INSERT ... ON CONFLICT DO UPDATE) for atomic per-key write
        await tx.insert(userSettings).values({
          userId,
          key,
          value: String(value),
          updatedAt: now,
        }).onConflictDoUpdate({
          target: [userSettings.userId, userSettings.key],
          set: { value: String(value), updatedAt: now },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
