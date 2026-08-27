import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { AppSettings, Track } from '../types';
import { CURATED_VIDEO_PRESETS, parseVideoSource, resolveActiveVideoPreset } from '../services/videoService';
import { extractColorsFromImage, ExtractedPalette } from '../services/colorExtractor';
import { SmokeCloudMesh } from './SmokeCloudMesh';

interface AnimatedMeshBackgroundProps {
  currentTrack: Track | null;
  settings: AppSettings;
  isPlaying?: boolean;
  currentTime?: number;
  playbackRate?: number;
}

export const AnimatedMeshBackground: React.FC<AnimatedMeshBackgroundProps> = ({
  currentTrack,
  settings,
  isPlaying = false,
  currentTime = 0,
  playbackRate = 1,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytIframeRef = useRef<HTMLIFrameElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [dynamicColors, setDynamicColors] = useState<ExtractedPalette | null>(null);
  const lastSyncedTimeRef = useRef<number>(0);

  // Extract live colors from currentTrack coverUrl if not pre-calculated
  useEffect(() => {
    let isCancelled = false;
    if (currentTrack?.dominantColors) {
      setDynamicColors(currentTrack.dominantColors);
      return;
    }

    if (currentTrack?.coverUrl) {
      extractColorsFromImage(currentTrack.coverUrl).then(palette => {
        if (!isCancelled && palette) {
          setDynamicColors(palette);
        }
      });
    } else {
      setDynamicColors(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [currentTrack?.id, currentTrack?.coverUrl, currentTrack?.dominantColors]);

  const colors = useMemo(() => {
    return (
      dynamicColors ||
      currentTrack?.dominantColors || {
        primary: '#4f46e5', // Deep Indigo
        secondary: '#9333ea', // Electric Purple
        accent: '#06b6d4', // Cyan Glow
        deep: '#050508', // Dark background
      }
    );
  }, [dynamicColors, currentTrack?.dominantColors]);

  const { bgMode, reduceMotion, customVideoUrl } = settings;

  // Active video configuration (handles Official Fetched Video, Auto Track Matching or specific preset / custom URL)
  const activeVideoInfo = useMemo(() => {
    const custom = (customVideoUrl || '').trim();
    if (custom) {
      return {
        ...parseVideoSource(custom),
        isOfficial: false,
        name: 'Custom Video',
      };
    }
    const { preset, isOfficialSongVideo } = resolveActiveVideoPreset(settings, currentTrack);
    return {
      ...parseVideoSource(preset ? preset.url : CURATED_VIDEO_PRESETS[0].url),
      isOfficial: isOfficialSongVideo,
      name: preset?.name || 'Ambient Loop',
    };
  }, [settings, currentTrack, customVideoUrl]);

  // Reset video loaded status when source changes
  useEffect(() => {
    setVideoLoaded(false);
  }, [activeVideoInfo.url]);

  // Helper to send YouTube IFrame API Commands
  const sendYTCommand = useCallback((funcName: string, args: any[] = []) => {
    const iframe = ytIframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: funcName, args }),
          '*'
        );
      } catch (err) {
        console.warn('YouTube iframe command failed:', err);
      }
    }
  }, []);

  // Track the expected elapsed time to only seek video when an actual discontinuous jump occurs
  const audioClockRef = useRef<{ time: number; wallClock: number }>({
    time: currentTime,
    wallClock: performance.now(),
  });

  // Track play/pause changes cleanly without repeatedly seeking
  useEffect(() => {
    if (bgMode !== 'video') return;

    if (activeVideoInfo.type === 'direct' && videoRef.current) {
      const v = videoRef.current;
      if (isPlaying) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    } else if (activeVideoInfo.type === 'youtube') {
      if (isPlaying) {
        sendYTCommand('playVideo');
        sendYTCommand('mute');
      } else {
        sendYTCommand('pauseVideo');
      }
    }
    audioClockRef.current = { time: currentTime, wallClock: performance.now() };
  }, [isPlaying, bgMode, activeVideoInfo.type, sendYTCommand]);

  // Handle Playback Rate synchronization
  useEffect(() => {
    if (bgMode !== 'video') return;

    if (activeVideoInfo.type === 'direct' && videoRef.current) {
      videoRef.current.playbackRate = playbackRate || 1;
    } else if (activeVideoInfo.type === 'youtube') {
      sendYTCommand('setPlaybackRate', [playbackRate || 1]);
    }
  }, [playbackRate, bgMode, activeVideoInfo.type, sendYTCommand]);

  // Detect True User Seeking / Discontinuous Time Jumps (Only seek video when user actually scrubs or skips)
  useEffect(() => {
    if (bgMode !== 'video') return;

    const now = performance.now();
    const elapsedSeconds = isPlaying
      ? ((now - audioClockRef.current.wallClock) / 1000) * (playbackRate || 1)
      : 0;
    const expectedTime = audioClockRef.current.time + elapsedSeconds;
    const drift = Math.abs(currentTime - expectedTime);

    // If drift is > 3.0 seconds (user clicked progress bar, lyric line, or skipped), seek the video!
    if (drift > 3.0) {
      if (activeVideoInfo.type === 'youtube') {
        sendYTCommand('seekTo', [currentTime, true]);
        if (isPlaying) {
          sendYTCommand('playVideo');
        }
      } else if (activeVideoInfo.type === 'direct' && videoRef.current) {
        const v = videoRef.current;
        if (v.duration && v.duration > 0) {
          try {
            v.currentTime = currentTime % v.duration;
          } catch {}
        }
      }
    }

    audioClockRef.current = { time: currentTime, wallClock: now };
  }, [currentTime, isPlaying, playbackRate, bgMode, activeVideoInfo.type, sendYTCommand]);

  // 1. MINIMAL DARK
  if (bgMode === 'minimal-dark') {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#070709] select-none">
        <div
          className="absolute inset-0 opacity-30 transition-colors duration-1000"
          style={{
            background: `radial-gradient(circle at 75% 25%, ${colors.primary}44 0%, transparent 60%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/80" />
      </div>
    );
  }

  // 2. STATIC GRADIENT
  if (bgMode === 'static-gradient') {
    return (
      <div
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none transition-colors duration-1000"
        style={{
          backgroundColor: '#070709',
          backgroundImage: `
            radial-gradient(circle at 20% 20%, ${colors.primary}55 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, ${colors.secondary}50 0%, transparent 55%),
            radial-gradient(circle at 85% 20%, ${colors.accent}40 0%, transparent 45%)
          `,
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[20px]" />
      </div>
    );
  }

  // 3. ARTWORK GLOW
  if (bgMode === 'artwork-glow') {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#070709] select-none">
        {currentTrack?.coverUrl ? (
          <div
            key={currentTrack.id}
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out"
            style={{
              backgroundImage: `url(${currentTrack.coverUrl})`,
              filter: 'blur(50px) saturate(1.8) brightness(0.65)',
              transform: 'scale(1.2)',
            }}
          />
        ) : (
          <div
            className="absolute inset-0 transition-colors duration-1000"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${colors.primary}77 0%, ${colors.secondary}55 50%, transparent 80%)`,
              filter: 'blur(40px)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#070709]/40 to-[#070709]/90" />
        <div className="absolute inset-0 bg-black/25" />
      </div>
    );
  }

  // 4. VIDEO CANVAS
  if (bgMode === 'video') {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#070709] select-none">
        {activeVideoInfo.type === 'youtube' && activeVideoInfo.youtubeId ? (
          /* Cropped and oversized YouTube viewport to completely hide YouTube title, branding, and controls */
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <iframe
              ref={ytIframeRef}
              key={activeVideoInfo.youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${activeVideoInfo.youtubeId}?autoplay=${isPlaying ? 1 : 0}&mute=1&controls=0&loop=1&playlist=${activeVideoInfo.youtubeId}&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1`}
              title="Ambient Background Video"
              allow="autoplay; encrypted-media"
              tabIndex={-1}
              onLoad={() => {
                if (ytIframeRef.current?.contentWindow) {
                  sendYTCommand('mute');
                  if (currentTime > 1) {
                    sendYTCommand('seekTo', [currentTime, true]);
                  }
                  if (isPlaying) {
                    sendYTCommand('playVideo');
                  } else {
                    sendYTCommand('pauseVideo');
                  }
                }
              }}
              className="absolute w-[180vw] h-[180vh] min-w-[200vw] min-h-[200vh] pointer-events-none select-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-75"
              style={{
                filter: 'brightness(0.7) contrast(1.15) saturate(1.2)',
                border: 'none',
              }}
            />
          </div>
        ) : (
          /* High-Speed Direct MP4 / WebM Video Stream */
          <video
            ref={videoRef}
            key={activeVideoInfo.url}
            src={activeVideoInfo.url}
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={() => {
              setVideoLoaded(true);
              if (isPlaying && videoRef.current) {
                videoRef.current.play().catch(() => {});
              }
            }}
            onCanPlay={() => {
              setVideoLoaded(true);
              if (isPlaying && videoRef.current) {
                videoRef.current.play().catch(() => {});
              } else if (!isPlaying && videoRef.current) {
                videoRef.current.pause();
              }
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              videoLoaded ? 'opacity-80' : 'opacity-0'
            }`}
            style={{
              filter: 'brightness(0.75) contrast(1.1) saturate(1.2)',
            }}
          />
        )}

        {/* Ambient color gradient underlay */}
        <div
          className="absolute inset-0 opacity-35 transition-colors duration-1000 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 70% 30%, ${colors.primary}66 0%, transparent 65%),
                         radial-gradient(circle at 30% 70%, ${colors.secondary}55 0%, transparent 65%)`,
          }}
        />

        {/* Cinematic contrast overlay for crystal-clear lyrics typography */}
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#070709] via-[#070709]/70 to-transparent opacity-90 pointer-events-none" />
      </div>
    );
  }

  // 5. DEFAULT: ORGANIC CLOUD-LIKE SMOKE & AMBIENT MESH (Multi-pattern visualizer with customizable opacity, blur, speed & grain)
  return (
    <SmokeCloudMesh
      colors={colors}
      pattern={settings.meshPattern || 'smoke'}
      meshTone={settings.meshTone || 'balanced'}
      meshDarkness={settings.meshDarkness ?? 0.35}
      opacity={settings.meshOpacity ?? 0.85}
      blurAmount={settings.meshBlurAmount ?? 45}
      speed={settings.meshSpeed || 'normal'}
      noiseGrain={settings.meshNoiseGrain ?? true}
      grainOpacity={settings.meshGrainOpacity ?? 0.06}
      isPlaying={isPlaying}
      reduceMotion={reduceMotion}
      playbackRate={playbackRate}
    />
  );
};
