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

// Generate a default avatar URL based on channel name
export function getDefaultChannelAvatar(channelName: string): string {
  if (!channelName) return '';
  const initial = channelName.charAt(0).toUpperCase();
  const bgColors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const colorIndex = channelName.length % bgColors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(channelName)}&background=${bgColors[colorIndex]}&color=fff&size=100`;
}
