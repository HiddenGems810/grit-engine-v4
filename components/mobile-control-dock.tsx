'use client';

import { AntiAiRepairPanel } from '@/components/anti-ai-repair-panel';
import { ControlSlider } from '@/components/control-slider';
import type { AntiAiRepairControlKey, AntiAiRepairModeId, AntiAiRepairSettings } from '@/lib/anti-ai-repair';
import type { Preset } from '@/lib/presets';

type MobileControlDockProps = {
  filteredPresets: Preset[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  applyPreset: (preset: Preset) => void;
  activePresetName: string | null;
  presetIntensity: number;
  setPresetIntensity: (value: number) => void;
  clearActivePreset: () => void;
  antiAiRepairMode: AntiAiRepairModeId | null;
  antiAiRepairSettings: AntiAiRepairSettings;
  applyAntiAiRepairMode: (mode: AntiAiRepairModeId) => void;
  resetAntiAiRepairMode: () => void;
  updateAntiAiRepairSetting: (key: AntiAiRepairControlKey, value: number) => void;
  saturation: number;
  setSaturation: (value: number) => void;
  shadowCrush: number;
  setShadowCrush: (value: number) => void;
  highlights: number;
  setHighlights: (value: number) => void;
  clarity: number;
  setClarity: (value: number) => void;
  skinPolish: number;
  setSkinPolish: (value: number) => void;
};

type QuickSliderProps = {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};

function QuickSlider({ label, min, max, value, onChange }: QuickSliderProps) {
  return (
    <ControlSlider
      label={label}
      ariaLabel={`Mobile ${label}`}
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      accentClass="text-[#aaa49a]"
      inputClassName="bg-[#101010] border border-[#444]"
    />
  );
}

export function MobileControlDock({
  filteredPresets,
  searchTerm,
  setSearchTerm,
  applyPreset,
  activePresetName,
  presetIntensity,
  setPresetIntensity,
  clearActivePreset,
  antiAiRepairMode,
  antiAiRepairSettings,
  applyAntiAiRepairMode,
  resetAntiAiRepairMode,
  updateAntiAiRepairSetting,
  saturation,
  setSaturation,
  shadowCrush,
  setShadowCrush,
  highlights,
  setHighlights,
  clarity,
  setClarity,
  skinPolish,
  setSkinPolish
}: MobileControlDockProps) {
  return (
    <div className="md:hidden border-t border-[#333] bg-[#171717] px-3 py-2">
      <div className="grid grid-cols-2 gap-2">
        <details className="rounded-[4px] border border-[#333] bg-[#202020] open:col-span-2">
          <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f1ece2] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">
            Anti-AI
          </summary>
          <div className="border-t border-[#333] p-3">
            <AntiAiRepairPanel
              compact
              activeMode={antiAiRepairMode}
              settings={antiAiRepairSettings}
              applyMode={applyAntiAiRepairMode}
              resetMode={resetAntiAiRepairMode}
              updateSetting={updateAntiAiRepairSetting}
            />
          </div>
        </details>

        <details className="rounded-[4px] border border-[#333] bg-[#202020] open:col-span-2">
          <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f1ece2] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">
            Specifications
          </summary>
          <div className="border-t border-[#333] p-3">
            {activePresetName && (
              <div className="mb-3 rounded-[4px] border border-[#4a3820] bg-[#17130d] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-[9px] uppercase tracking-[0.18em] text-[#d6a13a]">Active Preset</span>
                    <span className="mt-1 block truncate text-[12px] font-semibold text-[#f1ece2]">{activePresetName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearActivePreset}
                    className="rounded-[3px] border border-[#5a4823] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-[#d7a54f] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
                  >
                    Reset
                  </button>
                </div>
                <QuickSlider label="Preset Intensity" min={0} max={100} value={presetIntensity} onChange={setPresetIntensity} />
              </div>
            )}
            <input
              type="text"
              placeholder="Search specification presets..."
              className="mb-2 w-full rounded-[3px] border border-[#444] bg-[#141414] px-3 py-2 text-[12px] text-white placeholder-[#666] focus:border-[#e8a82d] focus:outline-none"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <div className="flex max-h-[180px] flex-col gap-1.5 overflow-y-auto">
              {filteredPresets.slice(0, 18).map((preset) => (
                <button
                  key={`mobile-${preset.id}`}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-[3px] border border-[#333] bg-[#141414] px-3 py-2 text-left text-[11px] text-[#d8d1c5] hover:border-[#e8a82d] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
                  title={preset.description}
                >
                  <span className="block truncate font-semibold">{preset.name}</span>
                  <span className="mt-0.5 block truncate text-[9px] uppercase tracking-[0.12em] text-[#8d877d]">{preset.category}</span>
                </button>
              ))}
            </div>
          </div>
        </details>

        <details className="rounded-[4px] border border-[#333] bg-[#202020] open:col-span-2">
          <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f1ece2] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">
            Tone & Color
          </summary>
          <div className="grid gap-3 border-t border-[#333] p-3">
            <QuickSlider label="Saturation" min={0} max={300} value={saturation} onChange={setSaturation} />
            <QuickSlider label="Black Point" min={0} max={150} value={shadowCrush} onChange={setShadowCrush} />
            <QuickSlider label="Highlights" min={0} max={200} value={highlights} onChange={setHighlights} />
            <QuickSlider label="Clarity" min={0} max={100} value={clarity} onChange={setClarity} />
            <QuickSlider label="Skin Polish" min={0} max={42} value={skinPolish} onChange={setSkinPolish} />
          </div>
        </details>
      </div>
    </div>
  );
}
