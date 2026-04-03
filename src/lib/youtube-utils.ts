// Format views to a readable string
export function formatViews(views: string | number): string {
  if (!views) return '0';
  let num: number;
  if (typeof views === 'number') {
    num = views;
  } else {
    // Strip any existing text like "views", "مشاهدة", commas, etc.
    const cleanStr = views.toString().replace(/[^0-9.]/g, '');
    num = parseFloat(cleanStr);
  }
  if (isNaN(num)) return '0';
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 10_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toLocaleString();
}

// Generate a default avatar — returns empty string so the UI can show a gradient initial fallback.
// Previously this returned a ui-avatars.com URL which is an external dependency that can fail.
export function getDefaultChannelAvatar(_channelName?: string): string {
  return '';
}
