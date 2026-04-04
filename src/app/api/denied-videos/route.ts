import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { deniedVideos } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const auth = await authenticateRequest();
  if (auth.error) return auth.error;

  const rows = await db.select({ videoId: deniedVideos.videoId })
    .from(deniedVideos)
    .where(eq(deniedVideos.userId, auth.user.id));

  return NextResponse.json(rows.map(r => r.videoId));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();
  if (auth.error) return auth.error;

  const { videoId } = await request.json();
  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 });
  }

  try {
    await db.insert(deniedVideos).values({
      userId: auth.user.id,
      videoId,
    });
  } catch {
    // Ignore duplicate (UNIQUE constraint)
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 });
  }

  await db.delete(deniedVideos).where(
    and(
      eq(deniedVideos.userId, auth.user.id),
      eq(deniedVideos.videoId, videoId)
    )
  );

  return NextResponse.json({ success: true });
}
