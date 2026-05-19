'use client';

import { Camera, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  ANTI_AI_REPAIR_CONTROL_DEFINITIONS,
  ANTI_AI_REPAIR_PROFILES,
  type AntiAiRepairControlKey,
  type AntiAiRepairModeId,
  type AntiAiRepairSettings
} from '@/lib/anti-ai-repair';

type AntiAiRepairPanelProps = {
  activeMode: AntiAiRepairModeId | null;
  settings: AntiAiRepairSettings;
  applyMode: (mode: AntiAiRepairModeId) => void;
  resetMode: () => void;
  updateSetting: (key: AntiAiRepairControlKey, value: number) => void;
  compact?: boolean;
};

export function AntiAiRepairPanel({
  activeMode,
  settings,
  applyMode,
  resetMode,
  updateSetting,
  compact = false
}: AntiAiRepairPanelProps) {
  const activeProfile = activeMode ? ANTI_AI_REPAIR_PROFILES[activeMode] : null;
  const visibleControls = compact
    ? ANTI_AI_REPAIR_CONTROL_DEFINITIONS.slice(0, 5)
    : ANTI_AI_REPAIR_CONTROL_DEFINITIONS;

  return (
    <section className={`border-b border-[#333] bg-[#181818] ${compact ? 'rounded-[4px] border border-[#333]' : ''}`} aria-label="Anti-AI Slop Repair">
      <div className={compact ? 'p-3' : 'px-4 py-3'}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f1ece2]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#e8a82d]" />
              Anti-AI Slop Repair
            </div>
            {activeProfile && (
              <div className="mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-[#d6a13a]">
                Active: {activeProfile.name}
              </div>
            )}
          </div>
          {activeMode && (
            <button
              type="button"
              onClick={resetMode}
              className="rounded-[3px] border border-[#5a4823] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-[#d7a54f] hover:bg-[#21180d] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
            >
              Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => applyMode('repair')}
            className={`flex items-center justify-center gap-2 rounded-[3px] border px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${activeMode === 'repair' ? 'border-[#e8a82d] bg-[#231a0d] text-[#f5d993]' : 'border-[#5a4823] bg-[#1a1711] text-[#f3e6c4] hover:border-[#e8a82d] hover:text-[#e8a82d]'}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Anti-AI Slop Repair
          </button>
          <button
            type="button"
            onClick={() => applyMode('photographed')}
            className={`flex items-center justify-center gap-2 rounded-[3px] border px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${activeMode === 'photographed' ? 'border-[#e8a82d] bg-[#231a0d] text-[#f5d993]' : 'border-[#444] bg-[#151515] text-[#d7d1c5] hover:border-[#e8a82d] hover:text-white'}`}
          >
            <Camera className="h-3.5 w-3.5" />
            Make It Look Photographed
          </button>
        </div>

        <div className={`mt-3 grid gap-3 ${compact ? '' : 'grid-cols-1'}`}>
          {visibleControls.map((control) => (
            <label key={control.key} className="block" title={control.description}>
              <span className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[#aaa49a]">
                {control.label}
                <span className="font-mono text-[#e8d4aa]">{settings[control.key]}</span>
              </span>
              <input
                aria-label={control.label}
                type="range"
                min="0"
                max="100"
                step="1"
                value={settings[control.key]}
                onChange={(event) => updateSetting(control.key, Number(event.target.value))}
                className="w-full"
              />
            </label>
          ))}
        </div>

        {!compact && (
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {['Skin Safe', 'Local', 'Exported'].map((badge) => (
              <span key={badge} className="rounded-[3px] border border-[#3a3527] bg-[#111] px-1.5 py-1 text-center text-[8px] uppercase tracking-[0.14em] text-[#c4ab73]">
                {badge}
              </span>
            ))}
          </div>
        )}

        {compact && activeMode && (
          <button
            type="button"
            onClick={resetMode}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[3px] border border-[#444] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-[#d8d1c5] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Repair
          </button>
        )}
      </div>
    </section>
  );
}
