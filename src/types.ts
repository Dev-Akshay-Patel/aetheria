/**
 * Core type definitions for Aetheria Web Lyrics & Music Player
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: string;
  duration: number; // in seconds
  audioUrl: string;
  coverUrl: string;
  lrcContent?: string;
  plainLyrics?: string;
  dominantColors: {
    primary: string;
    secondary: string;
    accent: string;
    deep: string;
  };
  isUploaded?: boolean;
  fileName?: string;
  matchedVideo?: {
    videoId: string;
    title: string;
    author?: string;
    thumbnail?: string;
  };
}

export interface LyricLine {
  id: string;
  time: number; // in seconds
  text: string;
  translation?: string;
}

export type LyricsAlignment = 'left' | 'center' | 'right';

export type FontFamilyChoice =
  | 'clash-display'
  | 'cabinet-grotesk'
  | 'syne'
  | 'instrument-serif'
  | 'plus-jakarta'
  | 'space-grotesk'
  | 'dm-sans';

export type BackgroundMode = 'mesh' | 'artwork-glow' | 'video' | 'static-gradient' | 'minimal-dark';

export type MeshPattern = 'smoke' | 'blob' | 'aurora' | 'blend' | 'minimal';
export type MeshSpeedChoice = 'frozen' | 'slow' | 'normal' | 'fast';
export type MeshToneChoice = 'vibrant' | 'balanced' | 'dark' | 'obsidian';

export type LyricFontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
export type LyricLineHeight = 'tight' | 'normal' | 'relaxed' | 'loose';
export type LyricFontWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export interface AppSettings {
  fontFamily: FontFamilyChoice;
  alignment: LyricsAlignment;
  fontSize: LyricFontSize;
  fontWeight: LyricFontWeight;
  lineHeight: LyricLineHeight;
  inactiveOpacity: number; // 0.1 to 0.6
  inactiveBlurAmount: number; // 0px to 8px
  inactiveFontSizeScale: number; // 0.6 to 1.0 (e.g. 0.85 = 85%)
  activeScale: boolean;
  blurInactive: boolean;
  bgMode: BackgroundMode;
  meshPattern: MeshPattern;
  meshTone: MeshToneChoice; // vibrant, balanced, dark, obsidian
  meshDarkness: number; // 0.0 (Vivid & Bright) to 1.0 (Deep Dark Colored Tone)
  meshOpacity: number; // 0.1 to 1.0
  meshBlurAmount: number; // 10px to 80px
  meshSpeed: MeshSpeedChoice;
  meshNoiseGrain: boolean;
  meshGrainOpacity: number; // 0.02 to 0.25
  videoPreset?: string;
  customVideoUrl?: string;
  reduceMotion: boolean;
  autoScroll: boolean;
  syncOffsetMs: number; // Offset for lyrics synchronization fine-tuning
  hideControlsOnIdle: boolean;
  autoFetchLyrics: boolean;
  autoFetchSongVideo: boolean;
}

export interface PlayerStatus {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isLoading: boolean;
  playbackRate: number;
}
