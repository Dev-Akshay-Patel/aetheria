/**
 * Video Background Service
 * Handles curated high-speed direct video loops, custom YouTube / Direct video URLs,
 * and intelligent automatic video matching based on track mood, lyrics, and metadata.
 */
import { Track, AppSettings } from '../types';

export interface VideoPreset {
  id: string;
  name: string;
  url: string;
  type: 'youtube' | 'direct';
  desc: string;
  youtubeId?: string;
  badge?: string;
  tags?: string[];
}

export const CURATED_VIDEO_PRESETS: VideoPreset[] = [
  {
    id: 'rain-glass',
    name: 'Midnight Rain Window',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-heavy-rain-falling-on-a-glass-surface-41487-large.mp4',
    type: 'direct',
    desc: 'High-speed 60fps raindrops flowing down dark glass',
    badge: 'Fast CDN',
    tags: ['rain', 'water', 'storm', 'teardrop', 'sad', 'cold', 'blues', 'lofi', 'dark', 'midnight', 'autumn', 'winter', 'slow', 'cry', 'lonely', 'sleep'],
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon Drive',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-driving-through-a-neon-lit-city-at-night-42232-large.mp4',
    type: 'direct',
    desc: 'Hypnotic neon cityscape motion with deep ambient glow',
    badge: 'Fast CDN',
    tags: ['neon', 'electro', 'synth', 'synthwave', 'drive', 'phonk', 'speed', 'dance', 'club', 'future', 'cyber', 'techno', 'bass', 'party', 'electronic', 'beat', 'remix', 'fast'],
  },
  {
    id: 'cosmic-nebula',
    name: 'Cosmic Nebula & Stars',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-deep-space-with-nebulae-and-stars-42865-large.mp4',
    type: 'direct',
    desc: 'Deep space cosmic stardust and glowing interstellar clouds',
    badge: 'Fast CDN',
    tags: ['space', 'cosmic', 'galaxy', 'star', 'stars', 'moon', 'sky', 'dream', 'universe', 'infinity', 'psychedelic', 'ambient', 'trance', 'fly', 'deep', 'astral', 'orbit'],
  },
  {
    id: 'aurora-borealis',
    name: 'Northern Lights Aurora',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aurora-borealis-illuminating-the-snowy-mountains-43093-large.mp4',
    type: 'direct',
    desc: 'Ethereal emerald and violet atmospheric auroras',
    badge: 'Fast CDN',
    tags: ['aurora', 'mountain', 'green', 'peace', 'serene', 'folk', 'acoustic', 'soul', 'calm', 'winter', 'snow', 'light', 'nature', 'healing', 'meditation', 'forest', 'wind'],
  },
  {
    id: 'abyssal-ocean',
    name: 'Abyssal Ocean Waves',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4',
    type: 'direct',
    desc: 'Nocturnal foaming ocean tide rhythm',
    badge: 'Fast CDN',
    tags: ['ocean', 'sea', 'wave', 'waves', 'beach', 'summer', 'water', 'shore', 'coast', 'breeze', 'blue', 'island', 'tide', 'surf', 'relax', 'chill'],
  },
  {
    id: 'golden-clouds',
    name: 'Sunset Horizon & Clouds',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-sun-setting-behind-mountains-and-clouds-42813-large.mp4',
    type: 'direct',
    desc: 'Warm radiant sunset sky and soaring dusk clouds',
    badge: 'Fast CDN',
    tags: ['sunset', 'sun', 'sunrise', 'golden', 'warm', 'dawn', 'morning', 'glow', 'orange', 'love', 'shine', 'pop', 'happy', 'day', 'acoustic', 'rnb', 'romantic'],
  },
  {
    id: 'city-bokeh',
    name: 'City Bokeh Twilight',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-blurred-traffic-lights-at-night-42841-large.mp4',
    type: 'direct',
    desc: 'Soft blurred nocturnal urban lights and metropolis flow',
    badge: 'Fast CDN',
    tags: ['city', 'street', 'highway', 'traffic', 'jazz', 'hiphop', 'rap', 'urban', 'metro', 'downtown', 'lights', 'night', 'car', 'town', 'walk'],
  },
  {
    id: 'ethereal-smoke',
    name: 'Ethereal Smoke Void',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-fluid-smoke-moving-in-dark-space-42618-large.mp4',
    type: 'direct',
    desc: 'Organic fluid smoke and mysterious dark drift',
    badge: 'Fast CDN',
    tags: ['smoke', 'ghost', 'shadow', 'fire', 'burn', 'rock', 'metal', 'heavy', 'mist', 'haze', 'mysterious', 'void', 'dark', 'magic', 'gothic', 'bass'],
  },
  {
    id: 'yt-lofi-rain',
    name: 'Lofi Night Rain (YT)',
    url: 'https://www.youtube.com/watch?v=lTRiuFIWV54',
    type: 'youtube',
    youtubeId: 'lTRiuFIWV54',
    desc: 'YouTube: Cozy night rain window stream',
    tags: ['lofi', 'rain', 'study', 'chill', 'cozy'],
  },
  {
    id: 'yt-neon-tokyo',
    name: 'Tokyo Rain Walk (YT)',
    url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    type: 'youtube',
    youtubeId: '4xDzrJKXOOY',
    desc: 'YouTube: Rainy Shinjuku cyber night neon',
    tags: ['tokyo', 'neon', 'walk', 'cyber', 'japan'],
  },
];

