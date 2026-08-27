import { Track } from '../types';
import { extractColorsFromImage, getPaletteFromString } from './colorExtractor';

/**
 * Creates a unique fallback SVG cover artwork data URL based on track title & artist
 */
export function generateCoverArtSvg(title: string, artist: string, primaryColor: string = '#3b82f6'): string {
  const initials = ((artist && artist !== 'Unknown Artist' ? artist[0] : '') + (title ? title[0] : '')).toUpperCase() || '♪';
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}" />
        <stop offset="100%" stop-color="#09090b" />
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#grad)" />
    <circle cx="200" cy="200" r="140" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
    <circle cx="200" cy="200" r="80" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
    <text x="50%" y="54%" text-anchor="middle" font-family="'Clash Display', -apple-system, sans-serif" font-weight="600" font-size="72" fill="#ffffff" opacity="0.85">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

/**
 * Native ID3v2 & ID3v1 parser to extract Title, Artist, Album, and embedded APIC Artwork
 */
async function parseId3Metadata(file: File): Promise<{
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  coverUrl?: string;
}> {
  return new Promise(resolve => {
    // Read first 512KB for ID3v2 header and frames
    const reader = new FileReader();
    const slice = file.slice(0, 512 * 1024);

    reader.onload = e => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) return resolve({});

        const view = new DataView(buffer);
        const result: { title?: string; artist?: string; album?: string; year?: string; coverUrl?: string } = {};

        // Check for 'ID3' header
        if (
          view.getUint8(0) === 0x49 && // 'I'
          view.getUint8(1) === 0x44 && // 'D'
          view.getUint8(2) === 0x33 // '3'
        ) {
          const version = view.getUint8(3); // e.g. 3 or 4
          // Syncsafe integer for header size
          const tagSize =
            (view.getUint8(6) << 21) |
            (view.getUint8(7) << 14) |
            (view.getUint8(8) << 7) |
            view.getUint8(9);

          let offset = 10;
          const maxOffset = Math.min(offset + tagSize, view.byteLength - 10);

          while (offset < maxOffset) {
            // Frame ID (4 bytes)
            const frameId = String.fromCharCode(
              view.getUint8(offset),
              view.getUint8(offset + 1),
              view.getUint8(offset + 2),
              view.getUint8(offset + 3)
            );

            // If empty byte / padding
            if (frameId.charCodeAt(0) === 0) break;

            let frameSize = 0;
            if (version === 4) {
              // Syncsafe integer in ID3v2.4
              frameSize =
                (view.getUint8(offset + 4) << 21) |
                (view.getUint8(offset + 5) << 14) |
                (view.getUint8(offset + 6) << 7) |
                view.getUint8(offset + 7);
            } else {
              // Standard 32-bit int in ID3v2.3
              frameSize = view.getUint32(offset + 4, false);
            }

            if (frameSize <= 0 || offset + 10 + frameSize > view.byteLength) break;

            const frameDataOffset = offset + 10;

            // Frame types:
            // TIT2: Title, TPE1: Artist, TALB: Album, TYER / TDRC: Year, APIC: Picture
            if (['TIT2', 'TPE1', 'TALB', 'TYER', 'TDRC'].includes(frameId)) {
              const encoding = view.getUint8(frameDataOffset);
              let text = '';
              const textBytes = new Uint8Array(buffer, frameDataOffset + 1, frameSize - 1);

              if (encoding === 0 || encoding === 3) {
                // ISO-8859-1 or UTF-8
                text = new TextDecoder('utf-8').decode(textBytes);
              } else if (encoding === 1 || encoding === 2) {
                // UTF-16
                text = new TextDecoder('utf-16le').decode(textBytes);
              }
              text = text.replace(/\0/g, '').trim();

              if (frameId === 'TIT2' && text) result.title = text;
              if (frameId === 'TPE1' && text) result.artist = text;
              if (frameId === 'TALB' && text) result.album = text;
              if ((frameId === 'TYER' || frameId === 'TDRC') && text) result.year = text.slice(0, 4);
            } else if (frameId === 'APIC' && !result.coverUrl) {
              // Extract picture
              try {
                const encoding = view.getUint8(frameDataOffset);
                let mimeOffset = frameDataOffset + 1;
                let mimeType = '';
                while (mimeOffset < frameDataOffset + frameSize && view.getUint8(mimeOffset) !== 0) {
                  mimeType += String.fromCharCode(view.getUint8(mimeOffset));
                  mimeOffset++;
                }
                mimeOffset++; // Skip null terminator
                const pictureType = view.getUint8(mimeOffset);
                mimeOffset++; // Skip picture type

                // Skip description
                if (encoding === 0 || encoding === 3) {
                  while (mimeOffset < frameDataOffset + frameSize && view.getUint8(mimeOffset) !== 0) {
                    mimeOffset++;
                  }
                  mimeOffset++; // Skip null terminator
                } else {
                  while (mimeOffset < frameDataOffset + frameSize - 1) {
                    if (view.getUint8(mimeOffset) === 0 && view.getUint8(mimeOffset + 1) === 0) {
                      mimeOffset += 2;
                      break;
                    }
                    mimeOffset += 2;
                  }
                }

                if (mimeOffset < frameDataOffset + frameSize) {
                  const imgData = buffer.slice(mimeOffset, frameDataOffset + frameSize);
                  const blob = new Blob([imgData], { type: mimeType || 'image/jpeg' });
                  result.coverUrl = URL.createObjectURL(blob);
                }
              } catch (picErr) {
                console.warn('APIC picture extraction failed:', picErr);
              }
            }

            offset += 10 + frameSize;
          }
        }

        resolve(result);
      } catch (err) {
        console.warn('ID3 parser catch:', err);
        resolve({});
      }
    };

    reader.onerror = () => resolve({});
    reader.readAsArrayBuffer(slice);
  });
}

