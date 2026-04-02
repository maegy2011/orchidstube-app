import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { favorites, watchLater, videoNotes, watchHistory, deniedVideos, subscriptions, userSettings } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";

// GET /api/user-data/stats - Get user data counts by type
export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;

    const { userId } = auth.user;

    // Query all counts in parallel
    const [
      favoritesResult,
      watchLaterResult,
      notesResult,
      historyResult,
      deniedVideosResult,
      subscriptionsResult,
      settingsResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(favorites).where(eq(favorites.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(watchLater).where(eq(watchLater.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(videoNotes).where(eq(videoNotes.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(watchHistory).where(eq(watchHistory.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(deniedVideos).where(eq(deniedVideos.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(userSettings).where(eq(userSettings.userId, userId)),
    ]);

    // Count special settings keys
    const allSettings = await db.select({ key: userSettings.key }).from(userSettings).where(eq(userSettings.userId, userId));
    const settingsMap = new Map(allSettings.map(s => [s.key, true]));

    return NextResponse.json({
      favorites: favoritesResult[0]?.count || 0,
      watchLater: watchLaterResult[0]?.count || 0,
      notes: notesResult[0]?.count || 0,
      history: historyResult[0]?.count || 0,
      deniedVideos: deniedVideosResult[0]?.count || 0,
      subscriptions: subscriptionsResult[0]?.count || 0,
      settings: settingsResult[0]?.count || 0,
      special: {
        recentSearches: settingsMap.has('recentSearches') ? 1 : 0,
        parentalPin: settingsMap.has('parentalPinHash') ? 1 : 0,
        dailyUsage: (settingsMap.has('wb-daily-shorts-temp') ? 1 : 0) + (settingsMap.has('wb-daily-time') ? 1 : 0),
        prayerData: settingsMap.has('prayerCoordinates') ? 1 : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching data stats:", error);
    return NextResponse.json({ error: "Failed to fetch data stats" }, { status: 500 });
  }
}
