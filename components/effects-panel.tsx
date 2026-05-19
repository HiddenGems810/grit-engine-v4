'use client';

import { Camera, ChevronDown, RefreshCw } from 'lucide-react';
import { ControlSlider } from '@/components/control-slider';
import {
  DISPOSABLE_FLASH_PRESETS,
  EFFECT_FAMILIES,
  getEffectFamily,
  getEffectPreset
} from '@/lib/effects/effect-registry';
import type { DisposableFlashSettings, FormatEffectFamilySelection } from '@/lib/effects/effect-types';

type DisposableFlashNumericKey = Exclude<keyof DisposableFlashSettings, 'dateStamp' | 'printFrame'>;

const DISPOSABLE_CONTROLS: Array<{
  key: DisposableFlashNumericKey;
  label: string;
  description: string;
}> = [
  { key: 'flashStrength', label: 'Flash Strength', description: 'Hard direct flash lift centered on face or frame center.' },
  { key: 'flashFalloff', label: 'Flash Falloff', description: 'Controls how quickly the flash burns into the edges.' },
  { key: 'warmLightLeak', label: 'Warm Light Leak', description: 'Procedural amber, orange, and yellow leak pressure.' },
  { key: 'redEdgeBurn', label: 'Red Edge Burn', description: 'Red-orange burn along disposable-camera frame edges.' },
  { key: 'cyanShadowCast', label: 'Cyan Shadow Cast', description: 'Cyan/green contamination in darker tones.' },
  { key: 'filmGrain', label: 'Film Grain', description: 'Luma-aware color grain with stronger shadow response.' },
  { key: 'dustAndScratches', label: 'Dust & Scratches', description: 'Deterministic dust, hairline scratches, and scan marks.' },
  { key: 'plasticLensSoftness', label: 'Plastic Lens Softness', description: 'Cheap plastic optics softness without flattening the whole frame.' },
  { key: 'chromaticFringing', label: 'Chromatic Fringing', description: 'Subtle RGB edge split from low-cost lens optics.' },
  { key: 'vignette', label: 'Vignette', description: 'Mild edge falloff and memory-photo corner density.' }
];

type EffectsPanelProps = {
  effectFamily: FormatEffectFamilySelection;
  effectPreset: string;
  effectIntensity: number;
  disposableSettings: DisposableFlashSettings;
  setEffectFamily: (family: FormatEffectFamilySelection) => void;
  applyEffectPreset: (presetId: string) => void;
  setEffectIntensity: (value: number) => void;
  updateDisposableSetting: (key: DisposableFlashNumericKey, value: number) => void;
  setDisposableToggle: (key: 'dateStamp' | 'printFrame', value: boolean) => void;
  resetEffects: () => void;
};

export function EffectsPanel({
  effectFamily,
  effectPreset,
  effectIntensity,
  disposableSettings,
  setEffectFamily,
  applyEffectPreset,
  setEffectIntensity,
  updateDisposableSetting,
  setDisposableToggle,
  resetEffects
}: EffectsPanelProps) {
  const selectedFamily = getEffectFamily(effectFamily);
  const activePreset = getEffectPreset(effectPreset);
  const familyEnabled = selectedFamily?.enabled ?? false;
  const showDisposableControls = effectFamily === 'disposable-flash-film' || effectFamily === 'none';

  return (
    <section className="border-b border-[#333] bg-[#181818]" aria-label="Effects Lab">
      <div className="px-4 py-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f1ece2]">
              <Camera className="h-3.5 w-3.5 text-[#e8a82d]" />
              Premium Effects Lab
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#d6a13a]">
              {activePreset ? activePreset.name : selectedFamily?.name ?? 'No effect active'}
            </div>
          </div>
          {effectFamily !== 'none' && (
            <button
              type="button"
              onClick={resetEffects}
              className="rounded-[3px] border border-[#5a4823] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-[#d7a54f] hover:bg-[#21180d] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
            >
              Reset
            </button>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.16em] text-[#8e877c]">Effect Family</span>
          <div className="relative">
            <select
              aria-label="Effect Family"
              value={effectFamily}
              onChange={(event) => setEffectFamily(event.target.value as FormatEffectFamilySelection)}
              className="w-full appearance-none rounded-[3px] border border-[#444] bg-[#141414] p-2 pr-8 text-[12px] text-white focus:border-[#e8a82d] focus:outline-none"
            >
              <option value="none">No Premium Effect</option>
              {EFFECT_FAMILIES.map((family) => (
                <option key={family.id} value={family.id} disabled={!family.enabled}>
                  {family.name}{family.enabled ? '' : ' (planned)'}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" />
          </div>
        </label>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {DISPOSABLE_FLASH_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyEffectPreset(preset.id)}
              className={`rounded-[4px] border px-2.5 py-2 text-left transition-colors focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${effectPreset === preset.id ? 'border-[#e8a82d] bg-[#231a0d] text-[#f5d993]' : 'border-[#3a3527] bg-[#121212] text-[#d7d1c5] hover:border-[#e8a82d] hover:text-white'}`}
              title={preset.description}
            >
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em]">{preset.name}</span>
              <span className="mt-1 block line-clamp-2 text-[9px] leading-tight text-[#8d877d]">{preset.description}</span>
            </button>
          ))}
        </div>

        {effectFamily !== 'none' && (
          <div className="mt-3">
            <ControlSlider
              label="Effect Intensity"
              min={0}
              max={100}
              value={effectIntensity}
              onChange={setEffectIntensity}
              accentClass="text-[#d6a13a]"
              inputClassName="bg-[#101010] border border-[#5a4823]"
              description="Blends the selected effect recipe without randomizing its deterministic pattern."
            />
          </div>
        )}

        {showDisposableControls && (
          <div className={`mt-3 grid gap-3 ${!familyEnabled && effectFamily !== 'none' ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 rounded-[3px] border border-[#333] bg-[#111] px-2 py-2 text-[10px] uppercase tracking-[0.12em] text-[#c8c2b8]">
                <input
                  type="checkbox"
                  checked={disposableSettings.dateStamp}
                  onChange={(event) => setDisposableToggle('dateStamp', event.target.checked)}
                  className="h-3.5 w-3.5"
                />
                Date Stamp
              </label>
              <label className="flex items-center gap-2 rounded-[3px] border border-[#333] bg-[#111] px-2 py-2 text-[10px] uppercase tracking-[0.12em] text-[#c8c2b8]">
                <input
                  type="checkbox"
                  checked={disposableSettings.printFrame}
                  onChange={(event) => setDisposableToggle('printFrame', event.target.checked)}
                  className="h-3.5 w-3.5"
                />
                Print Frame
              </label>
            </div>

            {DISPOSABLE_CONTROLS.map((control) => (
              <ControlSlider
                key={control.key}
                label={control.label}
                min={0}
                max={100}
                value={disposableSettings[control.key]}
                onChange={(value) => updateDisposableSetting(control.key, value)}
                accentClass="text-[#aaa49a]"
                inputClassName="bg-[#101010] border border-[#444]"
                description={control.description}
              />
            ))}
          </div>
        )}

        {effectFamily !== 'none' && (
          <button
            type="button"
            onClick={resetEffects}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[3px] border border-[#444] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-[#d8d1c5] hover:border-[#e8a82d] hover:text-white focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Effect
          </button>
        )}
      </div>
    </section>
  );
}
