export function formatDate(dateString: string, lang: string = 'en'): string {
  if (!dateString || typeof dateString !== 'string') return '';
  
  // Handle relative date strings from YouTube (e.g. "3 days ago", "2 weeks ago", "1 month ago")
  // These are already human-readable, return as-is
  const relativePatterns = /^(?:\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago|yesterday|today|just now)/i;
  if (relativePatterns.test(dateString.trim())) {
    return dateString.trim();
  }
  
  const date = new Date(dateString);
  
  // Validate the parsed date — check for Invalid Date
  if (isNaN(date.getTime())) {
    // If unparseable but non-empty, return the raw string (better than showing "Invalid Date")
    return dateString.trim();
  }
  
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Returns true if the date string is parseable by Date constructor OR is a meaningful relative/human-readable string */
export function isValidDateString(dateString: string | null | undefined): boolean {
  if (!dateString || typeof dateString !== 'string' || !dateString.trim()) return false;
  
  const trimmed = dateString.trim();
  
  // Accept relative date strings from YouTube (e.g. "3 days ago", "2 weeks ago")
  const relativePatterns = /^(?:\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago|yesterday|today|just now)/i;
  if (relativePatterns.test(trimmed)) return true;
  
  // Check if it's a valid parseable date
  const date = new Date(trimmed);
  return !isNaN(date.getTime());
}

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}
