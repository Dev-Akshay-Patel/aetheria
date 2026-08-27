import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Music, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { parseAudioFile } from '../services/metadataParser';
import { fetchLyricsFromLRCLIB, parseLrc } from '../services/lrcService';
import { Track } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackUploaded: (track: Track) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onTrackUploaded,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    // Validate type
    const validExtensions = /\.(mp3|wav|flac|m4a|ogg|aac)$/i;
    if (!file.name.match(validExtensions) && !file.type.startsWith('audio/')) {
      setErrorMessage('Please upload a supported audio file (MP3, WAV, FLAC, M4A, OGG).');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setStatusMessage('Extracting audio metadata & artwork...');

    try {
      // 1. Parse audio file & ID3 tags
      const track = await parseAudioFile(file);

      // 2. Query LRCLIB for synchronized lyrics automatically
      setStatusMessage(`Searching synchronized lyrics for "${track.title}"...`);
      const lyricsResult = await fetchLyricsFromLRCLIB({
        title: track.title,
        artist: track.artist !== 'Unknown Artist' ? track.artist : '',
        album: track.album !== 'Uploaded Track' ? track.album : '',
        duration: track.duration,
      });

      if (lyricsResult?.syncedLyrics) {
        track.lrcContent = lyricsResult.syncedLyrics;
        setStatusMessage('Synchronized lyrics matched successfully!');
      } else if (lyricsResult?.plainLyrics) {
        track.plainLyrics = lyricsResult.plainLyrics;
        setStatusMessage('Loaded plain lyrics.');
      } else {
        setStatusMessage('Track ready (lyrics search can be retried anytime).');
      }

      // Short delay for visual feedback
      setTimeout(() => {
        setIsProcessing(false);
        onTrackUploaded(track);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Audio upload error:', err);
      setIsProcessing(false);
      setErrorMessage('Failed to process audio file. Please try again.');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#0e0e14]/95 border border-white/12 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-white/10">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white font-clash tracking-tight">
                Upload Your Music
              </h2>
              <p className="text-xs text-white/50 font-jakarta mt-0.5">
                Play your own tracks with auto-synced lyrics & dynamic atmosphere
              </p>
            </div>

            <button
              id="close-upload-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dropzone Container */}
          <div className="py-6 space-y-4">
            <div
              id="audio-upload-dropzone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-white bg-white/15 scale-[1.01]'
                  : 'border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04]'
              } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />

              {isProcessing ? (
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                  <p className="text-sm font-medium text-white font-jakarta">
                    {statusMessage}
                  </p>
                  <p className="text-xs text-white/40 font-jakarta">
                    Matching synchronized lyrics...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10 shadow-lg">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-medium text-white font-jakarta">
                      Drag and drop your audio file here
                    </p>
                    <p className="text-xs text-white/45 mt-1 font-jakarta">
                      or click to browse from your device
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-white/60 mt-2">
                    <span>MP3</span>
                    <span>•</span>
                    <span>WAV</span>
                    <span>•</span>
                    <span>FLAC</span>
                    <span>•</span>
                    <span>M4A</span>
                    <span>•</span>
                    <span>OGG</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error state */}
            {errorMessage && (
              <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl font-jakarta">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-white/40 font-jakarta">
              Audio is processed locally in your browser. No files are uploaded to third-party servers.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