/**
 * Extracts YouTube 11-char Video ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // If user directly entered an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle standard youtube.com, youtu.be, shorts, embeds
  const patterns = [
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Identifies whether a video URL is YouTube, Direct video, or custom
 */
export function parseVideoSource(url: string): {
  type: 'youtube' | 'direct';
  youtubeId?: string;
  url: string;
} {
  const trimmed = (url || '').trim();
  const ytId = extractYouTubeId(trimmed);

  if (ytId) {
    return {
      type: 'youtube',
      youtubeId: ytId,
      url: trimmed,
    };
  }

  return {
    type: 'direct',
    url: trimmed,
  };
}

/**
 * Helper to convert a hex color string to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex || !hex.startsWith('#')) return null;
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length >= 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return null;
}

/**
 * Intelligent automatic video matching based on track metadata, lyrics, and cover artwork colors
 */
export function getAutoVideoPresetForTrack(track: Track | null): VideoPreset {
  const directPresets = CURATED_VIDEO_PRESETS.filter(p => p.type === 'direct');
  if (!track) {
    return directPresets[0]; // Midnight rain fallback
  }

  // 1. Extract and normalize searchable text from metadata and lyrics
  const titleText = (track.title || '').toLowerCase();
  const artistText = (track.artist || '').toLowerCase();
  const albumText = (track.album || '').toLowerCase();
  const lyricsText = (track.plainLyrics || track.lrcContent || '').slice(0, 1500).toLowerCase();
  const combinedText = `${titleText} ${artistText} ${albumText} ${lyricsText}`;

  // Score each preset by keyword relevance
  const scores: { preset: VideoPreset; score: number }[] = directPresets.map(preset => {
    let score = 0;
    if (preset.tags) {
      for (const tag of preset.tags) {
        const lowerTag = tag.toLowerCase();
        // Title or artist keyword match gives massive weight
        if (titleText.includes(lowerTag)) score += 8;
        if (artistText.includes(lowerTag)) score += 5;
        if (albumText.includes(lowerTag)) score += 3;
        // Lyrics match gives moderate weight
        if (lyricsText.includes(lowerTag)) score += 2;
      }
    }
    return { preset, score };
  });

  // Find best scoring preset
  scores.sort((a, b) => b.score - a.score);
  if (scores[0] && scores[0].score > 0) {
    return scores[0].preset;
  }

  // 2. Color Mood Analysis (using extracted cover artwork dominant colors)
  if (track.dominantColors?.primary || track.dominantColors?.accent) {
    const primaryRgb = hexToRgb(track.dominantColors.primary) || hexToRgb(track.dominantColors.accent);
    if (primaryRgb) {
      const { r, g, b } = primaryRgb;
      
      // High Green / Emerald tint -> Aurora Borealis
      if (g > r * 1.25 && g > b * 1.1 && g > 70) {
        const aurora = directPresets.find(p => p.id === 'aurora-borealis');
        if (aurora) return aurora;
      }
      
      // High Warm Red / Orange / Gold -> Sunset Clouds or Ethereal Smoke
      if (r > 160 && r > b * 1.5) {
        const sunset = directPresets.find(p => p.id === 'golden-clouds');
        if (sunset) return sunset;
      }

      // High Purple / Magenta / Pink -> Cyberpunk Neon or Cosmic Nebula
      if (r > 120 && b > 120 && g < Math.min(r, b) * 0.8) {
        const cyber = directPresets.find(p => p.id === 'cyber-neon') || directPresets.find(p => p.id === 'cosmic-nebula');
        if (cyber) return cyber;
      }

      // High Cyan / Deep Blue -> Ocean Waves or Midnight Rain
      if (b > 130 && b > r * 1.2) {
        const ocean = directPresets.find(p => p.id === 'abyssal-ocean') || directPresets.find(p => p.id === 'rain-glass');
        if (ocean) return ocean;
      }
    }
  }

  // 3. Deterministic hash fallback: ensures every unique song gets a steady, fitting atmospheric background
  let hash = 0;
  const hashKey = `${track.title}_${track.artist}_${track.duration || ''}`;
  for (let i = 0; i < hashKey.length; i++) {
    hash = (hash << 5) - hash + hashKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % directPresets.length;
  return directPresets[index];
}

// In-memory cache for online video searches to avoid repeat requests
const videoSearchCache = new Map<
  string,
  { videoId: string; title: string; author?: string; thumbnail?: string } | null
>();

/**
 * Searches the web/YouTube for the official music video / lyrics video of a track
 */
export async function fetchSongVideoForTrack(
  track: Track
): Promise<{ videoId: string; title: string; author?: string; thumbnail?: string } | null> {
  if (!track || !track.title) return null;
  const cacheKey = `${track.title.trim()}_${(track.artist || '').trim()}`.toLowerCase();
  if (videoSearchCache.has(cacheKey)) {
    return videoSearchCache.get(cacheKey) || null;
  }

  try {
    const query = `${track.title} ${track.artist || ''}`.trim();
    const res = await fetch(`/api/search-video?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      videoSearchCache.set(cacheKey, null);
      return null;
    }
    const data = await res.json();
    if (data && data.topMatch && data.topMatch.videoId) {
      const match = {
        videoId: data.topMatch.videoId,
        title: data.topMatch.title,
        author: data.topMatch.author,
        thumbnail: data.topMatch.thumbnail,
      };
      videoSearchCache.set(cacheKey, match);
      return match;
    }
    videoSearchCache.set(cacheKey, null);
    return null;
  } catch (err) {
    console.warn('Failed to fetch song video for track:', err);
    videoSearchCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Resolves the currently active video preset for a track considering user settings and online fetched video
 */
export function resolveActiveVideoPreset(
  settings: AppSettings,
  currentTrack: Track | null
): { preset: VideoPreset; isAuto: boolean; isOfficialSongVideo?: boolean } {
  const isAuto = !settings.videoPreset || settings.videoPreset === 'auto';
  
  if (isAuto) {
    // If we have an official matched song video for the current track, use it!
    if (currentTrack?.matchedVideo?.videoId) {
      return {
        preset: {
          id: `yt-official-${currentTrack.matchedVideo.videoId}`,
          name: currentTrack.matchedVideo.title || `${currentTrack.title} (Official Video)`,
          url: `https://www.youtube.com/watch?v=${currentTrack.matchedVideo.videoId}`,
          type: 'youtube',
          youtubeId: currentTrack.matchedVideo.videoId,
          desc: `Official Video • ${currentTrack.matchedVideo.author || currentTrack.artist}`,
          badge: 'Official Video',
        },
        isAuto: true,
        isOfficialSongVideo: true,
      };
    }

    return {
      preset: getAutoVideoPresetForTrack(currentTrack),
      isAuto: true,
      isOfficialSongVideo: false,
    };
  }

  const found = CURATED_VIDEO_PRESETS.find(p => p.id === settings.videoPreset);
  return {
    preset: found || CURATED_VIDEO_PRESETS[0],
    isAuto: false,
    isOfficialSongVideo: false,
  };
}

