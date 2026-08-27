/**
 * Synthesizes rich, warm, multi-layered ambient/chill music tracks
 * using the Web Audio API and exports to playable Audio Blob URLs.
 * This guarantees 100% immediate, buffer-free playback without external network latency.
 */

export async function generateAmbientTrack(
  theme: 'reverie' | 'midnight' | 'starlight' | 'rain' | 'solitude',
  durationSeconds: number = 180
): Promise<string> {
  const sampleRate = 44100;
  const numFrames = Math.min(sampleRate * durationSeconds, sampleRate * 180); // Cap at 3 mins
  const ctx = new OfflineAudioContext(2, numFrames, sampleRate);

  // Scales and chord progressions (in Hz)
  const progressions: Record<string, number[][]> = {
    reverie: [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ],
    midnight: [
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [246.94, 293.66, 369.99, 440.0], // Bm7b5
      [220.0, 261.63, 329.63, 392.0], // Am7
      [196.0, 246.94, 293.66, 392.0], // G
    ],
    starlight: [
      [329.63, 392.0, 493.88, 587.33], // Em7
      [261.63, 329.63, 392.0, 523.25], // Cmaj7
      [220.0, 277.18, 329.63, 440.0], // A
      [196.0, 246.94, 293.66, 392.0], // G
    ],
    rain: [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
    ],
    solitude: [
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [196.0, 246.94, 293.66, 392.0], // G
    ],
  };

  const chords = progressions[theme] || progressions.reverie;
  const chordDuration = 5.0; // 5 seconds per chord

  // Master Gain & Reverb filter
  const masterFilter = ctx.createBiquadFilter();
  masterFilter.type = 'lowpass';
  masterFilter.frequency.value = 1400;
  masterFilter.connect(ctx.destination);

  // Play chords iteratively across the duration
  let currentTime = 0;
  let chordIndex = 0;

  while (currentTime < durationSeconds) {
    const chord = chords[chordIndex % chords.length];
    const duration = chordDuration;

    // Pad Synth layer
    chord.forEach((freq, noteIdx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = noteIdx === 0 ? 'sine' : noteIdx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * (noteIdx === 0 ? 0.5 : 1), currentTime);

      // Subtle detune for lush analog feel
      osc.detune.setValueAtTime((Math.random() - 0.5) * 12, currentTime);

      // Envelope
      gain.gain.setValueAtTime(0, currentTime);
      gain.gain.linearRampToValueAtTime(0.06 / (chord.length * 0.8), currentTime + 1.2);
      gain.gain.setValueAtTime(0.06 / (chord.length * 0.8), currentTime + duration - 1.2);
      gain.gain.linearRampToValueAtTime(0, currentTime + duration);

      osc.connect(gain);
      gain.connect(masterFilter);

      osc.start(currentTime);
      osc.stop(currentTime + duration);
    });

    // Sub-bass note
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(chord[0] * 0.25, currentTime);

    bassGain.gain.setValueAtTime(0, currentTime);
    bassGain.gain.linearRampToValueAtTime(0.08, currentTime + 0.8);
    bassGain.gain.setValueAtTime(0.08, currentTime + duration - 0.8);
    bassGain.gain.linearRampToValueAtTime(0, currentTime + duration);

    bassOsc.connect(bassGain);
    bassGain.connect(masterFilter);

    bassOsc.start(currentTime);
    bassOsc.stop(currentTime + duration);

    // Subtle Rhodes chime arpeggios
    chord.forEach((freq, i) => {
      const chimeTime = currentTime + (i * 0.6) + (Math.random() * 0.2);
      if (chimeTime < durationSeconds) {
        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();

        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(freq * 2, chimeTime);

        chimeGain.gain.setValueAtTime(0.03, chimeTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, chimeTime + 2.5);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(masterFilter);

        chimeOsc.start(chimeTime);
        chimeOsc.stop(chimeTime + 2.5);
      }
    });

    currentTime += chordDuration;
    chordIndex++;
  }

  // Render to audio buffer
  const renderedBuffer = await ctx.startRendering();
  return audioBufferToWavUrl(renderedBuffer);
}

/**
 * Converts AudioBuffer to a playable WAV Blob URL
 */
function audioBufferToWavUrl(buffer: AudioBuffer): string {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF chunk descriptor
  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');

  // FMT sub-chunk
  writeString('fmt ');
  setUint32(16);
  setUint16(1); // PCM format
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16); // 16-bit

  // data sub-chunk
  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  const blob = new Blob([outBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
