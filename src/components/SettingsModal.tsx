import React from 'react';
import {
  AppSettings,
  FontFamilyChoice,
  LyricsAlignment,
  LyricFontSize,
  LyricLineHeight,
  LyricFontWeight,
  BackgroundMode,
  MeshPattern,
  MeshSpeedChoice,
  MeshToneChoice,
  Track,
} from '../types';
import {
  X,
  RotateCcw,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  Sparkles,
  Eye,
  Zap,
  Film,
  Link,
  Youtube,
  Wand2,
  Wind,
  CircleDot,
  Radio,
  Sliders,
  Flame,
  Palette,
  SlidersHorizontal,
  Moon,
  Sun,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CURATED_VIDEO_PRESETS, extractYouTubeId, resolveActiveVideoPreset } from '../services/videoService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  currentTrack?: Track | null;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentTrack = null,
  onUpdateSettings,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  const { preset: activeAutoPreset, isOfficialSongVideo } = resolveActiveVideoPreset(settings, currentTrack);
  const isAutoActive = !settings.customVideoUrl && (!settings.videoPreset || settings.videoPreset === 'auto');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-4xl max-h-[88vh] overflow-y-auto bg-[#0d0d12]/95 border border-white/15 rounded-3xl shadow-2xl z-10 flex flex-col no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-white"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#0d0d12]/95 backdrop-blur-md px-7 sm:px-9 py-6 border-b border-white/10 flex items-center justify-between z-20">
            <div>
              <h2 className="text-2xl font-bold font-clash tracking-tight text-white">
                Player Preferences
              </h2>
              <p className="text-xs sm:text-sm text-white/50 font-jakarta mt-1">
                Customize typography, ambient visualizer mesh, and lyrics focus
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                id="reset-settings-btn"
                onClick={onResetDefaults}
                title="Reset to factory defaults"
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-jakarta border border-white/5 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Defaults</span>
              </button>
              <button
                id="close-settings-modal-btn"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Settings Sections with Consistent Spacing & Elegant Hierarchy */}
          <div className="p-7 sm:p-9 space-y-10 sm:space-y-11 font-jakarta">

            {/* 1. TYPOGRAPHY ENGINE */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/8">
                <div className="flex items-center gap-2.5 text-white/90 text-sm font-semibold tracking-wider uppercase font-jakarta">
                  <Type className="w-4 h-4 text-white/70" />
                  <span>Typography Engine</span>
                </div>
                <span className="text-xs text-white/40 font-mono">
                  {settings.fontFamily}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(
                  [
                    { id: 'clash-display' as FontFamilyChoice, name: 'Clash Display', sample: 'Clash Display', style: 'font-clash' },
                    { id: 'cabinet-grotesk' as FontFamilyChoice, name: 'Cabinet Grotesk', sample: 'Cabinet Grotesk', style: 'font-cabinet' },
                    { id: 'syne' as FontFamilyChoice, name: 'Syne Bold', sample: 'Syne Bold', style: 'font-syne' },
                    { id: 'instrument-serif' as FontFamilyChoice, name: 'Instrument Serif', sample: 'Editorial Serif', style: 'font-serif-display' },
                    { id: 'plus-jakarta' as FontFamilyChoice, name: 'Plus Jakarta', sample: 'Jakarta Sans', style: 'font-jakarta' },
                    { id: 'space-grotesk' as FontFamilyChoice, name: 'Space Grotesk', sample: 'Space Grotesk', style: 'font-space' },
                  ] as const
                ).map(font => {
                  const isSelected = settings.fontFamily === font.id;
                  return (
                    <button
                      key={font.id}
                      id={`font-select-${font.id}`}
                      onClick={() => onUpdateSettings({ fontFamily: font.id })}
                      className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-black font-semibold border-white shadow-lg scale-[1.01]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                      }`}
                    >
                      <span className={`text-lg leading-tight mb-1.5 ${font.style}`}>
                        {font.sample}
                      </span>
                      <span className={`text-xs ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                        {font.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2. ALIGNMENT */}
            <section className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/8 text-white/90 text-sm font-semibold tracking-wider uppercase font-jakarta">
                <AlignRight className="w-4 h-4 text-white/70" />
                <span>Lyrics Alignment (Default: Right)</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { id: 'left' as LyricsAlignment, label: 'Left', icon: AlignLeft },
                    { id: 'center' as LyricsAlignment, label: 'Center', icon: AlignCenter },
                    { id: 'right' as LyricsAlignment, label: 'Right', icon: AlignRight },
                  ] as const
                ).map(item => {
                  const Icon = item.icon;
                  const isSelected = settings.alignment === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`align-select-${item.id}`}
                      onClick={() => onUpdateSettings({ alignment: item.id })}
                      className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border text-sm font-jakarta transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-black font-semibold border-white shadow-lg'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3. SIZING, SPACING & INACTIVE FOCUS */}
            <section className="space-y-5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/8 text-white/90 text-sm font-semibold tracking-wider uppercase font-jakarta">
                <Eye className="w-4 h-4 text-white/70" />
                <span>Lyrics Appearance & Inactive Styling</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Font Size */}
                <div className="space-y-2">
                  <label className="text-xs text-white/60 font-jakarta font-medium">Active Font Size</label>
                  <select
                    id="settings-font-size"
                    value={settings.fontSize}
                    onChange={e => onUpdateSettings({ fontSize: e.target.value as LyricFontSize })}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/40 cursor-pointer"
                  >
                    <option value="sm" className="bg-[#121218]">Small</option>
                    <option value="base" className="bg-[#121218]">Base</option>
                    <option value="lg" className="bg-[#121218]">Large</option>
                    <option value="xl" className="bg-[#121218]">Extra Large (Default)</option>
                    <option value="2xl" className="bg-[#121218]">Massive (2XL)</option>
                    <option value="3xl" className="bg-[#121218]">Colossal (3XL)</option>
                  </select>
                </div>

                {/* Line Height */}
                <div className="space-y-2">
                  <label className="text-xs text-white/60 font-jakarta font-medium">Line Spacing</label>
                  <select
                    id="settings-line-height"
                    value={settings.lineHeight}
                    onChange={e => onUpdateSettings({ lineHeight: e.target.value as LyricLineHeight })}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/40 cursor-pointer"
                  >
                    <option value="tight" className="bg-[#121218]">Tight</option>
                    <option value="normal" className="bg-[#121218]">Normal (Default)</option>
                    <option value="relaxed" className="bg-[#121218]">Relaxed</option>
                    <option value="loose" className="bg-[#121218]">Loose</option>
                  </select>
                </div>

                {/* Font Weight */}
                <div className="space-y-2">
                  <label className="text-xs text-white/60 font-jakarta font-medium">Font Weight</label>
                  <select
                    id="settings-font-weight"
                    value={settings.fontWeight}
                    onChange={e => onUpdateSettings({ fontWeight: e.target.value as LyricFontWeight })}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/40 cursor-pointer"
                  >
                    <option value="normal" className="bg-[#121218]">Regular</option>
                    <option value="medium" className="bg-[#121218]">Medium</option>
                    <option value="semibold" className="bg-[#121218]">Semibold</option>
                    <option value="bold" className="bg-[#121218]">Bold</option>
                  </select>
                </div>
              </div>

              {/* Inactive Lyrics Blur and Sizing Sliders Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5">
                {/* Inactive Lyric Blur Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-jakarta">
                    <span className="text-white/80 font-medium">Inactive Lyrics Blur Amount</span>
                    <span className="text-white/60 font-mono">
                      {(settings.inactiveBlurAmount ?? 2.5) === 0 ? '0px (Off)' : `${settings.inactiveBlurAmount ?? 2.5}px`}
                    </span>
                  </div>
                  <input
                    id="settings-inactive-blur-slider"
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={settings.inactiveBlurAmount ?? 2.5}
                    onChange={e => onUpdateSettings({ inactiveBlurAmount: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <div className="flex justify-between text-[11px] text-white/40 pt-0.5">
                    <span>Sharp / 0px</span>
                    <span>Subtle / 2.5px</span>
                    <span>Deep Blur / 8px</span>
                  </div>
                </div>

                {/* Inactive Lyric Size Scale Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-jakarta">
                    <span className="text-white/80 font-medium">Inactive Lyrics Size Scale</span>
                    <span className="text-white/60 font-mono">
                      {Math.round((settings.inactiveFontSizeScale ?? 0.85) * 100)}%
                    </span>
                  </div>
                  <input
                    id="settings-inactive-scale-slider"
                    type="range"
                    min="0.6"
                    max="1.0"
                    step="0.05"
                    value={settings.inactiveFontSizeScale ?? 0.85}
                    onChange={e => onUpdateSettings({ inactiveFontSizeScale: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <div className="flex justify-between text-[11px] text-white/40 pt-0.5">
                    <span>Compact (60%)</span>
                    <span>Balanced (85%)</span>
                    <span>Same Size (100%)</span>
                  </div>
                </div>

                {/* Inactive Lyric Opacity */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-jakarta">
                    <span className="text-white/80 font-medium">Inactive Lyrics Opacity</span>
                    <span className="text-white/60 font-mono">{Math.round(settings.inactiveOpacity * 100)}%</span>
                  </div>
                  <input
                    id="settings-opacity-slider"
                    type="range"
                    min="0.1"
                    max="0.6"
                    step="0.05"
                    value={settings.inactiveOpacity}
                    onChange={e => onUpdateSettings({ inactiveOpacity: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>

              {/* Sync Offset */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs font-jakarta">
                  <span className="text-white/70">Lyrics Sync Timing Offset</span>
                  <span className="text-white/50 font-mono">
                    {settings.syncOffsetMs > 0 ? `+${settings.syncOffsetMs}ms` : `${settings.syncOffsetMs}ms`}
                  </span>
                </div>
                <input
                  id="settings-offset-slider"
                  type="range"
                  min="-1500"
                  max="1500"
                  step="100"
                  value={settings.syncOffsetMs}
                  onChange={e => onUpdateSettings({ syncOffsetMs: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] cursor-pointer">
                  <span className="text-xs sm:text-sm text-white/80 font-jakarta">
                    Focus Blur on Inactive Lines
                  </span>
                  <input
                    id="settings-blur-toggle"
                    type="checkbox"
                    checked={settings.blurInactive}
                    onChange={e => onUpdateSettings({ blurInactive: e.target.checked })}
                    className="w-4 h-4 rounded accent-white cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] cursor-pointer">
                  <span className="text-xs sm:text-sm text-white/80 font-jakarta">
                    Active Lyric Scale Highlight
                  </span>
                  <input
                    id="settings-scale-toggle"
                    type="checkbox"
                    checked={settings.activeScale}
                    onChange={e => onUpdateSettings({ activeScale: e.target.checked })}
                    className="w-4 h-4 rounded accent-white cursor-pointer"
                  />
                </label>
              </div>
            </section>

            {/* 4. BACKGROUND ATMOSPHERE & VISUALIZER ENGINE */}
            <section className="space-y-5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/8 text-white/90 text-sm font-semibold tracking-wider uppercase font-jakarta">
                <Layers className="w-4 h-4 text-white/70" />
                <span>Atmosphere & Background Mode</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(
                  [
                    { id: 'mesh' as BackgroundMode, label: 'Animated Mesh', desc: 'Customizable visualizer' },
                    { id: 'video' as BackgroundMode, label: 'Video Canvas', desc: 'Audio-synced loops', icon: Film },
                    { id: 'artwork-glow' as BackgroundMode, label: 'Artwork Glow', desc: 'Soft blurred cover' },
                    { id: 'static-gradient' as BackgroundMode, label: 'Static Gradient', desc: 'Calm harmonic hues' },
                    { id: 'minimal-dark' as BackgroundMode, label: 'Pure Dark', desc: 'Obsidian OLED black' },
                  ] as const
                ).map(mode => {
                  const isSelected = settings.bgMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      id={`bg-mode-select-${mode.id}`}
                      onClick={() => onUpdateSettings({ bgMode: mode.id })}
                      className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white/20 border-white text-white shadow-md'
                          : 'bg-white/[0.03] border-white/8 hover:bg-white/[0.08] text-white/70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        {mode.id === 'video' && <Film className="w-3.5 h-3.5 text-white/80" />}
                        <span className="text-xs font-semibold truncate">{mode.label}</span>
                      </div>
                      <span className="text-[10px] text-white/40 mt-1 line-clamp-2 font-jakarta">{mode.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* DEDICATED MESH VISUALIZER CUSTOMIZATION (When Mesh Mode is Active) */}
              {settings.bgMode === 'mesh' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/8">
                    <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2 font-jakarta">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Visualizer Pattern & Atmosphere Engine
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Ultra-low GPU
                    </span>
                  </div>

                  {/* Pattern Picker: Smoke, Blob, Aurora, Blend, Minimal */}
                  <div className="space-y-2.5">
                    <label className="text-xs text-white/70 font-jakarta font-medium">
                      Mesh Pattern Style
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {(
                        [
                          { id: 'smoke' as MeshPattern, name: 'Smoke Air', desc: 'Curling plumes', icon: Wind },
                          { id: 'blob' as MeshPattern, name: 'Organic Blobs', desc: 'Fluid floating orbs', icon: CircleDot },
                          { id: 'aurora' as MeshPattern, name: 'Aurora Waves', desc: 'Chromatic ribbons', icon: Radio },
                          { id: 'blend' as MeshPattern, name: 'Color Blend', desc: 'Radial morphing', icon: Palette },
                          { id: 'minimal' as MeshPattern, name: 'Obsidian Glow', desc: 'High contrast dark', icon: Flame },
                        ] as const
                      ).map(p => {
                        const isPatternSelected = (settings.meshPattern || 'smoke') === p.id;
                        const Icon = p.icon;
                        return (
                          <button
                            key={p.id}
                            id={`mesh-pattern-${p.id}`}
                            onClick={() => onUpdateSettings({ meshPattern: p.id })}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isPatternSelected
                                ? 'bg-white text-black font-semibold border-white shadow-md'
                                : 'bg-white/[0.03] border-white/8 hover:bg-white/[0.07] text-white/70'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-semibold truncate">{p.name}</span>
                            </div>
                            <p className={`text-[9.5px] truncate font-jakarta ${isPatternSelected ? 'text-black/60' : 'text-white/40'}`}>
                              {p.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mesh Atmosphere Tone & Darkness Selection (Rich Dark Colored Mode) */}
                  <div className="pt-2 border-t border-white/8 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-white/80 font-jakarta font-medium flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-indigo-300" />
                        Atmosphere Tone & Color Mood
                      </label>
                      <span className="text-[11px] text-white/40 font-mono">
                        {settings.meshTone === 'dark'
                          ? 'Dark Jewel-Toned'
                          : settings.meshTone === 'obsidian'
                          ? 'Obsidian Stealth'
                          : settings.meshTone === 'vibrant'
                          ? 'Vivid Saturation'
                          : 'Balanced Studio'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(
                        [
                          {
                            id: 'vibrant' as MeshToneChoice,
                            name: 'Vibrant & Saturated',
                            desc: 'Bright glowing colors',
                            icon: Sun,
                            color: 'text-amber-300',
                          },
                          {
                            id: 'balanced' as MeshToneChoice,
                            name: 'Balanced Studio',
                            desc: 'Harmonic natural tint',
                            icon: Sparkles,
                            color: 'text-indigo-300',
                          },
                          {
                            id: 'dark' as MeshToneChoice,
                            name: 'Dark Colored Mood',
                            desc: 'Deep dark jewel-tones',
                            icon: Moon,
                            color: 'text-purple-300',
                          },
                          {
                            id: 'obsidian' as MeshToneChoice,
                            name: 'Deep Obsidian',
                            desc: 'Ultra-dark stealth OLED',
                            icon: Flame,
                            color: 'text-slate-400',
                          },
                        ] as const
                      ).map(t => {
                        const isToneSelected = (settings.meshTone || 'balanced') === t.id;
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            id={`mesh-tone-${t.id}`}
                            onClick={() => onUpdateSettings({ meshTone: t.id })}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isToneSelected
                                ? 'bg-white text-black font-semibold border-white shadow-md'
                                : 'bg-white/[0.03] border-white/8 hover:bg-white/[0.07] text-white/70'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon className={`w-3.5 h-3.5 ${isToneSelected ? 'text-black' : t.color}`} />
                              <span className="text-[11px] font-semibold truncate">{t.name}</span>
                            </div>
                            <p className={`text-[9.5px] truncate font-jakarta ${isToneSelected ? 'text-black/60' : 'text-white/40'}`}>
                              {t.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Fine-Tuning Darkness Level Slider */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-jakarta">
                        <span className="text-white/70 flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3 h-3 text-white/50" />
                          Mesh Darkness Intensity
                        </span>
                        <span className="text-white/50 font-mono">
                          {Math.round((settings.meshDarkness ?? 0.35) * 100)}% Darkness
                        </span>
                      </div>
                      <input
                        id="mesh-darkness-slider"
                        type="range"
                        min="0.0"
                        max="0.85"
                        step="0.05"
                        value={settings.meshDarkness ?? 0.35}
                        onChange={e => onUpdateSettings({ meshDarkness: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                      <div className="flex justify-between text-[10px] text-white/35 font-jakarta">
                        <span>Vivid & Bright (0%)</span>
                        <span>Balanced (35%)</span>
                        <span>Deep Dark Colored (70%+)</span>
                      </div>
                    </div>
                  </div>

                  {/* Visualizer Sliders (Opacity, Blur, Speed) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                    {/* Opacity Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-jakarta">
                        <span className="text-white/70">Mesh Opacity</span>
                        <span className="text-white/50 font-mono">
                          {Math.round((settings.meshOpacity ?? 0.85) * 100)}%
                        </span>
                      </div>
                      <input
                        id="mesh-opacity-slider"
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={settings.meshOpacity ?? 0.85}
                        onChange={e => onUpdateSettings({ meshOpacity: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>

                    {/* Blur Amount Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-jakarta">
                        <span className="text-white/70">Diffusion Blur</span>
                        <span className="text-white/50 font-mono">
                          {settings.meshBlurAmount ?? 45}px
                        </span>
                      </div>
                      <input
                        id="mesh-blur-slider"
                        type="range"
                        min="10"
                        max="80"
                        step="5"
                        value={settings.meshBlurAmount ?? 45}
                        onChange={e => onUpdateSettings({ meshBlurAmount: parseInt(e.target.value, 10) })}
                        className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>

                    {/* Speed Selector */}
                    <div className="space-y-2">
                      <label className="text-xs text-white/70 font-jakarta block">Animation Speed</label>
                      <select
                        id="mesh-speed-select"
                        value={settings.meshSpeed || 'normal'}
                        onChange={e => onUpdateSettings({ meshSpeed: e.target.value as MeshSpeedChoice })}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/40 cursor-pointer"
                      >
                        <option value="frozen" className="bg-[#121218]">Frozen (0x - Static)</option>
                        <option value="slow" className="bg-[#121218]">Slow (0.45x - Calming)</option>
                        <option value="normal" className="bg-[#121218]">Normal (1.0x - Default)</option>
                        <option value="fast" className="bg-[#121218]">Fast (1.8x - Dynamic)</option>
                      </select>
                    </div>
                  </div>

                  {/* Film Grain / Noise Overlay Card */}
                  <div className="pt-3 border-t border-white/8 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          id="mesh-grain-toggle"
                          type="checkbox"
                          checked={settings.meshNoiseGrain ?? true}
                          onChange={e => onUpdateSettings({ meshNoiseGrain: e.target.checked })}
                          className="w-4 h-4 rounded accent-white cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm text-white/80 font-jakarta">
                          Cinematic Film Noise & Grain Texture
                        </span>
                      </label>
                      <span className="text-[11px] text-white/40 font-mono">
                        {settings.meshNoiseGrain ? `${Math.round((settings.meshGrainOpacity ?? 0.06) * 100)}%` : 'Off'}
                      </span>
                    </div>

                    {settings.meshNoiseGrain && (
                      <div className="space-y-1.5 pl-6 pt-1">
                        <div className="flex justify-between text-[11px] text-white/60 font-jakarta">
                          <span>Grain Intensity</span>
                        </div>
                        <input
                          id="mesh-grain-intensity-slider"
                          type="range"
                          min="0.02"
                          max="0.20"
                          step="0.01"
                          value={settings.meshGrainOpacity ?? 0.06}
                          onChange={e => onUpdateSettings({ meshGrainOpacity: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                        <div className="flex justify-between text-[10px] text-white/35">
                          <span>Subtle (2%)</span>
                          <span>Balanced (6%)</span>
                          <span>Heavy Grain (20%)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Video Presets Selector when Video mode is selected */}
              {settings.bgMode === 'video' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5 mt-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/8">
                    <span className="text-xs sm:text-sm font-semibold text-white/90 font-jakarta flex items-center gap-2">
                      <Film className="w-4 h-4 text-white/70" />
                      Atmospheric Video Presets
                    </span>
                    <span className="text-xs text-white/40 font-jakarta">
                      Auto-synced with playback
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Auto Match Preset Card */}
                    <button
                      id="video-preset-auto"
                      onClick={() => onUpdateSettings({ videoPreset: 'auto', customVideoUrl: '' })}
                      className={`p-4 rounded-xl border text-left transition-all relative col-span-2 sm:col-span-3 cursor-pointer ${
                        isAutoActive
                          ? 'bg-indigo-600/25 border-indigo-400/80 text-white font-medium shadow-lg ring-1 ring-indigo-400/40'
                          : 'bg-white/[0.02] border-white/8 hover:bg-white/[0.06] text-white/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                            Auto Song Music Video & Atmosphere
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-medium border border-indigo-500/40 uppercase tracking-wider">
                          {isOfficialSongVideo ? 'Official Music Video' : 'Smart Auto'}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 font-jakarta leading-relaxed">
                        Searches online for the track's official music video and synchronizes it millisecond-accurate to the playing timestamp.
                      </p>
                      {isAutoActive && activeAutoPreset && (
                        <div className="mt-2.5 pt-2.5 border-t border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300 font-mono">
                          <div className="flex items-center gap-2 truncate max-w-[80%]">
                            {isOfficialSongVideo ? (
                              <Youtube className="w-4 h-4 text-red-400 shrink-0" />
                            ) : (
                              <Wand2 className="w-4 h-4 text-indigo-300 shrink-0" />
                            )}
                            <span className="truncate">
                              {isOfficialSongVideo ? 'Official Video:' : 'Atmosphere:'}{' '}
                              <strong>{activeAutoPreset.name}</strong>
                            </span>
                          </div>
                          {activeAutoPreset.type === 'youtube' && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-mono shrink-0">
                              Synced
                            </span>
                          )}
                        </div>
                      )}
                    </button>

                    {CURATED_VIDEO_PRESETS.map(preset => {
                      const isPresetSelected =
                        !settings.customVideoUrl &&
                        !isAutoActive &&
                        settings.videoPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          id={`video-preset-${preset.id}`}
                          onClick={() => onUpdateSettings({ videoPreset: preset.id, customVideoUrl: '' })}
                          className={`p-3.5 rounded-xl border text-left transition-all relative cursor-pointer ${
                            isPresetSelected
                              ? 'bg-white/20 border-white text-white font-medium shadow-md ring-1 ring-white/30'
                              : 'bg-white/[0.02] border-white/8 hover:bg-white/[0.06] text-white/70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold truncate">{preset.name}</span>
                            {preset.type === 'youtube' ? (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-mono uppercase">
                                <Youtube className="w-2.5 h-2.5" />
                                YT
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono uppercase font-semibold">
                                {preset.badge || 'Fast CDN'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/40 line-clamp-2 font-jakarta leading-tight">
                            {preset.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Video URL input */}
                  <div className="pt-3.5 border-t border-white/8 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-white/80 font-jakarta flex items-center gap-2">
                        <Link className="w-3.5 h-3.5 text-white/60" />
                        Custom Video Link (YouTube or Direct Video)
                      </label>
                      {settings.customVideoUrl && (
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-white/80">
                          {extractYouTubeId(settings.customVideoUrl) ? 'YouTube detected' : 'Direct video URL'}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        id="custom-video-url-input"
                        type="url"
                        placeholder="Paste YouTube link (youtube.com/watch?v=...) or MP4 URL"
                        value={settings.customVideoUrl || ''}
                        onChange={e => onUpdateSettings({ customVideoUrl: e.target.value })}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/50 transition-colors pr-16"
                      />
                      {settings.customVideoUrl && (
                        <button
                          type="button"
                          onClick={() => onUpdateSettings({ customVideoUrl: '' })}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] uppercase font-mono px-2.5 py-1 rounded bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </section>

            {/* 5. SYSTEM & PERFORMANCE */}
            <section className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/8 text-white/90 text-sm font-semibold tracking-wider uppercase font-jakarta">
                <Zap className="w-4 h-4 text-white/70" />
                <span>Performance & Motion Controls</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] cursor-pointer">
                  <div>
                    <span className="text-xs sm:text-sm text-white/80 font-jakarta block font-medium">
                      Auto-Slide Controls on Idle
                    </span>
                    <span className="text-[11px] text-white/40 font-jakarta mt-0.5 block">
                      Completely slides down bottom player bar when mouse stops
                    </span>
                  </div>
                  <input
                    id="settings-idle-toggle"
                    type="checkbox"
                    checked={settings.hideControlsOnIdle}
                    onChange={e => onUpdateSettings({ hideControlsOnIdle: e.target.checked })}
                    className="w-4 h-4 rounded accent-white cursor-pointer ml-3"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] cursor-pointer">
                  <div>
                    <span className="text-xs sm:text-sm text-white/80 font-jakarta block font-medium">
                      Reduce Motion (Low GPU mode)
                    </span>
                    <span className="text-[11px] text-white/40 font-jakarta mt-0.5 block">
                      Lowers framerate & dynamic background physics
                    </span>
                  </div>
                  <input
                    id="settings-motion-toggle"
                    type="checkbox"
                    checked={settings.reduceMotion}
                    onChange={e => onUpdateSettings({ reduceMotion: e.target.checked })}
                    className="w-4 h-4 rounded accent-white cursor-pointer ml-3"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] cursor-pointer">
                  <div>
                    <span className="text-xs sm:text-sm text-white/80 font-jakarta block font-medium">
                      Auto-Fetch Song Video
                    </span>
                    <span className="text-[11px] text-white/40 font-jakarta mt-0.5 block">
                      Search online for official music video
                    </span>
                  </div>
                  <input
                    id="settings-auto-video-toggle"
                    type="checkbox"
                    checked={settings.autoFetchSongVideo ?? true}
                    onChange={e => onUpdateSettings({ autoFetchSongVideo: e.target.checked })}
                    className="w-4 h-4 rounded accent-white cursor-pointer ml-3"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] cursor-pointer">
                  <div>
                    <span className="text-xs sm:text-sm text-white/80 font-jakarta block font-medium">
                      Auto-Fetch Synced Lyrics
                    </span>
                    <span className="text-[11px] text-white/40 font-jakarta mt-0.5 block">
                      Automatically queries LRCLIB for lyrics
                    </span>
                  </div>
                  <input
                    id="settings-auto-lyrics-toggle"
                    type="checkbox"
                    checked={settings.autoFetchLyrics ?? true}
                    onChange={e => onUpdateSettings({ autoFetchLyrics: e.target.checked })}
                    className="w-4 h-4 rounded accent-white cursor-pointer ml-3"
                  />
                </label>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
