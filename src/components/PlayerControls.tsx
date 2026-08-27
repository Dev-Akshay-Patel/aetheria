import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Track, PlayerStatus, AppSettings } from '../types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Shuffle,
  Repeat,
  Repeat1,
  Sliders,
  ListMusic,
  Upload,
  Search,
  Maximize,
  Minimize,
  Film,
  Youtube,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MinimalProgressBar } from './MinimalProgressBar';

interface PlayerControlsProps {
  currentTrack: Track | null;
  playerStatus: PlayerStatus;
  settings: AppSettings;
  isFullscreen?: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onOpenSettings: () => void;
  onOpenPlaylist: () => void;
  onOpenUpload: () => void;
  onOpenSearchLyrics: () => void;
  onToggleFullscreen?: () => void;
  onToggleVideoMode?: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentTrack,
  playerStatus,
  settings,
  isFullscreen = false,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onOpenSettings,
  onOpenPlaylist,
  onOpenUpload,
  onOpenSearchLyrics,
  onToggleFullscreen,
  onToggleVideoMode,
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Auto-hide idle timer
  const [isUserActive, setIsUserActive] = useState(true);
  const idleTimerRef = useRef<number | null>(null);

  const formatTime = useCallback((secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }, []);

  useEffect(() => {
    const handleActivity = () => {
      setIsUserActive(true);
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      if (settings.hideControlsOnIdle && playerStatus.isPlaying) {
        idleTimerRef.current = window.setTimeout(() => {
          setIsUserActive(false);
        }, 4000);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // Initial timeout if playing
    if (settings.hideControlsOnIdle && playerStatus.isPlaying) {
      idleTimerRef.current = window.setTimeout(() => {
        setIsUserActive(false);
      }, 4000);
    } else {
      setIsUserActive(true);
    }

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [settings.hideControlsOnIdle, playerStatus.isPlaying]);

  const getFontClass = (font: AppSettings['fontFamily']) => {
    switch (font) {
      case 'cabinet-grotesk':
        return 'font-cabinet';
      case 'syne':
        return 'font-syne';
      case 'instrument-serif':
        return 'font-serif-display';
      case 'plus-jakarta':
        return 'font-jakarta';
      case 'space-grotesk':
        return 'font-space';
      case 'dm-sans':
        return 'font-dm';
      case 'clash-display':
      default:
        return 'font-clash';
    }
  };

  const titleFontClass = getFontClass(settings.fontFamily);
  const isControlsVisible = isUserActive || !playerStatus.isPlaying || !settings.hideControlsOnIdle;

  return (
    <>
      {/* Invisible Hover Trigger Area at Bottom Edge to Wake Controls on Proximity */}
      {!isControlsVisible && (
        <div
          id="player-hover-wake-strip"
          onMouseEnter={() => setIsUserActive(true)}
          onTouchStart={() => setIsUserActive(true)}
          className="fixed bottom-0 left-0 right-0 h-16 z-30 pointer-events-auto"
        />
      )}

      {/* 1. TOP HEADER (Utility Navigation & Logo) */}
      <motion.header
        id="player-header"
        animate={{
          opacity: isControlsVisible ? 1 : 0,
          y: isControlsVisible ? 0 : -80,
          pointerEvents: isControlsVisible ? 'auto' : 'none',
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-6 md:px-10 lg:px-12 pt-4 sm:pt-6"
      >
        {/* Brand / Logo (Header Left) */}
        <div className="flex items-center gap-2 select-none">
          <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-white/40 font-mono">
            AETHERIA
          </span>
        </div>

        {/* Quick Action Pills (Header Right) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onToggleVideoMode && (
            <button
              id="toggle-video-mode-btn"
              onClick={onToggleVideoMode}
              title={
                settings.bgMode === 'video'
                  ? 'Video Background Active (Click for Mesh Background)'
                  : 'Switch to Synced Video Background'
              }
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
                settings.bgMode === 'video'
                  ? 'bg-white/20 border-white/40 text-white shadow-md ring-1 ring-white/30'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            title="Appearance & Synchronized Settings"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/10 flex items-center justify-center opacity-60 hover:opacity-100 transition-all cursor-pointer bg-white/5 backdrop-blur-md text-white"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          <button
            id="open-search-lyrics-btn"
            onClick={onOpenSearchLyrics}
            title="Search Online Lyrics (LRCLIB)"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/10 flex items-center justify-center opacity-60 hover:opacity-100 transition-all cursor-pointer bg-white/5 backdrop-blur-md text-white"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            id="open-upload-modal-btn"
            onClick={onOpenUpload}
            title="Upload Local Music (MP3, WAV, FLAC, M4A)"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/10 flex items-center justify-center opacity-60 hover:opacity-100 transition-all cursor-pointer bg-white/5 backdrop-blur-md text-white"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <button
            id="open-playlist-drawer-btn"
            onClick={onOpenPlaylist}
            title="Track Queue & Playlist"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/10 flex items-center justify-center opacity-60 hover:opacity-100 transition-all cursor-pointer bg-white/5 backdrop-blur-md text-white"
          >
            <ListMusic className="w-3.5 h-3.5" />
          </button>

          {onToggleFullscreen && (
            <button
              id="toggle-fullscreen-btn"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/10 flex items-center justify-center opacity-60 hover:opacity-100 transition-all cursor-pointer bg-white/5 backdrop-blur-md text-white"
            >
              {isFullscreen ? (
                <Minimize className="w-3.5 h-3.5" />
              ) : (
                <Maximize className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </motion.header>

      {/* 2. SOLID BOTTOM CONTROLLER (Microsoft Media Player 3-Zone Layout with Minimalist Singular Line Scrubber) */}
      <motion.footer
        id="player-footer"
        animate={{
          opacity: isControlsVisible ? 1 : 0,
          y: isControlsVisible ? 0 : 130,
          pointerEvents: isControlsVisible ? 'auto' : 'none',
        }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#08080d]/95 sm:bg-[#08080d]/90 border-t border-white/[0.09] backdrop-blur-3xl shadow-[0_-12px_45px_rgba(0,0,0,0.95)] px-3 sm:px-6 md:px-10 lg:px-12 pt-2.5 pb-4 sm:pt-3.5 sm:pb-5"
      >
        <div className="w-full flex flex-col gap-2.5 sm:gap-3.5">
          {/* Minimalist Singular Line Progress Bar (Spanning Full Edge-to-Edge Width) */}
          <MinimalProgressBar
            duration={playerStatus.duration}
            currentTime={playerStatus.currentTime}
            isPlaying={playerStatus.isPlaying}
            playbackRate={playerStatus.playbackRate}
            onSeek={onSeek}
            formatTime={formatTime}
          />

          {/* 3-Zone Controller Toolbar: Left (Track & Artwork) | Center (Playback Controls & Time) | Right (Auxiliary Actions) */}
          <div className="flex items-center justify-between gap-3 sm:gap-6 min-h-[52px] sm:min-h-[58px] w-full">
            
            {/* Zone 1 (Left): Enlarged Album Artwork, Title & Artist (Microsoft Music Player Style) */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 max-w-[42%] sm:max-w-[38%]">
              {currentTrack ? (
                <>
                  {/* Enlarged Album Cover Thumbnail */}
                  <div className="relative shrink-0 group/cover">
                    {currentTrack.coverUrl ? (
                      <img
                        src={currentTrack.coverUrl}
                        alt={currentTrack.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shadow-xl border border-white/15 ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 border border-white/15 ring-1 ring-white/10 flex items-center justify-center shadow-lg">
                        <span className="text-sm font-mono font-bold text-white/70">♪</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Artist Text */}
                  <div className="flex flex-col min-w-0 justify-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        title={currentTrack.title}
                        className={`text-xs sm:text-sm md:text-base font-bold text-white truncate ${titleFontClass}`}
                      >
                        {currentTrack.title}
                      </span>
                      {currentTrack.matchedVideo && (
                        <span
                          title={`Synced Official Video: ${currentTrack.matchedVideo.title}`}
                          className="hidden md:inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-300 text-[8.5px] font-mono leading-none"
                        >
                          <Youtube className="w-2.5 h-2.5" />
                          <span>MV</span>
                        </span>
                      )}
                    </div>
                    <span
                      title={currentTrack.artist || 'Unknown Artist'}
                      className="text-xs sm:text-sm text-white/55 truncate font-jakarta mt-0.5"
                    >
                      {currentTrack.artist || 'Unknown Artist'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-white/30 text-xs font-mono">
                  <span>No track loaded</span>
                </div>
              )}
            </div>

            {/* Zone 2 (Center): Playback Trio & Live Timestamps */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="flex items-center gap-3 sm:gap-6">
                <button
                  id="prev-track-btn"
                  onClick={onPrev}
                  disabled={!currentTrack}
                  title="Previous Track"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center opacity-65 hover:opacity-100 disabled:opacity-20 cursor-pointer transition-all hover:bg-white/10 active:scale-95 text-white"
                >
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                </button>

                <button
                  id="play-pause-btn"
                  onClick={onTogglePlay}
                  disabled={!currentTrack}
                  title={playerStatus.isPlaying ? 'Pause' : 'Play'}
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-xl text-black hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
                >
                  {playerStatus.isPlaying ? (
                    <Pause className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-black text-black" />
                  ) : (
                    <Play className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-black text-black translate-x-0.5" />
                  )}
                </button>

                <button
                  id="next-track-btn"
                  onClick={onNext}
                  disabled={!currentTrack}
                  title="Next Track"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center opacity-65 hover:opacity-100 disabled:opacity-20 cursor-pointer transition-all hover:bg-white/10 active:scale-95 text-white"
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                </button>
              </div>

              {/* Time Readout Directly Under Center Controls */}
              <div
                className="text-[10.5px] sm:text-xs font-mono text-white/55 tracking-wider tabular-nums select-none mt-1"
              >
                {formatTime(playerStatus.currentTime)} / {formatTime(playerStatus.duration)}
              </div>
            </div>

            {/* Zone 3 (Right): Auxiliary Controls (Shuffle, Repeat, Volume) */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end max-w-[42%] sm:max-w-[38%]">
              <button
                id="shuffle-toggle-btn"
                onClick={onToggleShuffle}
                title={playerStatus.isShuffle ? 'Shuffle On' : 'Shuffle Off'}
                className={`p-1.5 sm:p-2 rounded-full transition-all cursor-pointer ${
                  playerStatus.isShuffle
                    ? 'text-white bg-white/20 shadow-sm'
                    : 'text-white/45 hover:text-white hover:bg-white/10'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                id="repeat-toggle-btn"
                onClick={onToggleRepeat}
                title={`Repeat: ${playerStatus.repeatMode}`}
                className={`p-1.5 sm:p-2 rounded-full transition-all cursor-pointer ${
                  playerStatus.repeatMode !== 'off'
                    ? 'text-white bg-white/20 shadow-sm'
                    : 'text-white/45 hover:text-white hover:bg-white/10'
                }`}
              >
                {playerStatus.repeatMode === 'one' ? (
                  <Repeat1 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>

              {/* Volume Slider Dropup */}
              <div
                className="relative flex items-center"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  id="volume-mute-btn"
                  onClick={onToggleMute}
                  title={playerStatus.isMuted ? 'Unmute' : 'Mute'}
                  className="p-1.5 sm:p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  {playerStatus.isMuted || playerStatus.volume === 0 ? (
                    <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-400" />
                  ) : playerStatus.volume < 0.5 ? (
                    <Volume1 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  ) : (
                    <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  )}
                </button>

                <AnimatePresence>
                  {showVolumeSlider && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full right-0 mb-3 p-3 rounded-2xl bg-[#12121a] border border-white/15 shadow-2xl backdrop-blur-2xl flex flex-col items-center gap-2 z-50"
                    >
                      <span className="text-[10px] font-mono text-white/60">
                        {Math.round((playerStatus.isMuted ? 0 : playerStatus.volume) * 100)}%
                      </span>
                      <input
                        id="volume-range-input"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={playerStatus.isMuted ? 0 : playerStatus.volume}
                        onChange={e => onVolumeChange(parseFloat(e.target.value))}
                        className="h-20 w-1.5 accent-white bg-white/20 rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </motion.footer>
    </>
  );
};
