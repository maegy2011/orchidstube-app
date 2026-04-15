import React from 'react';

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatViewsCount(views: string, t: (key: any) => string): string {
  if (!views) return '';
  const lower = views.toLowerCase();
  if (lower.includes('view') || lower.includes('مشاهدة') || lower.includes(t('views'))) return views;
  return `${views} ${t('views')}`;
}

export function formatLikesCount(likes: string, t: (key: any) => string): string {
  if (!likes || likes === '0') return t('no_likes') || '0';
  const lower = likes.toLowerCase();
  if (lower.includes('like') || lower.includes('إعجاب')) return likes;
  return `${likes} ${t('likes')}`;
}

/** Extract URLs from description text and make them clickable */
export function linkifyDescription(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);
  const result: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    if (i > 0) {
      const url = text.match(urlRegex)?.[(i - 1) / 2] || '';
      result.push(
        React.createElement(
          'a',
          {
            key: `link-${i}`,
            href: url,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'text-primary hover:underline inline-flex items-center gap-0.5 break-all',
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
          },
          url
        )
      );
    }
    if (part) result.push(part);
  });
  return result;
}

/** Extract hashtags from text */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g);
  return matches || [];
}

/** Extract timestamps (chapters) from description */
export function extractChapters(text: string): { time: string; title: string; seconds: number }[] {
  const lines = text.split('\n');
  const chapters: { time: string; title: string; seconds: number }[] = [];
  const tsRegex = /(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/;
  for (const line of lines) {
    const match = line.trim().match(tsRegex);
    if (match) {
      const parts = match[1].split(':').map(Number);
      const secs = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
      if (secs < 86400) {
        chapters.push({ time: match[1], title: match[2].trim(), seconds: secs });
      }
    }
  }
  return chapters;
}
