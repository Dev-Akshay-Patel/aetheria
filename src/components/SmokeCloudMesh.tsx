import React, { useRef, useEffect } from 'react';
import { ExtractedPalette } from '../services/colorExtractor';
import { MeshPattern, MeshSpeedChoice, MeshToneChoice } from '../types';

interface SmokeCloudMeshProps {
  colors: ExtractedPalette;
  pattern?: MeshPattern;
  meshTone?: MeshToneChoice;
  meshDarkness?: number; // 0.0 (Vibrant & Bright) to 1.0 (Deep Dark Colored Tone)
  opacity?: number;
  blurAmount?: number;
  speed?: MeshSpeedChoice;
  noiseGrain?: boolean;
  grainOpacity?: number;
  isPlaying?: boolean;
  reduceMotion?: boolean;
  playbackRate?: number;
}

// Convert hex to rgb helper
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = (hex || '').replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 99, g: 102, b: 241 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Color Transformer for Tone & Darkness adjustments (keeps vibrant color hue even when dark)
function adjustColorForMesh(
  rgb: { r: number; g: number; b: number },
  tone: MeshToneChoice | string = 'balanced',
  darkness: number = 0.35
): { r: number; g: number; b: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Adjust saturation and lightness based on selected tone & darkness slider
  if (tone === 'vibrant') {
    s = Math.min(1.0, s * 1.35 + 0.15);
    l = 0.58 * (1 - darkness * 0.35);
  } else if (tone === 'dark') {
    // Richly dark colored (preserves high saturation jewel-tone with lowered lightness)
    s = Math.min(1.0, s * 1.3 + 0.12);
    l = 0.30 * (1 - darkness * 0.5);
  } else if (tone === 'obsidian') {
    s = Math.min(1.0, s * 1.15);
    l = 0.16 * (1 - darkness * 0.55);
  } else {
    // balanced
    s = Math.min(1.0, s * 1.2 + 0.05);
    l = 0.46 * (1 - darkness * 0.4);
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

function computeDeepBackground(
  primaryRgb: { r: number; g: number; b: number },
  tone: MeshToneChoice | string = 'balanced',
  darkness: number = 0.35
): { r: number; g: number; b: number } {
  const factor = tone === 'vibrant' ? 0.08 : tone === 'dark' ? 0.04 : tone === 'obsidian' ? 0.015 : 0.055;
  const darkMul = Math.max(0.2, 1 - darkness * 0.6);
  return {
    r: Math.round(Math.max(4, primaryRgb.r * factor * darkMul)),
    g: Math.round(Math.max(4, primaryRgb.g * factor * darkMul)),
    b: Math.round(Math.max(6, primaryRgb.b * factor * darkMul)),
  };
}

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  growth: number;
  rotation: number;
  vRot: number;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  colorType: 'primary' | 'secondary' | 'accent' | 'blend';
  turbulenceOffset: number;
}

interface AuroraWave {
  yPos: number;
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  colorType: 'primary' | 'secondary' | 'accent';
  thickness: number;
}

export const SmokeCloudMesh: React.FC<SmokeCloudMeshProps> = ({
  colors,
  pattern = 'smoke',
  meshTone = 'balanced',
  meshDarkness = 0.35,
  opacity = 0.85,
  blurAmount = 45,
  speed = 'normal',
  noiseGrain = true,
  grainOpacity = 0.06,
  isPlaying = true,
  reduceMotion = false,
  playbackRate = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Compute processed target colors taking tone and darkness into account
  const rawPrimary = hexToRgb(colors.primary || '#6366f1');
  const rawSecondary = hexToRgb(colors.secondary || '#a855f7');
  const rawAccent = hexToRgb(colors.accent || '#38bdf8');

  const processedPrimary = adjustColorForMesh(rawPrimary, meshTone, meshDarkness);
  const processedSecondary = adjustColorForMesh(rawSecondary, meshTone, meshDarkness);
  const processedAccent = adjustColorForMesh(rawAccent, meshTone, meshDarkness);
  const processedDeep = computeDeepBackground(rawPrimary, meshTone, meshDarkness);

  // Palette colors for smooth interpolation
  const targetColorsRef = useRef({
    primary: processedPrimary,
    secondary: processedSecondary,
    accent: processedAccent,
    deep: processedDeep,
  });

  const curColorsRef = useRef({
    primary: { ...processedPrimary },
    secondary: { ...processedSecondary },
    accent: { ...processedAccent },
    deep: { ...processedDeep },
  });

  useEffect(() => {
    targetColorsRef.current = {
      primary: processedPrimary,
      secondary: processedSecondary,
      accent: processedAccent,
      deep: processedDeep,
    };
  }, [processedPrimary.r, processedPrimary.g, processedPrimary.b, processedSecondary.r, processedSecondary.g, processedSecondary.b, processedAccent.r, processedAccent.g, processedAccent.b, processedDeep.r, processedDeep.g, processedDeep.b]);

  // Speed multiplier computation
  const getSpeedMultiplier = () => {
    if (speed === 'frozen') return 0;
    let base = 1.0;
    if (speed === 'slow') base = 0.45;
    if (speed === 'fast') base = 1.8;
    if (reduceMotion) base *= 0.2;
    if (!isPlaying) base *= 0.35;
    return base * (playbackRate || 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let active = true;
    let lastTime = performance.now();
    let globalTime = 0;

    // Handle canvas dimensions - generous resolution with sub-sampling for silky 60fps
    const handleResize = () => {
      if (!canvas) return;
      const w = Math.min(960, Math.max(480, Math.floor(window.innerWidth * 0.55)));
      const h = Math.min(640, Math.max(320, Math.floor(window.innerHeight * 0.55)));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Initialize Smoke Particles across the ENTIRE widescreen expanse (-20% to 120%)
    const smokeCount = 36;
    const particles: SmokeParticle[] = [];

    const initParticle = (p?: Partial<SmokeParticle>, width = canvas.width, height = canvas.height): SmokeParticle => {
      const types: ('primary' | 'secondary' | 'accent' | 'blend')[] = [
        'primary', 'secondary', 'accent', 'blend', 'primary', 'secondary'
      ];
      const colorType = types[Math.floor(Math.random() * types.length)];
      const maxLife = 8 + Math.random() * 9;
      // Generous size so plumes merge into full-screen fluid clouds with no empty gaps
      const baseSize = width * 0.45 + Math.random() * (width * 0.45);

      return {
        x: p?.x ?? ((Math.random() * 1.4 - 0.2) * width),
        y: p?.y ?? ((Math.random() * 1.4 - 0.2) * height),
        vx: (Math.random() - 0.5) * 14,
        vy: -(12 + Math.random() * 22),
        size: baseSize,
        baseSize,
        growth: 1.1 + Math.random() * 0.7,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.12,
        alpha: 0,
        // High alpha so vibrant artwork colors pop with optical glow
        maxAlpha: 0.55 + Math.random() * 0.35,
        life: p?.life ?? (Math.random() * maxLife),
        maxLife,
        colorType,
        turbulenceOffset: Math.random() * 100,
      };
    };

    for (let i = 0; i < smokeCount; i++) {
      particles.push(initParticle(undefined, canvas.width, canvas.height));
    }

    // Initialize Aurora Waves spanning top to bottom
    const auroraWaves: AuroraWave[] = [
      { yPos: 0.2, amplitude: 45, frequency: 0.004, speed: 0.8, phase: 0, colorType: 'primary', thickness: 180 },
      { yPos: 0.42, amplitude: 55, frequency: 0.0035, speed: -0.6, phase: 2, colorType: 'accent', thickness: 200 },
      { yPos: 0.65, amplitude: 50, frequency: 0.005, speed: 0.7, phase: 4, colorType: 'secondary', thickness: 190 },
      { yPos: 0.85, amplitude: 40, frequency: 0.0045, speed: -0.5, phase: 1, colorType: 'primary', thickness: 170 },
    ];

    const render = (now: number) => {
      if (!active) return;
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const speedMult = getSpeedMultiplier();
      globalTime += dt * speedMult;

      // Smooth color morphing transition
      const colorLerp = Math.min(1, dt * 2.8);
      const lerp = (c: { r: number; g: number; b: number }, t: { r: number; g: number; b: number }) => {
        c.r += (t.r - c.r) * colorLerp;
        c.g += (t.g - c.g) * colorLerp;
        c.b += (t.b - c.b) * colorLerp;
      };
      lerp(curColorsRef.current.primary, targetColorsRef.current.primary);
      lerp(curColorsRef.current.secondary, targetColorsRef.current.secondary);
      lerp(curColorsRef.current.accent, targetColorsRef.current.accent);
      lerp(curColorsRef.current.deep, targetColorsRef.current.deep);

      const w = canvas.width;
      const h = canvas.height;

      // 1. Clear with deep atmospheric background
      const deep = curColorsRef.current.deep;
      ctx.fillStyle = `rgb(${Math.round(deep.r)}, ${Math.round(deep.g)}, ${Math.round(deep.b)})`;
      ctx.fillRect(0, 0, w, h);

      const pCol = curColorsRef.current.primary;
      const sCol = curColorsRef.current.secondary;
      const aCol = curColorsRef.current.accent;

      const getColorRgb = (type: 'primary' | 'secondary' | 'accent' | 'blend') => {
        if (type === 'primary') return pCol;
        if (type === 'secondary') return sCol;
        if (type === 'accent') return aCol;
        return {
          r: (pCol.r + sCol.r) / 2,
          g: (pCol.g + sCol.g) / 2,
          b: (pCol.b + sCol.b) / 2,
        };
      };

      // 2. Pattern-Specific Renderers
      if (pattern === 'minimal') {
        // Minimal Obsidian Glow (Deep Dark with edge and corner halos)
        ctx.globalCompositeOperation = 'screen';
        const grad1 = ctx.createRadialGradient(w * 0.85, h * 0.25, 10, w * 0.85, h * 0.25, w * 0.75);
        grad1.addColorStop(0, `rgba(${pCol.r}, ${pCol.g}, ${pCol.b}, 0.55)`);
        grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, w, h);

        const grad2 = ctx.createRadialGradient(w * 0.15, h * 0.75, 10, w * 0.15, h * 0.75, w * 0.7);
        grad2.addColorStop(0, `rgba(${sCol.r}, ${sCol.g}, ${sCol.b}, 0.45)`);
        grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      } else if (pattern === 'blob') {
        // Fluid Floating Organic Orbs spanning the FULL Screen (All 4 Quadrants + Center)
        ctx.globalCompositeOperation = 'screen';
        const orbs = [
          // Top-Left
          {
            x: w * (0.18 + Math.sin(globalTime * 0.4) * 0.18),
            y: h * (0.22 + Math.cos(globalTime * 0.3) * 0.18),
            r: w * 0.65,
            col: pCol,
            alpha: 0.75,
          },
          // Top-Right
          {
            x: w * (0.82 + Math.cos(globalTime * 0.35) * 0.18),
            y: h * (0.28 + Math.sin(globalTime * 0.45) * 0.18),
            r: w * 0.68,
            col: sCol,
            alpha: 0.7,
          },
          // Bottom-Left
          {
            x: w * (0.22 + Math.sin(globalTime * 0.45 + 2) * 0.18),
            y: h * (0.78 + Math.cos(globalTime * 0.35 + 1) * 0.18),
            r: w * 0.65,
            col: aCol,
            alpha: 0.68,
          },
          // Bottom-Right
          {
            x: w * (0.78 + Math.cos(globalTime * 0.3 + 3) * 0.18),
            y: h * (0.72 + Math.sin(globalTime * 0.4 + 2) * 0.18),
            r: w * 0.7,
            col: pCol,
            alpha: 0.72,
          },
          // Center Flow
          {
            x: w * (0.5 + Math.sin(globalTime * 0.5) * 0.2),
            y: h * (0.5 + Math.cos(globalTime * 0.4) * 0.2),
            r: w * 0.55,
            col: sCol,
            alpha: 0.6,
          },
        ];

        orbs.forEach(orb => {
          const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
          grad.addColorStop(0, `rgba(${Math.round(orb.col.r)}, ${Math.round(orb.col.g)}, ${Math.round(orb.col.b)}, ${orb.alpha})`);
          grad.addColorStop(0.55, `rgba(${Math.round(orb.col.r)}, ${Math.round(orb.col.g)}, ${Math.round(orb.col.b)}, ${orb.alpha * 0.45})`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
      } else if (pattern === 'aurora') {
        // Chromatic Aurora Curtains across full width and height
        ctx.globalCompositeOperation = 'screen';
        auroraWaves.forEach(wave => {
          const col = getColorRgb(wave.colorType);
          const baseWaveY = h * wave.yPos;
          const shift = globalTime * wave.speed;

          ctx.beginPath();
          ctx.moveTo(-20, h + 50);
          for (let x = -20; x <= w + 20; x += 15) {
            const waveY =
              baseWaveY +
              Math.sin(x * wave.frequency + shift + wave.phase) * wave.amplitude +
              Math.cos(x * wave.frequency * 1.5 + shift * 0.8) * (wave.amplitude * 0.4);
            ctx.lineTo(x, waveY);
          }
          ctx.lineTo(w + 20, h + 50);
          ctx.closePath();

          const grad = ctx.createLinearGradient(0, baseWaveY - wave.amplitude, 0, baseWaveY + wave.thickness);
          grad.addColorStop(0, `rgba(${Math.round(col.r)}, ${Math.round(col.g)}, ${Math.round(col.b)}, 0.75)`);
          grad.addColorStop(0.5, `rgba(${Math.round(col.r)}, ${Math.round(col.g)}, ${Math.round(col.b)}, 0.4)`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
      } else if (pattern === 'blend') {
        // Multi-Radial Morphing Blend covering all 4 quadrants + center
        ctx.globalCompositeOperation = 'screen';
        
        // Quad 1 (Top Left)
        const grad1 = ctx.createRadialGradient(
          w * (0.15 + Math.sin(globalTime * 0.3) * 0.15),
          h * (0.2 + Math.cos(globalTime * 0.25) * 0.15),
          0,
          w * 0.25,
          h * 0.25,
          w * 0.8
        );
        grad1.addColorStop(0, `rgba(${pCol.r}, ${pCol.g}, ${pCol.b}, 0.8)`);
        grad1.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, w, h);

        // Quad 2 (Top Right)
        const grad2 = ctx.createRadialGradient(
          w * (0.85 + Math.cos(globalTime * 0.28) * 0.15),
          h * (0.25 + Math.sin(globalTime * 0.32) * 0.15),
          0,
          w * 0.8,
          h * 0.25,
          w * 0.8
        );
        grad2.addColorStop(0, `rgba(${sCol.r}, ${sCol.g}, ${sCol.b}, 0.75)`);
        grad2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, w, h);

        // Quad 3 (Bottom Left)
        const grad3 = ctx.createRadialGradient(
          w * (0.2 + Math.sin(globalTime * 0.35 + 2) * 0.15),
          h * (0.8 + Math.cos(globalTime * 0.28 + 1) * 0.15),
          0,
          w * 0.25,
          h * 0.8,
          w * 0.8
        );
        grad3.addColorStop(0, `rgba(${aCol.r}, ${aCol.g}, ${aCol.b}, 0.75)`);
        grad3.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad3;
        ctx.fillRect(0, 0, w, h);

        // Quad 4 (Bottom Right)
        const grad4 = ctx.createRadialGradient(
          w * (0.8 + Math.cos(globalTime * 0.3 + 3) * 0.15),
          h * (0.75 + Math.sin(globalTime * 0.35 + 2) * 0.15),
          0,
          w * 0.75,
          h * 0.75,
          w * 0.8
        );
        grad4.addColorStop(0, `rgba(${pCol.r}, ${pCol.g}, ${pCol.b}, 0.7)`);
        grad4.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad4;
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = 'source-over';
      } else {
        // Default: Pure Smoky Air Curl Plumes covering the full widescreen canvas
        ctx.globalCompositeOperation = 'screen';

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.life += dt * speedMult;

          if (p.life >= p.maxLife || p.y < -p.size * 0.5) {
            particles[i] = initParticle(
              {
                x: (Math.random() * 1.4 - 0.2) * w,
                y: h + p.size * 0.3,
                life: 0,
              },
              w,
              h
            );
            continue;
          }

          const progress = p.life / p.maxLife;
          const sinSway = Math.sin(globalTime * 0.8 + p.turbulenceOffset) * 28;
          const cosSway = Math.cos(globalTime * 0.5 + p.turbulenceOffset * 1.5) * 20;

          p.x += (p.vx + sinSway * 0.35) * dt * speedMult;
          p.y += (p.vy + cosSway * 0.25) * dt * speedMult;
          p.rotation += p.vRot * dt * speedMult;
          p.size = p.baseSize * (1 + progress * p.growth);

          if (progress < 0.25) {
            p.alpha = (progress / 0.25) * p.maxAlpha;
          } else {
            p.alpha = Math.max(0, 1 - (progress - 0.25) / 0.75) * p.maxAlpha;
          }

          const col = getColorRgb(p.colorType);
          const r = Math.round(col.r);
          const g = Math.round(col.g);
          const b = Math.round(col.b);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.alpha;

          const halfSize = p.size / 2;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, halfSize);
          grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
          grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.5)`);
          grad.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, 0.18)`);
          grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [pattern, meshTone, meshDarkness, speed, isPlaying, reduceMotion, playbackRate]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#050508]">
      {/* 
        Full Screen Oversized Canvas Wrapper:
        - Scaled 125% and positioned -12% on all sides so blur never vignettes inwards at screen borders!
        - Provides 100% full-screen color coverage from edge to edge and corner to corner.
      */}
      <canvas
        ref={canvasRef}
        className="absolute -top-[12%] -left-[12%] w-[124%] h-[124%] object-cover will-change-transform transition-all duration-300"
        style={{
          filter: `blur(${blurAmount}px)`,
          opacity: opacity,
        }}
      />

      {/* Cinematic Film Grain & Noise Overlay */}
      {noiseGrain && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            opacity: grainOpacity,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Subtle Atmospheric Vignette (preserves high-contrast lyrics legibility without blacking out artwork colors) */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#050508]/70 via-[#050508]/20 to-transparent pointer-events-none" />
    </div>
  );
};
