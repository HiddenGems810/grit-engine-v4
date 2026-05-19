'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronRight, Clock, Search, Star, Trash2 } from 'lucide-react';
import type { Preset } from '@/lib/presets';
import { CATEGORY_SHORT_LABELS, CUSTOM_PRESET_CATEGORY, type HistoryEntry } from '@/lib/editor-config';
import { HistoryPanel } from '@/components/history-panel';
import { ControlSlider } from '@/components/control-slider';

type LeftPanelsState = {
  specifications: boolean;
  presets: boolean;
  lastEdits: boolean;
  history: boolean;
};

type LeftSidebarProps = {
  isFocusMode: boolean;
  leftPanels: LeftPanelsState;
  availableCategories: string[];
  filteredPresets: Preset[];
  searchTerm: string;
  activeCategory: string | null;
  imageReady: number;
  previewImageSrc: string | null;
  historyEntries: readonly HistoryEntry[];
  historyIndex: number;
  activePresetId: string | null;
  activePresetName: string | null;
  presetIntensity: number;
  toggleLeftPanel: (key: keyof LeftPanelsState) => void;
  setSearchTerm: (value: string) => void;
  setActiveCategory: (category: string | null) => void;
  applyPreset: (preset: Preset) => void;
  setPresetIntensity: (value: number) => void;
  clearActivePreset: () => void;
  requestDeleteCustomPreset: (preset: Preset) => void;
  jumpToHistory: (index: number) => void;
};

function buildPresetFilterStack(preset: Preset) {
  let blur = (preset.inkBleed / 100) * 3;
  let contrast = 100 + preset.shadowCrush * 1.5 + (preset.midtones ? preset.midtones * 0.2 : 0);
  let brightness = 100 - preset.shadowCrush * 0.3 + (preset.highlights ? preset.highlights * 0.5 : 0);
  let saturation = preset.monochrome ? 0 : preset.saturation;
  let hue = preset.hueShift;

  if (preset.activeLUT === 'clarendon') { contrast += 15; saturation += 10; hue -= 5; brightness += 5; }
  if (preset.activeLUT === 'gingham') { contrast -= 15; saturation -= 10; brightness += 10; hue += 5; }
  if (preset.activeLUT === 'juno') { saturation += 15; contrast += 5; hue -= 5; }
  if (preset.activeLUT === 'lark') { saturation += 10; brightness -= 5; hue += 10; }
  if (preset.activeLUT === 'portra-soft') { saturation += 6; brightness += 8; hue += 4; }
  if (preset.activeLUT === 'editorial-cool') { saturation -= 4; brightness += 4; hue -= 10; }
  if (preset.activeLUT === 'copper-print') { saturation += 8; brightness -= 2; hue += 12; }
  if (preset.activeLUT === 'teal-film') { saturation += 4; hue -= 16; }
  if (preset.activeLUT === 'clean-luxe') { contrast += 8; brightness += 8; saturation += 2; }
  if (preset.activeLUT === 'mocha-editorial') { contrast += 5; brightness -= 3; hue += 8; }

  if (preset.gradientMap === 'thermal') { hue += 180; saturation += 50; }
  else if (preset.gradientMap === 'cyberpunk') { hue += 280; saturation += 30; }
  else if (preset.gradientMap === 'nightvision') { saturation = 0; }
  else if (preset.colorKnockout === 'red') { saturation -= 50; }

  return `blur(${blur}px) contrast(${contrast}%) brightness(${brightness}%) saturate(${saturation}%) hue-rotate(${hue}deg)`;
}

function buildPresetBadges(preset: Preset) {
  const usesMaterial = Boolean(preset.materialProfile && preset.materialProfile !== 'none');
  const usesPrint = Boolean(preset.printProfile && preset.printProfile !== 'none');
  const usesFilm = Boolean(preset.filmProfile && preset.filmProfile !== 'none');
  const usesEffect = Boolean(preset.effectFamily && preset.effectFamily !== 'none');
  const badges = [
    preset.tier === 'hero' ? 'HERO' : null,
    preset.skinSafe ? 'SKIN SAFE' : null,
    usesEffect ? 'EFFECT' : null,
    usesPrint ? 'PRINT' : null,
    usesFilm ? 'FILM' : null,
    usesMaterial ? 'MATERIAL' : null,
    preset.commercialScore >= 88 ? 'COMMERCIAL' : null,
    preset.viralScore >= 88 ? 'VIRAL' : null,
    preset.family === 'product' ? 'PRODUCT' : null,
    preset.family === 'graphic' ? 'GRAPHIC' : null,
    preset.intensity === 'extreme' ? 'EXTREME' : null
  ].filter(Boolean) as string[];

  return Array.from(new Set(badges)).slice(0, 4);
}

