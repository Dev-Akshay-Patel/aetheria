/**
 * Aetheria — Minimal Web Lyrics & Music Player
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Track, LyricLine, AppSettings, PlayerStatus } from './types';
import { parseLrc, parsePlainLyrics, fetchLyricsFromLRCLIB } from './services/lrcService';
import { parseAudioFile } from './services/metadataParser';
import { fetchSongVideoForTrack } from './services/videoService';
import { AnimatedMeshBackground } from './components/AnimatedMeshBackground';
import { LyricsContainer } from './components/LyricsContainer';
import { PlayerControls } from './components/PlayerControls';
import { SettingsModal } from './components/SettingsModal';
import { UploadModal } from './components/UploadModal';
import { PlaylistDrawer } from './components/PlaylistDrawer';
import { LyricsSearchModal } from './components/LyricsSearchModal';

const DEFAULT_SETTINGS: AppSettings = {
  fontFamily: 'clash-display',
  alignment: 'right',
  fontSize: 'xl',
  fontWeight: 'semibold',
  lineHeight: 'normal',
  inactiveOpacity: 0.25,
  inactiveBlurAmount: 2.5,
  inactiveFontSizeScale: 0.85,
  activeScale: true,
  blurInactive: true,
  bgMode: 'mesh',
  meshPattern: 'smoke',
  meshTone: 'balanced',
  meshDarkness: 0.35,
  meshOpacity: 0.85,
  meshBlurAmount: 45,
  meshSpeed: 'normal',
  meshNoiseGrain: true,
  meshGrainOpacity: 0.06,
  videoPreset: 'auto',
  reduceMotion: false,
  autoScroll: true,
  syncOffsetMs: 0,
  hideControlsOnIdle: true,
  autoFetchLyrics: true,
  autoFetchSongVideo: true,
};

const SETTINGS_STORAGE_KEY = 'aetheria_player_settings_v2';
const UPLOADED_TRACKS_KEY = 'aetheria_uploaded_tracks_v2';

export default function App() {
  // Settings State with LocalStorage Persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load settings from storage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Track & Playlist State: Starts clean without predefined tracks, loads user tracks if any
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const savedTracks = localStorage.getItem(UPLOADED_TRACKS_KEY);
      if (savedTracks) {
        const parsed = JSON.parse(savedTracks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved tracks', e);
    }
    return [];
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const currentTrack: Track | null = tracks[currentTrackIndex] || tracks[0] || null;

  // Lyrics State
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(false);

  // Audio & Player Status
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({
    isPlaying: false,
    currentTime: 0,
    duration: currentTrack?.duration || 0,
    volume: 0.85,
    isMuted: false,
    isShuffle: false,
    repeatMode: 'all',
    isLoading: false,
    playbackRate: 1,
  });

  // Modal Views
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isSearchLyricsOpen, setIsSearchLyricsOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? !!document.fullscreenElement : false;
  });

  // Track fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Enter fullscreen error:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.warn('Exit fullscreen error:', err);
        });
      }
    }
  }, []);

  // Save settings when updated
  const handleUpdateSettings = (newPartial: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newPartial };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist settings', e);
      }
      return updated;
    });
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {}
  };

  // 1. Audio initialization
  const loadTrackAudio = useCallback(async (track: Track) => {
    if (!track || !track.audioUrl) return;
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
    }
  }, []);

  // 2. Load lyrics for the current track
  const loadTrackLyrics = useCallback(async (track: Track) => {
    if (!track) {
      setParsedLyrics([]);
      return;
    }

    // If track has embedded LRC
    if (track.lrcContent) {
      const lines = parseLrc(track.lrcContent);
      setParsedLyrics(lines);
      return;
    }

    // If track has plain lyrics
    if (track.plainLyrics) {
      const lines = parsePlainLyrics(track.plainLyrics, track.duration);
      setParsedLyrics(lines);
      return;
    }

    // Auto-fetch from LRCLIB if enabled
    if (settings.autoFetchLyrics && (track.title || track.artist)) {
      setIsLoadingLyrics(true);
      try {
        const result = await fetchLyricsFromLRCLIB({
          title: track.title,
          artist: track.artist !== 'Unknown Artist' ? track.artist : '',
          album: track.album,
          duration: track.duration,
        });

        if (result?.syncedLyrics) {
          const lines = parseLrc(result.syncedLyrics);
          setParsedLyrics(lines);
          track.lrcContent = result.syncedLyrics;
        } else if (result?.plainLyrics) {
          const lines = parsePlainLyrics(result.plainLyrics, track.duration);
          setParsedLyrics(lines);
          track.plainLyrics = result.plainLyrics;
        } else {
          setParsedLyrics([]);
        }
      } catch (err) {
        console.warn('LRCLIB auto-fetch failed:', err);
        setParsedLyrics([]);
      } finally {
        setIsLoadingLyrics(false);
      }
    } else {
      setParsedLyrics([]);
    }
  }, [settings.autoFetchLyrics]);

  // 3. Load online music video for the current track
  const loadTrackVideo = useCallback(async (track: Track) => {
    if (!track || !settings.autoFetchSongVideo || !track.title) return;
    if (track.matchedVideo) return; // already fetched

    try {
      const match = await fetchSongVideoForTrack(track);
      if (match) {
        track.matchedVideo = match;
        // Update current track in state
        setCurrentTrackIndex(currIdx => {
          setTracks(prevTracks =>
            prevTracks.map(t => (t.id === track.id ? { ...t, matchedVideo: match } : t))
          );
          return currIdx;
        });
      }
    } catch (err) {
      console.warn('Online video auto-search failed:', err);
    }
  }, [settings.autoFetchSongVideo]);

  // Handle track change
  useEffect(() => {
    if (currentTrack) {
      loadTrackAudio(currentTrack);
      loadTrackLyrics(currentTrack);
      loadTrackVideo(currentTrack);
      setPlayerStatus(prev => ({
        ...prev,
        duration: currentTrack.duration || 0,
        currentTime: 0,
      }));

      // Auto-play next track if already playing
      if (playerStatus.isPlaying && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      setParsedLyrics([]);
      setPlayerStatus(prev => ({ ...prev, isPlaying: false, currentTime: 0, duration: 0 }));
    }
  }, [currentTrack?.id, loadTrackAudio, loadTrackLyrics, loadTrackVideo]);

  // Sync audio duration on loaded metadata
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (dur && !isNaN(dur) && isFinite(dur)) {
        setPlayerStatus(prev => ({ ...prev, duration: dur }));
      }
    }
  };

  // Audio Event Listeners
  const handleAudioEnded = () => {
    if (playerStatus.repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else if (playerStatus.repeatMode === 'all' || tracks.length > 1) {
      handleNextTrack();
    } else {
      setPlayerStatus(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  };

  // Play / Pause Toggle
  const handleTogglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (playerStatus.isPlaying) {
      audioRef.current.pause();
      setPlayerStatus(prev => ({ ...prev, isPlaying: false }));
    } else {
      audioRef.current.play().then(() => {
        setPlayerStatus(prev => ({ ...prev, isPlaying: true }));
      }).catch(err => {
        console.warn('Audio play error:', err);
      });
    }
  };

  // Next Track
  const handleNextTrack = () => {
    if (tracks.length === 0) return;
    if (playerStatus.isShuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      setCurrentTrackIndex(randomIndex);
    } else {
      setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
    }
  };

  // Previous Track
  const handlePrevTrack = () => {
    if (tracks.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setPlayerStatus(prev => ({ ...prev, currentTime: 0 }));
      return;
    }
    setCurrentTrackIndex(prev => (prev - 1 + tracks.length) % tracks.length);
  };

  // Seek
  const handleSeek = (seconds: number) => {
    if (!audioRef.current) return;
    const duration = playerStatus.duration || audioRef.current.duration || 0;
    const clamped = duration > 0 ? Math.max(0, Math.min(seconds, duration)) : Math.max(0, seconds);
    try {
      audioRef.current.currentTime = clamped;
    } catch {}
    setPlayerStatus(prev => ({ ...prev, currentTime: clamped }));
  };

  // Volume
  const handleVolumeChange = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    setPlayerStatus(prev => ({
      ...prev,
      volume: clamped,
      isMuted: clamped === 0,
    }));
  };

  // Mute Toggle
  const handleToggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !playerStatus.isMuted;
    audioRef.current.muted = newMuted;
    setPlayerStatus(prev => ({ ...prev, isMuted: newMuted }));
  };

  // Shuffle Toggle
  const handleToggleShuffle = () => {
    setPlayerStatus(prev => ({ ...prev, isShuffle: !prev.isShuffle }));
  };

  // Repeat Toggle
  const handleToggleRepeat = () => {
    setPlayerStatus(prev => {
      const nextMode =
        prev.repeatMode === 'off' ? 'all' : prev.repeatMode === 'all' ? 'one' : 'off';
      return { ...prev, repeatMode: nextMode };
    });
  };

  // Track Upload Handler (Appends new track to queue so it plays after current track)
  const handleTrackUploaded = (newTrack: Track) => {
    setTracks(prev => {
      if (prev.length === 0) {
        setCurrentTrackIndex(0);
        setPlayerStatus(p => ({
          ...p,
          isPlaying: false,
          currentTime: 0,
          duration: newTrack.duration || 0,
        }));
        setTimeout(() => {
          if (audioRef.current && newTrack.audioUrl) {
            audioRef.current.src = newTrack.audioUrl;
            audioRef.current.pause();
          }
        }, 50);
        return [newTrack];
      }
      // Appends track to playlist queue seamlessly without stopping currently playing music
      return [...prev, newTrack];
    });
  };

  // Drag & drop file anywhere on screen to quickly add and play music
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = (Array.from(e.dataTransfer.files) as File[]).filter((f: File) =>
      f.type.startsWith('audio/') ||
      /\.(mp3|wav|flac|m4a|aac|ogg|opus)$/i.test(f.name)
    );

    if (files.length === 0) return;

    for (const file of files) {
      try {
        const metadata = await parseAudioFile(file);
        handleTrackUploaded(metadata);
      } catch (err) {
        console.warn('Failed to parse dropped audio file:', err);
      }
    }
  };

  // Apply custom / searched lyrics
  const handleApplyLyrics = (lrcContent: string, plainLyrics?: string) => {
    if (currentTrack) {
      currentTrack.lrcContent = lrcContent;
      currentTrack.plainLyrics = plainLyrics;
      if (lrcContent) {
        setParsedLyrics(parseLrc(lrcContent));
      } else if (plainLyrics) {
        setParsedLyrics(parsePlainLyrics(plainLyrics, currentTrack.duration));
      }
    }
  };

  // Delete custom track
  const handleDeleteTrack = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      setCurrentTrackIndex(0);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(playerStatus.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(playerStatus.currentTime + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(playerStatus.volume + 0.08);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(playerStatus.volume - 0.08);
          break;
        case 'KeyM':
          handleToggleMute();
          break;
        case 'KeyS':
          setIsSettingsOpen(prev => !prev);
          break;
        case 'KeyU':
          setIsUploadOpen(prev => !prev);
          break;
        case 'KeyL':
          setIsSearchLyricsOpen(prev => !prev);
          break;
        case 'KeyF':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'Escape':
          setIsSettingsOpen(false);
          setIsUploadOpen(false);
          setIsPlaylistOpen(false);
          setIsSearchLyricsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerStatus.currentTime, playerStatus.volume, playerStatus.isPlaying, playerStatus.isMuted, currentTrack, handleToggleFullscreen]);

  // Calculate Next Track for queue preview
  const nextTrack = tracks.length > 1 ? tracks[(currentTrackIndex + 1) % tracks.length] : null;

  return (
    <main
      id="aetheria-music-player-root"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-screen h-[100dvh] overflow-hidden flex flex-col text-white font-clash select-none"
    >
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setPlayerStatus(p => ({
              ...p,
              currentTime: audioRef.current?.currentTime || p.currentTime,
              duration: audioRef.current?.duration || p.duration,
            }));
          }
        }}
        onEnded={handleAudioEnded}
        onPause={() => setPlayerStatus(p => ({ ...p, isPlaying: false }))}
        onPlay={() => setPlayerStatus(p => ({ ...p, isPlaying: true }))}
        preload="auto"
      />

      {/* Dynamic Animated Gradient Mesh / Video Background (Visible at z-0) */}
      <AnimatedMeshBackground
        currentTrack={currentTrack}
        settings={settings}
        isPlaying={playerStatus.isPlaying}
        currentTime={playerStatus.currentTime}
        playbackRate={playerStatus.playbackRate}
      />

      {/* Drag & Drop Overlay Indicator */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-black/75 border-2 border-dashed border-white/50 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xl font-bold tracking-tight text-white font-clash">
            Drop Audio Files Here
          </p>
          <p className="text-xs text-white/60 font-jakarta mt-1">
            Supports MP3, WAV, FLAC, M4A, OGG
          </p>
        </div>
      )}

      {/* Top Header & Track Info */}
      <PlayerControls
        currentTrack={currentTrack}
        playerStatus={playerStatus}
        settings={settings}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onTogglePlay={handleTogglePlay}
        onPrev={handlePrevTrack}
        onNext={handleNextTrack}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPlaylist={() => setIsPlaylistOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSearchLyrics={() => setIsSearchLyricsOpen(true)}
        onToggleVideoMode={() => handleUpdateSettings({ bgMode: settings.bgMode === 'video' ? 'mesh' : 'video' })}
      />

      {/* Main Full-Screen Synchronized Lyrics Canvas */}
      <div className="flex-1 w-full h-full relative z-10">
        <LyricsContainer
          lyrics={parsedLyrics}
          currentTime={playerStatus.currentTime}
          duration={playerStatus.duration}
          currentTrack={currentTrack}
          nextTrack={nextTrack}
          settings={settings}
          isLoadingLyrics={isLoadingLyrics}
          onSeek={handleSeek}
          onOpenManualSearch={() => setIsSearchLyricsOpen(true)}
          onSelectNextTrack={handleNextTrack}
          onOpenUpload={() => setIsUploadOpen(true)}
        />
      </div>

      {/* Separate Settings Page / Modal Overlay */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        currentTrack={currentTrack}
        onUpdateSettings={handleUpdateSettings}
        onResetDefaults={handleResetDefaults}
      />

      {/* Upload Music Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onTrackUploaded={handleTrackUploaded}
      />

      {/* Playlist & Track Queue Drawer */}
      <PlaylistDrawer
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        tracks={tracks}
        currentTrack={currentTrack}
        isPlaying={playerStatus.isPlaying}
        onSelectTrack={track => {
          const idx = tracks.findIndex(t => t.id === track.id);
          if (idx !== -1) setCurrentTrackIndex(idx);
          setIsPlaylistOpen(false);
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onDeleteTrack={handleDeleteTrack}
      />

      {/* Live Lyrics Search & LRC Importer Modal */}
      <LyricsSearchModal
        isOpen={isSearchLyricsOpen}
        onClose={() => setIsSearchLyricsOpen(false)}
        currentTrack={currentTrack}
        onApplyLyrics={handleApplyLyrics}
      />
    </main>
  );
}
