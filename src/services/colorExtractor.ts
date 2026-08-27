/**
 * Dynamic color extraction and palette generation from artwork
 */

export interface ExtractedPalette {
  primary: string;
  secondary: string;
  accent: string;
  deep: string;
}

// Pre-crafted aesthetic harmonic presets for fallbacks
export const FALLBACK_PALETTES: ExtractedPalette[] = [
  {
    primary: '#6366f1', // Vibrant Indigo
    secondary: '#a855f7', // Vivid Purple
    accent: '#ec4899', // Pink Neon
    deep: '#030712', // Obsidian
  },
  {
    primary: '#3b82f6', // Electric Blue
    secondary: '#1d4ed8', // Royal Deep Blue
    accent: '#06b6d4', // Cyan Glow
    deep: '#030712',
  },
  {
    primary: '#e11d48', // Crimson Rose
    secondary: '#9333ea', // Purple Glow
    accent: '#f43f5e', // Coral Pink
    deep: '#050203',
  },
  {
    primary: '#059669', // Emerald
    secondary: '#0d9488', // Teal
    accent: '#10b981', // Mint Glow
    deep: '#02100a',
  },
  {
    primary: '#d97706', // Sunset Amber
    secondary: '#db2777', // Magenta
    accent: '#f59e0b', // Glowing Gold
    deep: '#0c0704',
  },
  {
    primary: '#8b5cf6', // Electric Violet
    secondary: '#ec4899', // Hot Pink
    accent: '#38bdf8', // Sky Blue
    deep: '#030308',
  },
];

/**
 * Generates an aesthetic palette from a string hash
 */
export function getPaletteFromString(seed: string): ExtractedPalette {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FALLBACK_PALETTES.length;
  return FALLBACK_PALETTES[index];
}

/**
 * Extracts dominant colors from an image URL using canvas pixel analysis
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ExtractedPalette> {
  return new Promise(resolve => {
    if (!imageUrl) {
      resolve(FALLBACK_PALETTES[0]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    const timeout = setTimeout(() => {
      resolve(getPaletteFromString(imageUrl));
    }, 1500);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(getPaletteFromString(imageUrl));
          return;
        }

        // Downsample for fast, smooth processing
        const sampleSize = 64;
        canvas.width = sampleSize;
        canvas.height = sampleSize;

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imageData.data;

        // Sample pixels and score them by saturation & vibrance
        const colorBuckets: { r: number; g: number; b: number; count: number; sat: number; brightness: number }[] = [];

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 128) continue; // Ignore transparent pixels

          // Calculate HSL
          const max = Math.max(r, g, b) / 255;
          const min = Math.min(r, g, b) / 255;
          const brightness = (max + min) / 2;
          const d = max - min;
          const sat = max === 0 ? 0 : d / max;

          // Ignore extreme darks or blown-out whites for dominant color picking
          if (brightness < 0.1 || brightness > 0.92) continue;

          colorBuckets.push({ r, g, b, count: 1, sat, brightness });
        }

        if (colorBuckets.length === 0) {
          resolve(getPaletteFromString(imageUrl));
          return;
        }

        // Sort by saturation and vibrance
        colorBuckets.sort((a, b) => (b.sat * 1.5 + b.brightness * 0.5) - (a.sat * 1.5 + a.brightness * 0.5));

        const primaryPixel = colorBuckets[0] || { r: 99, g: 102, b: 241 };
        // Find distinct second color (distance > 70 in RGB space)
        let secondaryPixel = colorBuckets.find(
          c => Math.hypot(c.r - primaryPixel.r, c.g - primaryPixel.g, c.b - primaryPixel.b) > 70
        ) || colorBuckets[Math.floor(colorBuckets.length / 3)] || primaryPixel;

        let accentPixel = colorBuckets.find(
          c =>
            Math.hypot(c.r - primaryPixel.r, c.g - primaryPixel.g, c.b - primaryPixel.b) > 80 &&
            Math.hypot(c.r - secondaryPixel.r, c.g - secondaryPixel.g, c.b - secondaryPixel.b) > 60
        ) || colorBuckets[Math.floor(colorBuckets.length / 2)] || primaryPixel;

        const toHex = (r: number, g: number, b: number) =>
          `#${[r, g, b].map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')}`;

        // Deep obsidian based on primary hue
        const deepHex = toHex(
          Math.floor(primaryPixel.r * 0.06),
          Math.floor(primaryPixel.g * 0.06),
          Math.floor(primaryPixel.b * 0.06)
        );

        resolve({
          primary: toHex(primaryPixel.r, primaryPixel.g, primaryPixel.b),
          secondary: toHex(secondaryPixel.r, secondaryPixel.g, secondaryPixel.b),
          accent: toHex(accentPixel.r, accentPixel.g, accentPixel.b),
          deep: deepHex,
        });
      } catch (err) {
        console.warn('Canvas color extraction error, using fallback palette:', err);
        resolve(getPaletteFromString(imageUrl));
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(getPaletteFromString(imageUrl));
    };

    img.src = imageUrl;
  });
}
