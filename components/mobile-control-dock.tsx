'use client';

import type { Preset } from '@/lib/presets';

type MobileControlDockProps = {
  filteredPresets: Preset[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  applyPreset: (preset: Preset) => void;
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
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[#aaa49a]">
        {label}
        <span className="font-mono text-[#e8d4aa]">{value}</span>
      </span>
      <input
        aria-label={`Mobile ${label}`}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
    </label>
  );
}

export function MobileControlDock({
  filteredPresets,
  searchTerm,
  setSearchTerm,
  applyPreset,
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
            Specifications
          </summary>
          <div className="border-t border-[#333] p-3">
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
