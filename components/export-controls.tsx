'use client';

import { HelpCircle, RefreshCw } from 'lucide-react';
import {
  UPSCALE_CONTENT_PROFILES,
  UPSCALE_MODE_PRESETS,
  UPSCALE_TUNING_PRESETS
} from '@/lib/upscale/presets';
import type { UpscaleContentProfile, UpscaleModePreset, UpscaleTuningPreset } from '@/lib/upscale/types';
import { CREATOR_EXPORT_ASPECTS, type ExportAspectId, type ExportQualityInfo } from '@/lib/export-quality';
import type { RenderFingerprint } from '@/lib/engine/render-fingerprint';

type ExportControlsProps = {
  imageSrc: string | null;
  workspaceNotice: string | null;
  capabilityNotices: string[];
  upscaleEnabled: boolean;
  setUpscaleEnabled: (value: boolean) => void;
  upscaleScaleFactor: number;
  setUpscaleScaleFactor: (value: number) => void;
  upscaleTuningPreset: UpscaleTuningPreset | 'custom';
  applyUpscalePresetSelection: (preset: UpscaleTuningPreset | 'custom') => void;
  upscaleModePreset: UpscaleModePreset;
  setUpscaleModePreset: (value: UpscaleModePreset) => void;
  upscaleContentProfile: UpscaleContentProfile;
  setUpscaleContentProfile: (value: UpscaleContentProfile) => void;
  upscaleDetailRecovery: number;
  setUpscaleDetailRecovery: (value: number) => void;
  upscaleEdgeProtection: number;
  setUpscaleEdgeProtection: (value: number) => void;
  upscaleAntiHalo: number;
  setUpscaleAntiHalo: (value: number) => void;
  markUpscalePresetCustom: () => void;
  isUpscalePreviewing: boolean;
  upscaleFallbackNotice: boolean;
  resetSpecificationStack: () => void;
  exportImage: (format: 'png' | 'jpeg') => void;
  isProcessing: boolean;
  exportQualityInfo: ExportQualityInfo;
  exportAspect: ExportAspectId;
  setExportAspect: (value: ExportAspectId) => void;
  renderFingerprint: RenderFingerprint | null;
};