export function LeftSidebar({
  isFocusMode,
  leftPanels,
  availableCategories,
  filteredPresets,
  searchTerm,
  activeCategory,
  imageReady,
  previewImageSrc,
  historyEntries,
  historyIndex,
  activePresetId,
  activePresetName,
  presetIntensity,
  toggleLeftPanel,
  setSearchTerm,
  setActiveCategory,
  applyPreset,
  setPresetIntensity,
  clearActivePreset,
  requestDeleteCustomPreset,
  jumpToHistory
}: LeftSidebarProps) {
  if (isFocusMode) {
    return null;
  }

  return (
    <aside className="hidden md:flex md:w-[240px] xl:w-[300px] bg-[#202020] border-r border-[#333] flex-col shrink-0">
      <div className="flex flex-col border-b border-[#333]">
        <button
          type="button"
          className="px-4 py-3 flex justify-between items-center text-[#e0e0e0] border-b border-[#333] cursor-pointer hover:bg-[#2a2a2a] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#e8a82d]"
          onClick={() => toggleLeftPanel('specifications')}
        >
          <span className="font-medium uppercase tracking-[0.18em] text-[10px] text-[#f1ece2]">Specifications</span>
          <span className="text-[#888] flex items-center gap-2">
            {availableCategories.length} {leftPanels.specifications ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        </button>

        <AnimatePresence>
          {leftPanels.specifications && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
              <div className="p-4 flex flex-col gap-3 bg-[#202020]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search specification presets..."
                    className="w-full bg-[#141414] border border-[#444] rounded-sm py-1.5 pl-3 pr-8 text-white focus:outline-none focus:border-[#e8a82d] placeholder-[#666]"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <Search className="w-3.5 h-3.5 text-[#888] absolute right-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#666] uppercase tracking-[0.16em] font-semibold">Index</span>
                  <div className="flex gap-2 text-[11px]">
                    <button type="button" className="flex items-center gap-1.5 px-3 py-1 bg-[#141414] border border-[#444] rounded-full text-[#aaa] hover:text-white hover:border-[#666] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">
                      <Star className="w-3 h-3" /> Starred
                    </button>
                    <button type="button" className="flex items-center gap-1.5 px-3 py-1 bg-[#141414] border border-[#444] rounded-full text-[#aaa] hover:text-white hover:border-[#666] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">
                      <Clock className="w-3 h-3" /> Recent
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className={`text-[10px] uppercase tracking-[0.12em] px-2 py-1 rounded-sm border focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${activeCategory === null ? 'bg-[#e8a82d] border-[#e8a82d] text-black font-semibold' : 'border-transparent text-[#888] hover:text-[#ddd]'}`}
                  >
                    All Specs
                  </button>
                  {availableCategories.map((category) => (
                    <button
                      type="button"
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      title={category}
                      className={`text-[10px] uppercase tracking-[0.12em] px-2 py-1 rounded-sm border focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${activeCategory === category ? 'bg-[#e8a82d] border-[#e8a82d] text-black font-semibold' : 'border-transparent text-[#888] hover:text-[#ddd]'}`}
                    >
                      {CATEGORY_SHORT_LABELS[category] ?? category}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          className="px-4 py-3 flex justify-between items-center text-[#e0e0e0] border-b border-[#333] cursor-pointer bg-[#2a2a2a] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#e8a82d]"
          onClick={() => toggleLeftPanel('presets')}
        >
          <span className="font-semibold text-white uppercase tracking-[0.16em] text-[10px]">Specification Presets</span>
          <span className="text-[#888] flex items-center gap-2">
            {filteredPresets.length} {leftPanels.presets ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {leftPanels.presets && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto bg-[#202020] p-2 hide-scrollbar">
              {activePresetId && activePresetName && (
                <div className="mb-2 rounded-[4px] border border-[#4a3820] bg-[#17130d] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase tracking-[0.18em] text-[#d6a13a]">Active Preset</div>
                      <div className="mt-1 truncate text-[12px] font-semibold text-[#f1ece2]">{activePresetName}</div>
                    </div>
                    <button
                      type="button"
                      onClick={clearActivePreset}
                      className="rounded-[3px] border border-[#5a4823] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-[#d7a54f] hover:bg-[#21180d] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="mt-3">
                    <ControlSlider
                      label="Preset Intensity"
                      min={0}
                      max={100}
                      value={presetIntensity}
                      onChange={setPresetIntensity}
                      accentClass="text-[#9c8f78]"
                      inputClassName="bg-[#101010] border border-[#444]"
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {filteredPresets.map((preset) => {
                  const isCustomPreset = preset.category === CUSTOM_PRESET_CATEGORY;
                  const filterStack = buildPresetFilterStack(preset);
                  const isActivePreset = preset.id === activePresetId;

                  return (
                    <div
                      key={preset.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => applyPreset(preset)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          applyPreset(preset);
                        }
                      }}
                      className={`flex flex-col bg-[#222] hover:bg-[#2a2a2a] border rounded-[4px] transition-all group text-left overflow-hidden shadow-sm cursor-pointer focus:outline-none focus:border-[#e8a82d] ${isActivePreset ? 'border-[#e8a82d] shadow-[0_0_0_1px_rgba(232,168,45,0.35)]' : 'border-[#333] hover:border-[#e8a82d]'}`}
                      title={preset.description}
                    >
                      <div className="w-full aspect-[4/3] bg-[#111] overflow-hidden relative border-b border-[#333]">
                        {isCustomPreset && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              requestDeleteCustomPreset(preset);
                            }}
                            className="absolute top-1.5 right-1.5 z-10 h-7 w-7 rounded-[3px] border border-[#5a3f1f] bg-[#111111]/92 text-[#d7a54f] opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-[#e8a82d] hover:bg-[#1a1a1a] hover:text-[#f0c66f] transition-all flex items-center justify-center"
                            aria-label={`Delete ${preset.name}`}
                            title="Delete custom preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isCustomPreset && (
                          <div className="absolute top-1.5 left-1.5 z-10 rounded-[3px] border border-[#5a4823] bg-[#111111]/92 px-1.5 py-1 text-[8px] uppercase tracking-[0.18em] text-[#d7a54f]">
                            Custom
                          </div>
                        )}
                        {isActivePreset && (
                          <div className="absolute bottom-1.5 left-1.5 z-10 rounded-[3px] border border-[#e8a82d]/60 bg-[#111111]/92 px-1.5 py-1 text-[8px] uppercase tracking-[0.18em] text-[#e8d4aa]">
                            Active
                          </div>
                        )}
                        {imageReady > 0 && previewImageSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewImageSrc}
                            alt={preset.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 origin-center"
                            style={{ filter: filterStack }}
                          />
                        ) : (
                          <div
                            aria-label={preset.name}
                            className="w-full h-full bg-[radial-gradient(circle_at_28%_22%,#c69f5c_0%,transparent_28%),linear-gradient(135deg,#2f2d2a_0%,#161616_48%,#594331_100%)] group-hover:scale-105 transition-transform duration-500 origin-center"
                            style={{ filter: filterStack }}
                          />
                        )}
                        {preset.grain > 0 && (
                          <div className="absolute inset-0 mix-blend-overlay pointer-events-none" style={{ opacity: preset.grain / 100, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                        )}
                        {preset.halation > 0 && (
                          <div className="absolute inset-0 mix-blend-screen pointer-events-none" style={{ opacity: preset.halation / 100, backgroundColor: 'rgba(255,50,0,0.1)' }} />
                        )}
                      </div>
                      <div className="p-2 w-full">
                        <span className="text-[11px] font-semibold text-[#ccc] group-hover:text-white leading-tight truncate block">{preset.name}</span>
                        <span className="text-[9px] text-[#777] uppercase tracking-wider block mt-0.5">{CATEGORY_SHORT_LABELS[preset.category] ?? preset.category} / {preset.intensity}</span>
                        {preset.description && (
                          <span className="text-[9px] text-[#8a847a] leading-tight block mt-1 line-clamp-2">{preset.description}</span>
                        )}
                        {preset.bestFor && preset.bestFor.length > 0 && (
                          <span className="text-[8px] text-[#9c8f78] leading-tight block mt-1 truncate">Best: {preset.bestFor.slice(0, 2).join(', ')}</span>
                        )}
                        {buildPresetBadges(preset).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {buildPresetBadges(preset).map((badge) => (
                              <span key={`${preset.id}-${badge}`} className="text-[8px] uppercase tracking-[0.14em] rounded-[2px] border border-[#4b4027] bg-[#17130d] px-1.5 py-0.5 text-[#d1b170]">
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <HistoryPanel
        entries={historyEntries}
        historyIndex={historyIndex}
        lastEditsOpen={leftPanels.lastEdits}
        historyOpen={leftPanels.history}
        toggleLastEdits={() => toggleLeftPanel('lastEdits')}
        toggleHistory={() => toggleLeftPanel('history')}
        jumpToHistory={jumpToHistory}
      />
    </aside>
  );
}
