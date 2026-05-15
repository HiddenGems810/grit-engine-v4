export type UpscaleModePreset = 'balanced' | 'edge-fidelity' | 'natural' | 'soft';
export type UpscaleContentProfile = 'photo-general' | 'portrait' | 'graphic' | 'print';
export type UpscaleTuningPreset = 'portrait-clean' | 'graphic-crisp' | 'print-safe';

export interface UpscaleSettings {
  enabled: boolean;
  scaleFactor: number;
  modePreset: UpscaleModePreset;
  contentProfile: UpscaleContentProfile;
  detailRecovery: number;
  edgeProtection: number;
  antiHalo: number;
}

export interface ResolvedUpscaleSettings extends UpscaleSettings {
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
  detailStrength: number;
  edgeStrength: number;
  antiRingStrength: number;
  actualScaleX: number;
  actualScaleY: number;
  useWorker: boolean;
  useTiling: boolean;
  tileSize: number;
  tileOverlap: number;
}

export interface UpscaleModeDescriptor {
  id: UpscaleModePreset;
  label: string;
  description: string;
  detailBias: number;
  edgeBias: number;
  antiHaloBias: number;
}

export interface UpscaleContentProfileDescriptor {
  id: UpscaleContentProfile;
  label: string;
  description: string;
  detailBias: number;
  edgeBias: number;
  antiHaloBias: number;
}

export interface UpscaleTuningPresetDescriptor {
  id: UpscaleTuningPreset;
  label: string;
  description: string;
  modePreset: UpscaleModePreset;
  contentProfile: UpscaleContentProfile;
  detailRecovery: number;
  edgeProtection: number;
  antiHalo: number;
}
