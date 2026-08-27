import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LyricLine, AppSettings, Track } from '../types';
import { getActiveLyricIndex } from '../services/lrcService';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Music2, RefreshCw, ChevronDown, Upload } from 'lucide-react';

interface LyricsContainerProps {
  lyrics: LyricLine[];
  currentTime: number;
  duration: number;
  currentTrack: Track | null;
  nextTrack?: Track | null;
  settings: AppSettings;
  isLoadingLyrics?: boolean;
  onSeek: (seconds: number) => void;
  onOpenManualSearch?: () => void;
  onSelectNextTrack?: () => void;
  onOpenUpload?: () => void;
}

export const LyricsContainer: React.FC<LyricsContainerProps> = ({
  lyrics,
  currentTime,
  currentTrack,
  nextTrack,
  settings,
  isLoadingLyrics = false,
  onSeek,
  onOpenManualSearch,
  onSelectNextTrack,
  onOpenUpload,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const scrollAnimFrameRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  const activeIndex = getActiveLyricIndex(
    lyrics,
    currentTime,
    settings.syncOffsetMs / 1000
  );

  // Smooth interpolated scroll animation using requestAnimationFrame
  const smoothScrollToTarget = useCallback(
    (targetTop: number, duration = 600) => {
      if (!containerRef.current) return;
      const container = containerRef.current;

      if (scrollAnimFrameRef.current) {
        cancelAnimationFrame(scrollAnimFrameRef.current);
      }

      const startTop = container.scrollTop;
      const distance = targetTop - startTop;

      if (Math.abs(distance) < 2) {
        container.scrollTop = targetTop;
        return;
      }

      const startTime = performance.now();
      isProgrammaticScrollRef.current = true;

      const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

      const step = (currentTimeStamp: number) => {
        const elapsed = currentTimeStamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeOutQuart(progress);

        if (containerRef.current) {
          containerRef.current.scrollTop = startTop + distance * ease;
        }

        if (progress < 1) {
          scrollAnimFrameRef.current = requestAnimationFrame(step);
        } else {
          scrollAnimFrameRef.current = null;
          setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 60);
        }
      };

      scrollAnimFrameRef.current = requestAnimationFrame(step);
    },
    []
  );

  // Auto-scroll logic to center the active lyric
  const scrollToActive = useCallback(
    (instant = false) => {
      if (!containerRef.current || !activeLineRef.current || userIsScrolling) return;

      const container = containerRef.current;
      const activeEl = activeLineRef.current;

      const containerHeight = container.clientHeight;
      const activeOffsetTop = activeEl.offsetTop;
      const activeHeight = activeEl.clientHeight;

      const targetScrollTop = Math.max(
        0,
        activeOffsetTop - containerHeight / 2 + activeHeight / 2
      );

      if (instant || settings.reduceMotion) {
        if (scrollAnimFrameRef.current) {
          cancelAnimationFrame(scrollAnimFrameRef.current);
        }
        container.scrollTop = targetScrollTop;
      } else {
        smoothScrollToTarget(targetScrollTop, 600);
      }
    },
    [userIsScrolling, settings.reduceMotion, smoothScrollToTarget]
  );

  useEffect(() => {
    if (!userIsScrolling && activeIndex >= 0) {
      scrollToActive(false);
    }
  }, [activeIndex, scrollToActive, userIsScrolling]);

  useEffect(() => {
    return () => {
      if (scrollAnimFrameRef.current) {
        cancelAnimationFrame(scrollAnimFrameRef.current);
      }
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToActive(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentTrack?.id, lyrics.length, scrollToActive]);

  const handleUserInteraction = () => {
    if (isProgrammaticScrollRef.current) return;
    setUserIsScrolling(true);
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      setUserIsScrolling(false);
      scrollToActive(false);
    }, 3500);
  };

  const getFontFamilyClass = (font: AppSettings['fontFamily']) => {
    switch (font) {
      case 'cabinet-grotesk':
        return 'font-cabinet';
      case 'syne':
        return 'font-syne';
      case 'instrument-serif':
        return 'font-serif-display tracking-wide';
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

  const getAlignmentClass = (alignment: AppSettings['alignment']) => {
    switch (alignment) {
      case 'left':
        return 'text-left items-start ml-0 mr-auto';
      case 'center':
        return 'text-center items-center mx-auto';
      case 'right':
      default:
        return 'text-right items-end ml-auto mr-0';
    }
  };

  const getFontSizeClass = (size: AppSettings['fontSize']) => {
    switch (size) {
      case 'sm':
        return 'text-lg sm:text-xl md:text-2xl';
      case 'base':
        return 'text-xl sm:text-2xl md:text-3xl';
      case 'lg':
        return 'text-2xl sm:text-3xl md:text-4xl';
      case 'xl':
        return 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl';
      case '2xl':
        return 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl';
      case '3xl':
        return 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl';
      default:
        return 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl';
    }
  };

  const getFontWeightClass = (weight: AppSettings['fontWeight']) => {
    switch (weight) {
      case 'normal':
        return 'font-normal';
      case 'bold':
        return 'font-bold';
      case 'semibold':
      default:
        return 'font-semibold';
    }
  };

  const getLineHeightClass = (lh: AppSettings['lineHeight']) => {
    switch (lh) {
      case 'tight':
        return 'leading-tight space-y-4 sm:space-y-6';
      case 'relaxed':
        return 'leading-relaxed space-y-8 sm:space-y-12';
      case 'loose':
        return 'leading-loose space-y-10 sm:space-y-14';
      case 'normal':
      default:
        return 'leading-tight space-y-6 sm:space-y-8';
    }
  };

  const fontClass = getFontFamilyClass(settings.fontFamily);
  const alignClass = getAlignmentClass(settings.alignment);
  const fontSizeClass = getFontSizeClass(settings.fontSize);
  const fontWeightClass = getFontWeightClass(settings.fontWeight);
  const lineHeightClass = getLineHeightClass(settings.lineHeight);

  // 1. If no track is currently loaded (Clean state after removing predefined musics)
  if (!currentTrack) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center px-6 z-10 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full p-8 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-white/15 to-white/5 border border-white/20 flex items-center justify-center shadow-inner">
            <Music2 className="w-9 h-9 text-white/80" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white font-clash tracking-tight">
              Aetheria Lyrics
            </h2>
            <p className="text-sm text-white/50 font-jakarta leading-relaxed">
              Upload your audio tracks (MP3, WAV, FLAC, M4A) or drag & drop files here to start synchronized lyrics playback.
            </p>
          </div>

          <button
            id="initial-upload-music-btn"
            onClick={onOpenUpload}
            className="w-full py-3.5 px-6 rounded-2xl bg-white text-black font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Music</span>
          </button>
        </motion.div>
      </div>
    );
  }

  // 2. If loading lyrics
  if (isLoadingLyrics) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-white/50 space-y-4 px-6 z-10">
        <RefreshCw className="w-6 h-6 animate-spin text-white/50" />
        <p className="text-xs font-mono tracking-widest uppercase opacity-70">
          Syncing lyrics...
        </p>
      </div>
    );
  }

  // 3. If lyrics empty
  if (!lyrics || lyrics.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-between px-6 sm:px-12 z-10 select-none">
        {nextTrack && (
          <div className="w-1/3 hidden lg:flex flex-col justify-center">
            <div className="opacity-20 text-xs tracking-widest uppercase mb-3 font-semibold">
              Next Track
            </div>
            <div className="text-lg sm:text-xl opacity-40 mb-1 font-bold truncate">
              {nextTrack.title}
            </div>
            <div className="text-sm opacity-20 truncate font-medium">
              {nextTrack.artist}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="max-w-md flex flex-col items-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
              <Music2 className="w-7 h-7 text-white/40" />
            </div>

            <div className="space-y-2">
              <h3 className={`text-2xl sm:text-3xl text-white/90 ${fontWeightClass} ${fontClass}`}>
                Lyrics unavailable
              </h3>
              <p className="text-sm sm:text-base text-white/50 font-jakarta max-w-xs mx-auto leading-relaxed">
                No synchronized lyrics found for this track. You can search online or import an LRC file.
              </p>
            </div>

            {onOpenManualSearch && (
              <button
                id="lyrics-manual-search-btn"
                onClick={onOpenManualSearch}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs tracking-wider uppercase font-semibold transition-all border border-white/10 backdrop-blur-md shadow-lg cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search Online</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // User-configured blur amount and inactive font size scale
  const blurBaseAmount = settings.blurInactive !== false ? (settings.inactiveBlurAmount ?? 2.5) : 0;
  const inactiveScaleValue = settings.inactiveFontSizeScale ?? 0.85;

  return (
    <div className="relative w-full h-full flex items-center px-6 sm:px-12 overflow-hidden z-10">
      {/* Left Sidebar: Next Track Info on Large Screens */}
      {nextTrack && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          onClick={onSelectNextTrack}
          className="w-1/3 h-full hidden lg:flex flex-col justify-center select-none cursor-pointer group pr-8 z-20"
        >
          <div className="opacity-20 text-xs tracking-widest uppercase mb-3 font-semibold group-hover:opacity-40 transition-opacity">
            Next Track
          </div>
          <div className="text-lg sm:text-xl opacity-40 group-hover:opacity-80 mb-1 font-bold text-white transition-opacity truncate">
            {nextTrack.title}
          </div>
          <div className="text-sm opacity-20 group-hover:opacity-40 text-white font-medium transition-opacity truncate">
            {nextTrack.artist}
          </div>
        </motion.div>
      )}

      {/* Main Lyrics Viewport */}
      <div
        id="lyrics-scroll-viewport"
        ref={containerRef}
        onWheel={handleUserInteraction}
        onTouchStart={handleUserInteraction}
        onMouseDown={handleUserInteraction}
        className={`w-full ${
          nextTrack ? 'lg:w-2/3 lg:pr-4' : 'w-full'
        } h-full overflow-y-auto no-scrollbar mask-lyrics-fade pt-[50vh] pb-[50vh]`}
        style={{ scrollBehavior: 'auto' }}
      >
        <div
          className={`flex flex-col w-full max-w-4xl ${alignClass} ${lineHeightClass} ${fontClass}`}
        >
          {lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const distance = Math.abs(idx - activeIndex);

            // Progressive opacity calculation
            let opacity = settings.inactiveOpacity ?? 0.25;
            if (distance === 1) {
              opacity = Math.max(0.35, opacity * 1.4);
            } else if (distance === 2) {
              opacity = Math.max(0.22, opacity * 0.9);
            } else if (distance >= 3) {
              opacity = Math.max(0.12, opacity * 0.5);
            }

            // Lens blur calculation based on user setting
            let blurPx = 0;
            if (!isActive && blurBaseAmount > 0) {
              blurPx = Math.min(distance * (blurBaseAmount / 1.8), blurBaseAmount * 1.5);
            }

            // Size transform calculation based on user setting
            const scale = isActive
              ? (settings.activeScale ? 1.025 : 1)
              : inactiveScaleValue;

            const transformOrigin =
              settings.alignment === 'left'
                ? 'left center'
                : settings.alignment === 'center'
                ? 'center center'
                : 'right center';

            return (
              <div
                key={line.id || `lyric-${idx}`}
                ref={isActive ? activeLineRef : null}
                id={isActive ? 'active-lyric-line' : `lyric-line-${idx}`}
                onClick={() => onSeek(line.time)}
                className={`group cursor-pointer select-none relative transition-[opacity,filter,transform] duration-500 ease-out ${fontSizeClass} ${fontWeightClass} ${
                  isActive
                    ? 'text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.45)]'
                    : 'text-white hover:opacity-75'
                }`}
                style={{
                  opacity: isActive ? 1 : opacity,
                  filter: blurPx > 0 ? `blur(${blurPx.toFixed(1)}px)` : 'none',
                  transform: `scale(${scale})`,
                  transformOrigin,
                  willChange: 'opacity, filter, transform',
                }}
              >
                <span className="inline-block">
                  {line.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Re-center floating pill when user scrolls away */}
      <AnimatePresence>
        {userIsScrolling && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            id="jump-to-current-lyric-btn"
            onClick={() => {
              setUserIsScrolling(false);
              scrollToActive(false);
            }}
            className="absolute bottom-20 sm:bottom-24 right-5 sm:right-8 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-mono tracking-wider uppercase backdrop-blur-xl border border-white/15 shadow-xl transition-all cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Sync lyric</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