export function ExportControls({
  imageSrc,
  workspaceNotice,
  capabilityNotices,
  upscaleEnabled,
  setUpscaleEnabled,
  upscaleScaleFactor,
  setUpscaleScaleFactor,
  upscaleTuningPreset,
  applyUpscalePresetSelection,
  upscaleModePreset,
  setUpscaleModePreset,
  upscaleContentProfile,
  setUpscaleContentProfile,
  upscaleDetailRecovery,
  setUpscaleDetailRecovery,
  upscaleEdgeProtection,
  setUpscaleEdgeProtection,
  upscaleAntiHalo,
  setUpscaleAntiHalo,
  markUpscalePresetCustom,
  isUpscalePreviewing,
  upscaleFallbackNotice,
  resetSpecificationStack,
  exportImage,
  isProcessing,
  exportQualityInfo,
  exportAspect,
  setExportAspect,
  renderFingerprint
}: ExportControlsProps) {
  const formatDimensions = (dimensions: { width: number; height: number }) => (
    dimensions.width > 0 && dimensions.height > 0 ? `${dimensions.width}x${dimensions.height}` : '--'
  );

  return (
    <footer className="hidden lg:flex min-h-[48px] bg-[#222] border-t border-[#111] flex-wrap items-center justify-between gap-3 px-4 py-2 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] z-20">
      <div className="text-[11px] text-[#aaa] font-mono tracking-tight flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        {workspaceNotice ?? 'FORMAT Ready'}
        {capabilityNotices.length > 0 && `• ${capabilityNotices[0]}`}
        {imageSrc && `• Output Target: ${upscaleEnabled ? `${upscaleScaleFactor.toFixed(2).replace(/\.00$/, '')}x raster export` : 'Custom_Raster.jpg'}`}
        {isUpscalePreviewing && '• Upscale previewing'}
        {upscaleFallbackNotice && '• Upscale fallback active'}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-[4px] border border-[#3a3527] bg-[#181818] px-3 py-2 text-[10px] text-[#a9a196] min-w-[250px]" aria-label="Export Quality">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="uppercase tracking-[0.16em] text-[#d6a13a]">Export Quality</span>
            <span className={exportQualityInfo.memoryState === 'safe' ? 'text-[#9fd18b]' : 'text-[#e0b15a]'}>
              {exportQualityInfo.memoryState.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span>Source</span><span className="text-[#e2ddd3]">{formatDimensions(exportQualityInfo.sourceDimensions)}</span>
            <span>Preview</span><span className="text-[#e2ddd3]">{formatDimensions(exportQualityInfo.previewDimensions)}</span>
            <span>Base Export</span><span className="text-[#e2ddd3]">{formatDimensions(exportQualityInfo.baseExportDimensions)}</span>
            <span>Upscaled</span><span className="text-[#e2ddd3]">{formatDimensions(exportQualityInfo.upscaledExportDimensions)}</span>
          </div>
          {exportQualityInfo.fallbackReason && <div className="mt-1 text-[#d6a13a]">{exportQualityInfo.fallbackReason}</div>}
          {renderFingerprint && (
            <div className="mt-1 truncate text-[#767066]" title={`Settings ${renderFingerprint.settingsHash} / Output ${renderFingerprint.outputHash ?? 'pending'}`}>
              fp:{renderFingerprint.settingsHash}{renderFingerprint.outputHash ? `/${renderFingerprint.outputHash}` : ''}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-[11px] text-[#aaa]">
          <span className="uppercase tracking-[0.12em]">Creator Export</span>
          <select value={exportAspect} onChange={(event) => setExportAspect(event.target.value as ExportAspectId)} disabled={!imageSrc} className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[11px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40">
            {CREATOR_EXPORT_ASPECTS.map((aspect) => <option key={aspect.id} value={aspect.id}>{aspect.label}</option>)}
          </select>
        </label>

        <div className="hidden lg:flex items-center gap-3 rounded-[4px] border border-[#3a3527] bg-[#181818] px-3 py-2">
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#d7d1c5]">
            <input type="checkbox" checked={upscaleEnabled} onChange={(event) => setUpscaleEnabled(event.target.checked)} disabled={!imageSrc} className="w-3.5 h-3.5 bg-[#141414] border-[#444] disabled:opacity-40" />
            Enable Upscaler
          </label>
          <label className="flex items-center gap-2 text-[11px] text-[#aaa]">
            <span className="uppercase tracking-[0.12em]">Scale</span>
            <select value={upscaleScaleFactor} onChange={(event) => { markUpscalePresetCustom(); setUpscaleScaleFactor(Number(event.target.value)); }} disabled={!imageSrc || !upscaleEnabled} className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[11px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40">
              {[1.5, 2, 3].map((factor) => <option key={factor} value={factor}>{factor}x</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11px] text-[#aaa]">
            <span className="uppercase tracking-[0.12em]">Preset</span>
            <select value={upscaleTuningPreset} onChange={(event) => applyUpscalePresetSelection(event.target.value as UpscaleTuningPreset | 'custom')} disabled={!imageSrc || !upscaleEnabled} className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[11px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40">
              <option value="custom">Custom</option>
              {UPSCALE_TUNING_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11px] text-[#aaa]">
            <span className="uppercase tracking-[0.12em]">Mode</span>
            <select value={upscaleModePreset} onChange={(event) => { markUpscalePresetCustom(); setUpscaleModePreset(event.target.value as UpscaleModePreset); }} disabled={!imageSrc || !upscaleEnabled} className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[11px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40">
              {UPSCALE_MODE_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11px] text-[#aaa]">
            <span className="uppercase tracking-[0.12em]">Profile</span>
            <select value={upscaleContentProfile} onChange={(event) => { markUpscalePresetCustom(); setUpscaleContentProfile(event.target.value as UpscaleContentProfile); }} disabled={!imageSrc || !upscaleEnabled} className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[11px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40">
              {UPSCALE_CONTENT_PROFILES.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
            </select>
          </label>
          {[
            ['Detail Recovery', upscaleDetailRecovery, setUpscaleDetailRecovery],
            ['Edge Protection', upscaleEdgeProtection, setUpscaleEdgeProtection],
            ['Anti-Halo', upscaleAntiHalo, setUpscaleAntiHalo]
          ].map(([label, value, setter]) => (
            <label key={label as string} className="flex items-center gap-2 text-[11px] text-[#aaa]">
              <span className="uppercase tracking-[0.12em]">{label as string}</span>
              <input type="range" min="0" max="100" value={value as number} onChange={(event) => { markUpscalePresetCustom(); (setter as (next: number) => void)(Number(event.target.value)); }} disabled={!imageSrc || !upscaleEnabled} className="w-20 disabled:opacity-40" />
            </label>
          ))}
        </div>

        <label className="flex items-center gap-2 text-[12px] text-[#aaa] cursor-pointer hover:text-white group transition-colors">
          <input type="checkbox" className="w-3.5 h-3.5 bg-[#141414] border-[#444] group-hover:border-[#e8a82d]" />
          Commit as Smart Filter
          <HelpCircle className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
        </label>

        <div className="flex gap-2">
          <button type="button" onClick={resetSpecificationStack} className="bg-[#333] text-[#ddd] hover:text-white hover:bg-[#444] px-6 py-1.5 text-[13px] rounded-[3px] font-semibold border border-[#444] transition-colors shadow-sm">Reset Stack</button>
          <button type="button" onClick={() => exportImage('jpeg')} disabled={isProcessing || !imageSrc} className="bg-[#e8a82d] text-black hover:bg-[#ffba33] px-10 py-1.5 text-[13px] rounded-[3px] font-bold shadow-[0_0_10px_rgba(232,168,45,0.2)] hover:shadow-[0_0_15px_rgba(232,168,45,0.4)] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 flex items-center justify-center min-w-[140px]">
            {isProcessing ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Rendering...</> : (upscaleEnabled ? 'Render Upscaled Output' : 'Render Output')}
          </button>
        </div>
      </div>
    </footer>
  );
}
