/**
 * Grit Engine v4 — Camera Simulation Profiles
 *
 * Pure lookup table for camera simulation parameter sets.
 * Extracted from page.tsx lines 2663-2728.
 */

import type { EngineSnapshot } from '../editor-config';

/** Subset of EngineSnapshot fields that a camera profile controls. */
export type CameraProfile = Pick<EngineSnapshot,
  | 'saturation'
  | 'hueShift'
  | 'shadowCrush'
  | 'inkBleed'
  | 'halation'
  | 'chromaOffset'
  | 'grain'
  | 'vignette'
  | 'threshold'
  | 'halftone'
  | 'scanlines'
  | 'monochrome'
>;

/** Known camera simulation IDs. */
export const CAMERA_IDS = [
  'Standard Matrix',
  '1970s Kodachrome (35mm)',
  '1980s VHS Camcorder',
  '1990s Disposable Flash',
  '2000s Early Digital (CCD)'
] as const;

export type CameraId = typeof CAMERA_IDS[number];

const PROFILES: Record<CameraId, CameraProfile> = {
  'Standard Matrix': {
    saturation: 100,
    hueShift: 0,
    shadowCrush: 0,
    inkBleed: 0,
    halation: 0,
    chromaOffset: 0,
    grain: 0,
    vignette: 0,
    threshold: 0,
    halftone: 0,
    scanlines: 0,
    monochrome: false
  },
  '1970s Kodachrome (35mm)': {
    saturation: 135,
    hueShift: 5,
    shadowCrush: 70,
    inkBleed: 8,
    halation: 25,
    chromaOffset: 0,
    grain: 45,
    vignette: 40,
    threshold: 0,
    halftone: 0,
    scanlines: 0,
    monochrome: false
  },
  '1980s VHS Camcorder': {
    saturation: 80,
    hueShift: -10,
    shadowCrush: 40,
    inkBleed: 25,
    halation: 10,
    chromaOffset: 35,
    grain: 60,
    vignette: 20,
    threshold: 0,
    halftone: 0,
    scanlines: 15,
    monochrome: false
  },
  '1990s Disposable Flash': {
    saturation: 110,
    hueShift: -5,
    shadowCrush: 85,
    inkBleed: 12,
    halation: 45,
    chromaOffset: 5,
    grain: 30,
    vignette: 60,
    threshold: 0,
    halftone: 0,
    scanlines: 0,
    monochrome: false
  },
  '2000s Early Digital (CCD)': {
    saturation: 140,
    hueShift: 0,
    shadowCrush: 90,
    inkBleed: 2,
    halation: 5,
    chromaOffset: 10,
    grain: 15,
    vignette: 10,
    threshold: 0,
    halftone: 0,
    scanlines: 0,
    monochrome: false
  }
};

/**
 * Get the camera profile parameters for a given camera ID.
 * Returns the Standard Matrix profile for unknown IDs.
 */
export const getCameraProfile = (cameraId: string): CameraProfile => {
  return PROFILES[cameraId as CameraId] ?? PROFILES['Standard Matrix'];
};
