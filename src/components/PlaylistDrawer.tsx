import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Track } from '../types';
import { X, Music, Upload, Trash2 } from 'lucide-react';

interface PlaylistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onOpenUpload: () => void;
  onDeleteTrack?: (trackId: string) => void;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  isOpen,
  onClose,
  tracks,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onOpenUpload,
  onDeleteTrack,
}) => {
  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end overflow-hidden select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Drawer Window */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md h-full bg-[#0c0c12]/95 border-l border-white/10 shadow-2xl flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Music className="w-5 h-5 text-white/80" />
              <h2 className="text-lg font-semibold text-white font-clash tracking-tight">
                Tracks & Queue
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="drawer-upload-track-btn"
                onClick={() => {
                  onClose();
                  onOpenUpload();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white font-jakarta transition-all border border-white/10 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>

              <button
                id="close-playlist-drawer-btn"
                onClick={onClose}
                className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Track List */}
          <div className="flex-1 overflow-y-auto subtle-scrollbar p-4 sm:p-6 space-y-2">
            {tracks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-white/50">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Music className="w-6 h-6 text-white/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white/80">No tracks in queue</p>
                  <p className="text-xs text-white/40 font-jakarta max-w-xs">
                    Upload your audio files (MP3, WAV, FLAC, M4A) to start playing.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenUpload();
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs transition-all shadow-md cursor-pointer"
                >
                  Upload Track
                </button>
              </div>
            ) : (
              tracks.map(track => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    id={`playlist-item-${track.id}`}
                    onClick={() => onSelectTrack(track)}
                    className={`group w-full flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-white/15 border-white/30 text-white shadow-lg'
                        : 'bg-white/[0.02] border-white/6 hover:bg-white/[0.07] hover:border-white/15 text-white/70'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Artwork */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/10">
                        {track.coverUrl ? (
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-white/70">
                            ♪
                          </div>
                        )}
                        {isCurrent && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="flex items-end gap-0.5 h-3">
                              <span className="w-0.5 bg-white animate-pulse h-full" />
                              <span className="w-0.5 bg-white animate-pulse h-2/3 delay-75" />
                              <span className="w-0.5 bg-white animate-pulse h-4/5 delay-150" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isCurrent ? 'text-white' : 'text-white/90 group-hover:text-white'
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="text-xs text-white/50 truncate font-jakarta mt-0.5">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    {/* Right: Duration & Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span className="text-xs font-mono text-white/40 tabular-nums">
                        {formatDuration(track.duration)}
                      </span>

                      {onDeleteTrack && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteTrack(track.id);
                          }}
                          title="Remove track"
                          className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Note */}
          <div className="p-4 border-t border-white/10 text-center bg-white/[0.01]">
            <p className="text-[11px] text-white/40 font-jakarta">
              Click any track to switch songs with smooth atmospheric morphing
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