/**
 * Parses user-uploaded music file and extracts audio metadata & cover art
 */
export async function parseAudioFile(file: File): Promise<Track> {
  const audioUrl = URL.createObjectURL(file);
  const cleanFileName = file.name.replace(/\.[^/.]+$/, '');

  // Default initial values from file name
  let title = cleanFileName;
  let artist = 'Unknown Artist';
  let album = 'Uploaded Track';
  let year = new Date().getFullYear().toString();
  let coverUrl = '';

  // Check if filename contains ' - ' (e.g. "Daft Punk - Get Lucky")
  if (cleanFileName.includes(' - ')) {
    const parts = cleanFileName.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }

  // Extract ID3 tags natively
  try {
    const tags = await parseId3Metadata(file);
    if (tags.title) title = tags.title;
    if (tags.artist) artist = tags.artist;
    if (tags.album) album = tags.album;
    if (tags.year) year = tags.year;
    if (tags.coverUrl) coverUrl = tags.coverUrl;
  } catch (e) {
    console.warn('Failed to parse ID3 tags:', e);
  }

  // Get duration via Audio element
  const duration = await getAudioDuration(audioUrl);

  // Extract dominant palette from cover art or fallback
  let dominantColors;
  if (coverUrl) {
    dominantColors = await extractColorsFromImage(coverUrl);
  } else {
    dominantColors = getPaletteFromString(`${title}-${artist}`);
    coverUrl = generateCoverArtSvg(title, artist, dominantColors.primary);
  }

  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    artist,
    album,
    year,
    duration,
    audioUrl,
    coverUrl,
    dominantColors,
    isUploaded: true,
    fileName: file.name,
  };
}

/**
 * Gets exact duration in seconds from an audio URL
 */
function getAudioDuration(url: string): Promise<number> {
  return new Promise(resolve => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      resolve(audio.duration || 180);
    };
    audio.onerror = () => {
      resolve(180);
    };
    audio.src = url;
  });
}
