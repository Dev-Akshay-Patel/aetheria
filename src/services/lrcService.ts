import { LyricLine } from '../types';

/**
 * Parses raw LRC string content into sorted LyricLine array
 */
export function parseLrc(rawContent: string): LyricLine[] {
  if (!rawContent || !rawContent.trim()) return [];

  const lines = rawContent.split(/\r?\n/);
  const parsedLyrics: LyricLine[] = [];
  // Regex matching [mm:ss.xx] or [mm:ss:xx] or [mm:ss]
  const timeRegex = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check if line contains timestamp(s)
    const matches = Array.from(trimmed.matchAll(timeRegex));
    if (matches.length > 0) {
      // Remove all timestamp tags to extract the text
      const text = trimmed.replace(timeRegex, '').trim();

      // Handle lines that have multiple timestamps like [00:12.00][00:24.00] Repeat Lyric
      matches.forEach((match, matchIndex) => {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const msStr = match[3] || '0';
        // Handle 2 digit (hundredths) or 3 digit (milliseconds)
        const milliseconds = msStr.length === 2 ? parseInt(msStr, 10) * 10 : parseInt(msStr.padEnd(3, '0').slice(0, 3), 10);
        const totalSeconds = minutes * 60 + seconds + milliseconds / 1000;

        // Keep blank lines only if they represent instrumental breaks or spacing
        parsedLyrics.push({
          id: `lrc-${lineIndex}-${matchIndex}-${totalSeconds.toFixed(2)}`,
          time: totalSeconds,
          text: text || '♪',
        });
      });
    }
  });

  // Sort chronologically
  parsedLyrics.sort((a, b) => a.time - b.time);

  // Filter consecutive duplicate instrumental markers if any
  const cleaned: LyricLine[] = [];
  parsedLyrics.forEach((item, i) => {
    if (item.text === '♪' && cleaned[cleaned.length - 1]?.text === '♪') {
      return;
    }
    cleaned.push(item);
  });

  return cleaned;
}

/**
 * Parses plain un-synced text lyrics into evenly spaced LyricLine placeholders
 */
export function parsePlainLyrics(plainText: string, totalDuration: number = 180): LyricLine[] {
  if (!plainText || !plainText.trim()) return [];
  const lines = plainText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const timePerLine = totalDuration / Math.max(lines.length, 1);
  return lines.map((text, i) => ({
    id: `plain-${i}`,
    time: i * timePerLine,
    text,
  }));
}

/**
 * Finds current active lyric index based on current playback time + offset
 */
export function getActiveLyricIndex(lyrics: LyricLine[], currentTime: number, offsetSeconds: number = 0): number {
  if (!lyrics || lyrics.length === 0) return -1;
  const time = Math.max(0, currentTime + offsetSeconds);

  // If before first lyric
  if (time < lyrics[0].time) return 0;

  // Binary search or linear scan
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (time >= lyrics[i].time) {
      return i;
    }
  }

  return 0;
}

/**
 * Fetches lyrics from LRCLIB API
 */
export async function fetchLyricsFromLRCLIB(params: {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
}): Promise<{ syncedLyrics: string | null; plainLyrics: string | null; trackName?: string } | null> {
  const { title, artist, album, duration } = params;
  if (!title && !artist) return null;

  try {
    // 1. Try exact get endpoint first
    const getQuery = new URLSearchParams();
    if (title) getQuery.append('track_name', title);
    if (artist) getQuery.append('artist_name', artist);
    if (album) getQuery.append('album_name', album);
    if (duration && duration > 0) getQuery.append('duration', Math.round(duration).toString());

    const getRes = await fetch(`https://lrclib.net/api/get?${getQuery.toString()}`);
    if (getRes.ok) {
      const data = await getRes.json();
      if (data.syncedLyrics || data.plainLyrics) {
        return {
          syncedLyrics: data.syncedLyrics || null,
          plainLyrics: data.plainLyrics || null,
          trackName: data.trackName,
        };
      }
    }

    // 2. Fallback to fuzzy search query
    const searchRes = await fetch(
      `https://lrclib.net/api/search?q=${encodeURIComponent(`${title} ${artist}`.trim())}`
    );
    if (searchRes.ok) {
      const results = await searchRes.json();
      if (Array.isArray(results) && results.length > 0) {
        // Find best match with syncedLyrics
        const syncedItem = results.find(r => r.syncedLyrics) || results[0];
        return {
          syncedLyrics: syncedItem.syncedLyrics || null,
          plainLyrics: syncedItem.plainLyrics || null,
          trackName: syncedItem.trackName,
        };
      }
    }
  } catch (err) {
    console.warn('LRCLIB fetch error:', err);
  }

  return null;
}
