import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { favorites, watchLater, videoNotes, watchHistory, userSettings, deniedVideos, subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// DELETE /api/user-data/purge - Delete user data by scope
export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest();
  if (auth.error) return auth.error;

  const { userId } = auth.user;
  const body = await request.json().catch(() => ({}));

  // Parse what to purge - array of scope strings or "all"
  const scope: string[] = body.scope || ['all'];
  const isAll = scope.includes('all');

  try {
    const deleted: Record<string, number> = {};

    // Favorites
    if (isAll || scope.includes('favorites')) {
      const result = await db.delete(favorites).where(eq(favorites.userId, userId));
      deleted.favorites = result.changes;
    }

    // Watch Later
    if (isAll || scope.includes('watchLater')) {
      const result = await db.delete(watchLater).where(eq(watchLater.userId, userId));
      deleted.watchLater = result.changes;
    }

    // Notes
    if (isAll || scope.includes('notes')) {
      const result = await db.delete(videoNotes).where(eq(videoNotes.userId, userId));
      deleted.notes = result.changes;
    }

    // Watch History
    if (isAll || scope.includes('history')) {
      const result = await db.delete(watchHistory).where(eq(watchHistory.userId, userId));
      deleted.history = result.changes;
    }

    // Subscriptions
    if (isAll || scope.includes('subscriptions')) {
      const result = await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
      deleted.subscriptions = result.changes;
    }

    // Denied Videos
    if (isAll || scope.includes('deniedVideos')) {
      const result = await db.delete(deniedVideos).where(eq(deniedVideos.userId, userId));
      deleted.deniedVideos = result.changes;
    }

    // User Settings
    if (isAll || scope.includes('settings')) {
      const result = await db.delete(userSettings).where(eq(userSettings.userId, userId));
      deleted.settings = result.changes;
    }

    // Recent Searches (stored as userSettings key)
    if (isAll || scope.includes('recentSearches')) {
      const result = await db.delete(userSettings).where(
        and(eq(userSettings.userId, userId), eq(userSettings.key, 'recentSearches'))
      );
      deleted.recentSearches = result.changes;
    }

    // Parental PIN (stored as userSettings key)
    if (scope.includes('parentalPin')) {
      const result = await db.delete(userSettings).where(
        and(eq(userSettings.userId, userId), eq(userSettings.key, 'parentalPinHash'))
      );
      deleted.parentalPin = result.changes;
    }

    // Daily Usage Data (shorts count, watch time)
    if (scope.includes('dailyUsage')) {
      for (const key of ['wb-daily-shorts-temp', 'wb-daily-time']) {
        const result = await db.delete(userSettings).where(
          and(eq(userSettings.userId, userId), eq(userSettings.key, key))
        );
        deleted[key] = deleted[key] || 0;
        deleted[key] += result.changes;
      }
    }

    // Prayer Coordinates (stored as userSettings key)
    if (scope.includes('prayerData')) {
      for (const key of ['prayerCoordinates']) {
        const result = await db.delete(userSettings).where(
          and(eq(userSettings.userId, userId), eq(userSettings.key, key))
        );
        deleted.prayerData = (deleted.prayerData || 0) + result.changes;
      }
    }

    // Eye Protection Reminder
    if (scope.includes('eyeReminder')) {
      const result = await db.delete(userSettings).where(
        and(eq(userSettings.userId, userId), eq(userSettings.key, 'lastEyeModalShown'))
      );
      deleted.eyeReminder = result.changes;
    }

    // Language Detection Cache
    if (scope.includes('languageCache')) {
      for (const key of ['orchids-language-detected', 'orchids-language-manually-set']) {
        const result = await db.delete(userSettings).where(
          and(eq(userSettings.userId, userId), eq(userSettings.key, key))
        );
        deleted.languageCache = (deleted.languageCache || 0) + result.changes;
      }
    }

    // Always preserve auth (sessions, accounts) - never delete those

    return NextResponse.json({
      success: true,
      deleted,
    });
  } catch (error) {
    console.error('Purge error:', error);
    return NextResponse.json(
      { error: 'Failed to purge data' },
      { status: 500 }
    );
  }
}
