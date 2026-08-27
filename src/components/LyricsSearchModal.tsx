import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Music, Check, RefreshCw, FileText, Upload } from 'lucide-react';
import { fetchLyricsFromLRCLIB, parseLrc } from '../services/lrcService';
import { Track } from '../types';

interface LyricsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  onApplyLyrics: (lrcContent: string, plainLyrics?: string) => void;
}

export const LyricsSearchModal: React.FC<LyricsSearchModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  onApplyLyrics,
}) => {
  const [searchTitle, setSearchTitle] = useState(currentTrack?.title || '');
  const [searchArtist, setSearchArtist] = useState(currentTrack?.artist === 'Unknown Artist' ? '' : currentTrack?.artist || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [customLrcText, setCustomLrcText] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'paste'>('search');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTitle && !searchArtist) return;

    setIsSearching(true);
    setStatusMessage('');
    setSearchResults([]);

    try {
      const query = `${searchTitle} ${searchArtist}`.trim();
      const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
          if (data.length === 0) {
            setStatusMessage('No matching lyrics found. Try pasting your LRC file below.');
          }
        }
      } else {
        setStatusMessage('Lyrics service query failed. Please check network connection.');
      }
    } catch (err) {
      console.warn('Search lyrics error:', err);
      setStatusMessage('Error fetching lyrics from service.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: any) => {
    if (result.syncedLyrics) {
      onApplyLyrics(result.syncedLyrics, result.plainLyrics);
      onClose();
    } else if (result.plainLyrics) {
      onApplyLyrics('', result.plainLyrics);
      onClose();
    }
  };

  const handleApplyCustomLrc = () => {
    if (!customLrcText.trim()) return;
    onApplyLyrics(customLrcText.trim());
    onClose();
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      if (content) {
        setCustomLrcText(content);
        setActiveTab('paste');
      }
    };
    reader.readAsText(file);
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
          className="relative w-full max-w-xl max-h-[85vh] bg-[#0e0e14]/95 border border-white/12 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white font-clash tracking-tight">
                Synchronized Lyrics Search
              </h2>
              <p className="text-xs text-white/50 font-jakarta mt-0.5">
                Search LRCLIB or paste custom timestamped LRC lyrics
              </p>
            </div>

            <button
              id="close-lyrics-search-btn"
              onClick={onClose}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex px-6 sm:px-8 pt-4 gap-3 border-b border-white/8">
            <button
              id="tab-search-lyrics"
              onClick={() => setActiveTab('search')}
              className={`pb-3 text-xs sm:text-sm font-medium font-jakarta border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'search'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search Online (LRCLIB)</span>
            </button>

            <button
              id="tab-paste-lyrics"
              onClick={() => setActiveTab('paste')}
              className={`pb-3 text-xs sm:text-sm font-medium font-jakarta border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'paste'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste / Upload .LRC</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto subtle-scrollbar p-6 sm:p-8 space-y-6">
            {activeTab === 'search' ? (
              <div className="space-y-4">
                <form onSubmit={handleSearch} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-white/60 font-jakarta">Track Title</label>
                      <input
                        id="search-track-title-input"
                        type="text"
                        value={searchTitle}
                        onChange={e => setSearchTitle(e.target.value)}
                        placeholder="e.g. Starboy, Bohemian Rhapsody..."
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/60 font-jakarta">Artist Name</label>
                      <input
                        id="search-track-artist-input"
                        type="text"
                        value={searchArtist}
                        onChange={e => setSearchArtist(e.target.value)}
                        placeholder="e.g. The Weeknd, Queen..."
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/40"
                      />
                    </div>
                  </div>

                  <button
                    id="submit-search-lyrics-btn"
                    type="submit"
                    disabled={isSearching}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 active:scale-[0.99] transition-all font-jakarta shadow-lg disabled:opacity-50"
                  >
                    {isSearching ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>{isSearching ? 'Searching database...' : 'Search Lyrics'}</span>
                  </button>
                </form>

                {statusMessage && (
                  <p className="text-xs text-amber-300/80 text-center font-jakarta pt-1">
                    {statusMessage}
                  </p>
                )}

                {/* Results List */}
                <div className="space-y-2 pt-2">
                  {searchResults.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      id={`lyric-result-${idx}`}
                      onClick={() => handleSelectResult(item)}
                      className="w-full p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/8 text-left transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-semibold text-white truncate font-jakarta">
                          {item.trackName || item.name}
                        </p>
                        <p className="text-xs text-white/50 truncate font-jakarta">
                          {item.artistName} {item.albumName ? `• ${item.albumName}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.syncedLyrics ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono border border-emerald-500/30">
                            Synced LRC
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/60 text-[11px] font-mono">
                            Plain text
                          </span>
                        )}
                        <span className="text-xs text-white/40 group-hover:text-white transition-colors">
                          Apply →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white/70 font-jakarta">
                    Paste raw LRC text (with [mm:ss.xx] timestamps):
                  </label>
                  <label className="cursor-pointer text-xs text-white/70 hover:text-white flex items-center gap-1 font-jakarta underline">
                    <Upload className="w-3 h-3" />
                    <span>Upload .lrc file</span>
                    <input
                      type="file"
                      accept=".lrc,.txt"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>

                <textarea
                  id="custom-lrc-textarea"
                  rows={8}
                  value={customLrcText}
                  onChange={e => setCustomLrcText(e.target.value)}
                  placeholder="[00:12.50]First line of lyrics&#10;[00:18.20]Second line of lyrics..."
                  className="w-full bg-white/5 border border-white/15 rounded-2xl p-4 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-white/40 subtle-scrollbar"
                />

                <button
                  id="apply-custom-lrc-btn"
                  onClick={handleApplyCustomLrc}
                  disabled={!customLrcText.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 active:scale-[0.99] transition-all font-jakarta shadow-lg disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Synchronized Lyrics</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
