import React, { useRef, useEffect, useState, useCallback } from 'react';

interface MinimalProgressBarProps {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  playbackRate?: number;
  onSeek: (seconds: number) => void;
  formatTime: (seconds: number) => string;
}

export const MinimalProgressBar: React.FC<MinimalProgressBarProps> = ({
  duration,
  currentTime,
  isPlaying,
  playbackRate = 1,
  onSeek,
  formatTime,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [hoverFraction, setHoverFraction] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Time tracking for 60fps direct DOM manipulation (0 React re-renders, ultralow CPU/GPU)
  const lastSyncAudioTimeRef = useRef(currentTime);
  const lastSyncTimestampRef = useRef(performance.now());
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    lastSyncAudioTimeRef.current = currentTime;
    lastSyncTimestampRef.current = performance.now();
  }, [currentTime]);

  const getFractionFromClientX = useCallback(
    (clientX: number) => {
      if (!containerRef.current || duration <= 0) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return frac;
    },
    [duration]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (duration <= 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    const frac = getFractionFromClientX(e.clientX);
    setHoverFraction(frac);
    const targetSeconds = frac * duration;
    lastSyncAudioTimeRef.current = targetSeconds;
    lastSyncTimestampRef.current = performance.now();
    if (fillRef.current) {
      fillRef.current.style.width = `${frac * 100}%`;
    }
    onSeek(targetSeconds);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (duration <= 0) return;
    const frac = getFractionFromClientX(e.clientX);
    setHoverFraction(frac);
    if (isDragging) {
      const targetSeconds = frac * duration;
      lastSyncAudioTimeRef.current = targetSeconds;
      lastSyncTimestampRef.current = performance.now();
      if (fillRef.current) {
        fillRef.current.style.width = `${frac * 100}%`;
      }
      onSeek(targetSeconds);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      const frac = getFractionFromClientX(e.clientX);
      const targetSeconds = frac * duration;
      lastSyncAudioTimeRef.current = targetSeconds;
      lastSyncTimestampRef.current = performance.now();
      onSeek(targetSeconds);
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverFraction(null);
    }
  };

  // Ultra-lightweight 60fps RAF loop updating only CSS width property directly on DOM
  useEffect(() => {
    let active = true;

    const tick = () => {
      if (!active) return;

      if (!isDragging && fillRef.current && duration > 0) {
        let curTime = lastSyncAudioTimeRef.current;
        if (isPlaying) {
          const elapsed = ((performance.now() - lastSyncTimestampRef.current) / 1000) * playbackRate;
          curTime = Math.min(duration, lastSyncAudioTimeRef.current + elapsed);
        }
        const percent = Math.max(0, Math.min(100, (curTime / duration) * 100));
        fillRef.current.style.width = `${percent}%`;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [duration, isPlaying, isDragging, playbackRate]);

  return (
    <div
      id="minimal-progress-bar-container"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className="relative w-full py-2.5 -my-2.5 flex items-center cursor-pointer group select-none touch-none"
    >
      {/* Background Track (Translucent singular line) */}
      <div className="w-full bg-white/10 group-hover:bg-white/15 h-[3px] group-hover:h-[4px] rounded-full relative overflow-hidden transition-all duration-150">
        {/* Hover Ghost Fill */}
        {hoverFraction !== null && duration > 0 && (
          <div
            className="absolute top-0 left-0 h-full bg-white/20 rounded-full pointer-events-none transition-opacity duration-150"
            style={{ width: `${hoverFraction * 100}%` }}
          />
        )}

        {/* Active Progress Fill (Singular clean solid line, NO dot on head) */}
        <div
          ref={fillRef}
          className="absolute top-0 left-0 h-full bg-white rounded-full will-change-[width]"
          style={{ width: '0%' }}
        />
      </div>

      {/* Floating Hover Time Badge */}
      {hoverFraction !== null && duration > 0 && (
        <div
          className="absolute -top-7 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#12121a]/95 border border-white/20 text-[10px] font-mono text-white pointer-events-none shadow-2xl backdrop-blur-md whitespace-nowrap z-30 tracking-wider"
          style={{
            left: `${Math.max(2.5, Math.min(97.5, hoverFraction * 100))}%`,
          }}
        >
          {formatTime(hoverFraction * duration)}
        </div>
      )}
    </div>
  );
};
