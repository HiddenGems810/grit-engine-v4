'use client';

import { useState, useRef, useEffect, useMemo, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Face } from '@tensorflow-models/face-landmarks-detection';
import { 
  Upload, Sliders, Settings, Box, RefreshCw, 
  ChevronDown, ChevronRight, Search, Star, Clock, Image as ImageIcon, 
  ZoomIn, ArrowUpRight, Minimize, FileDown, 
  HelpCircle, Palette, Activity, Aperture, Droplet, Camera,
  Trash2,
  Flame, Map, Sparkles, Eye, Wand2
} from 'lucide-react';
import { PRESETS, PRESET_CATEGORIES, Preset } from '../lib/presets';
import { applyUpscaleTuningPreset, DEFAULT_UPSCALE_SETTINGS, UPSCALE_CONTENT_PROFILES, UPSCALE_MODE_PRESETS, UPSCALE_TUNING_PRESETS } from '@/lib/upscale/presets';
import type { UpscaleContentProfile, UpscaleModePreset, UpscaleSettings, UpscaleTuningPreset } from '@/lib/upscale/types';
import { ControlSlider } from '@/components/control-slider';
import {
  CATEGORY_SHORT_LABELS,
  CUSTOM_PRESET_CATEGORY,
  CUSTOM_PRESET_STORAGE_KEY,
  EngineSnapshot,
  FACE_OVAL_INDICES,
  HistoryEntry,
  LEFT_BROW_CONTOUR_INDICES,
  LEFT_EYE_CONTOUR_INDICES,
  MenuKey,
  PARAM_LABELS,
  PORTRAIT_CONTROL_DEFINITIONS,
  PORTRAIT_CONTROL_LIMITS,
  PORTRAIT_PRESETS,
  PortraitControlKey,
  PortraitGuide,
  PortraitModelState,
  PortraitPoint,
  PortraitPreset,
  RIGHT_BROW_CONTOUR_INDICES,
  RIGHT_EYE_CONTOUR_INDICES,
  TEXTURE_URLS,
  buildPortraitPresetValues,
  buildPresetFromSnapshot,
  clampPortraitControlValue,
  clampSliderValue,
  createNeutralSnapshot,
  smoothStep
} from '@/lib/editor-config';
import {
  clampNumber,
  createSeededRandom,
  buildDeterministicSeed
} from '@/lib/engine/math-utils';
import { adaptPresetToImage, computeAutoTone } from '@/lib/engine/image-analysis';
import { buildPortraitGuide, scalePortraitGuide } from '@/lib/engine/portrait-guide';
import { getCameraProfile } from '@/lib/engine/camera-profiles';
import { HistoryManager } from '@/lib/engine/history';
import { buildPortraitMasks, createFaceMask } from '@/lib/engine/portrait-masks';
import { drawCanvasToPreview } from '@/lib/engine/canvas-utils';
import { generateTextureTile, applyTextureTile } from '@/lib/engine/texture-engine';
import { renderSparkles } from '@/lib/engine/sparkle-engine';
import { renderGrain, renderVignette, renderDustAndScratches } from '@/lib/engine/film-effects';
import {
  applyFaceSlimming, applySkinSmoothing, applySkinPolish, applyBlemishRemoval,
  applyBeautyBoostCanvas, applyGlowAccent, applyExpressionLift, applyJawDefinition,
  applyEyeBrightening, applyFeatureProtection
} from '@/lib/engine/portrait-retouch';
import { applyColorPipeline } from '@/lib/engine/color-pipeline';
import { applyFilmHalation, applyLightLeaks, applyPrismEdgeBlur } from '@/lib/engine/light-effects';
import { applyGradientMap, applyThresholdBitmap, applyHalftone, applyChromaticAberration, applyScanlines } from '@/lib/engine/retro-effects';

type PortraitDetector = {
  estimateFaces: (image: HTMLImageElement, options: { flipHorizontal: boolean }) => Promise<Face[]>;
  dispose: () => void;
};

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIDE = 8192;
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

export default function FormatWorkspace() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
  const [sourceImageSize, setSourceImageSize] = useState({ width: 0, height: 0 });
  
  // -- Core Engine Parameters --
  const [monochrome, setMonochrome] = useState(false);
  const [saturation, setSaturation] = useState(100);
  const [hueShift, setHueShift] = useState(0);
  const [shadowCrush, setShadowCrush] = useState(65);
  const [midtones, setMidtones] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const [activeLUT, setActiveLUT] = useState('none');
  const [inkBleed, setInkBleed] = useState(12);
  const [halation, setHalation] = useState(0);
  const [chromaOffset, setChromaOffset] = useState(0);
  const [grain, setGrain] = useState(40);
  const [threshold, setThreshold] = useState(0);
  // NEW Print & Tech Effects
  const [halftone, setHalftone] = useState(0);
  const [scanlines, setScanlines] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [lightLeak, setLightLeak] = useState(0);
  const [lightLeakStyle, setLightLeakStyle] = useState('amber');
  const [gradientMap, setGradientMap] = useState('none');
  const [dustAndScratches, setDustAndScratches] = useState(0);
  
  // NEW 2026 Viral Effects
  const [sparkles, setSparkles] = useState(0);
  const [camcorderOSD, setCamcorderOSD] = useState(false);
  const [prismBlur, setPrismBlur] = useState(0);

  // Surface Textures & Retouching
  const [skinSmoothing, setSkinSmoothing] = useState(0);
  const [clarity, setClarity] = useState(0); // Ultra detail / Sharpening
  
  // NEW AIRBRUSH STYLE RETOUCHING
  const [glowUp, setGlowUp] = useState(0);
  const [faceSlimming, setFaceSlimming] = useState(0);
  const [blemishRemoval, setBlemishRemoval] = useState(0);
  const [expressionLift, setExpressionLift] = useState(0);
  const [beautyBoost, setBeautyBoost] = useState(0);
  const [ageShift, setAgeShift] = useState(0);
  const [eyeBrightening, setEyeBrightening] = useState(0);
  const [jawDefinition, setJawDefinition] = useState(0);
  const [skinPolish, setSkinPolish] = useState(0);
  const [teethWhitening, setTeethWhitening] = useState(0);
  const [makeupStrength, setMakeupStrength] = useState(0); // Boosts red/pink channels lightly
  const [artifactRemoval, setArtifactRemoval] = useState(0); // Denoise

  const [colorKnockout, setColorKnockout] = useState<'none'|'red'|'green'|'blue'|'warm'>('none');
  const [textureType, setTextureType] = useState<string>('none');
  const [textureIntensity, setTextureIntensity] = useState(50);
  const [textureCache, setTextureCache] = useState<Record<string, HTMLImageElement>>({});

  // -- UI States --
  const [zoomLevel, setZoomLevel] = useState<'FIT' | '1:1'>('FIT');
  const [compareLocked, setCompareLocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>('Vintage Cameras (Pre-1980)');
  const [showOriginal, setShowOriginal] = useState(false);
  const [imageReady, setImageReady] = useState(0); // Trigger to force reliable rendering
  const [activeCamera, setActiveCamera] = useState('Standard Matrix');
  const [upscaleEnabled, setUpscaleEnabled] = useState(DEFAULT_UPSCALE_SETTINGS.enabled);
  const [upscaleScaleFactor, setUpscaleScaleFactor] = useState(DEFAULT_UPSCALE_SETTINGS.scaleFactor);
  const [upscaleTuningPreset, setUpscaleTuningPreset] = useState<UpscaleTuningPreset | 'custom'>('custom');
  const [upscaleModePreset, setUpscaleModePreset] = useState<UpscaleModePreset>(DEFAULT_UPSCALE_SETTINGS.modePreset);
  const [upscaleContentProfile, setUpscaleContentProfile] = useState<UpscaleContentProfile>(DEFAULT_UPSCALE_SETTINGS.contentProfile);
  const [upscaleDetailRecovery, setUpscaleDetailRecovery] = useState(DEFAULT_UPSCALE_SETTINGS.detailRecovery);
  const [upscaleEdgeProtection, setUpscaleEdgeProtection] = useState(DEFAULT_UPSCALE_SETTINGS.edgeProtection);
  const [upscaleAntiHalo, setUpscaleAntiHalo] = useState(DEFAULT_UPSCALE_SETTINGS.antiHalo);
  const [renderRevision, setRenderRevision] = useState(0);
  const [isUpscalePreviewing, setIsUpscalePreviewing] = useState(false);
  const [upscaleFallbackNotice, setUpscaleFallbackNotice] = useState(false);
  const [isSliderInteracting, setIsSliderInteracting] = useState(false);
  
  // -- Toggles --
  const [openPanels, setOpenPanels] = useState({ camera: false, tones: true, retouch: true, optics: false, texture: false, print: false });
  const [leftPanels, setLeftPanels] = useState({ specifications: true, presets: true, lastEdits: false, history: false });
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [customPresets, setCustomPresets] = useState<Preset[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const storedPresets = window.localStorage.getItem(CUSTOM_PRESET_STORAGE_KEY);
      if (!storedPresets) return [];
      const parsedPresets = JSON.parse(storedPresets);
      return Array.isArray(parsedPresets) ? parsedPresets as Preset[] : [];
    } catch {
      return [];
    }
  });
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [pendingDeletePreset, setPendingDeletePreset] = useState<Preset | null>(null);
  const [portraitGuides, setPortraitGuides] = useState<PortraitGuide[]>([]);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState(0);
  const [portraitModelState, setPortraitModelState] = useState<PortraitModelState>('idle');
  const [portraitModelRevision, setPortraitModelRevision] = useState(0);
  const [showFaceTargets, setShowFaceTargets] = useState(true);
  const [portraitSuppressed, setPortraitSuppressed] = useState(false);

  const togglePanel = (key: keyof typeof openPanels) => {
    setOpenPanels(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const toggleLeftPanel = (key: keyof typeof leftPanels) => {
    setLeftPanels(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderSurfaceRef = useRef<HTMLCanvasElement | null>(null);
  const canvasStageRef = useRef<HTMLDivElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const histRef = useRef<HTMLCanvasElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyEntriesRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const snapshotSyncRef = useRef<EngineSnapshot | null>(null);
  const skipHistoryRef = useRef(false);
  const pendingHistoryMetaRef = useRef<{ label: string; detail: string } | null>(null);
  const portraitDetectorRef = useRef<PortraitDetector | null>(null);
  const portraitModelRequestedRef = useRef(false);
  const upscaleRequestRef = useRef(0);
  const historyIdRef = useRef(0);
  const sliderInteractionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ width: 0, height: 0 });

  const allPresets = [...customPresets, ...PRESETS];
  const availableCategories = customPresets.length > 0
    ? [CUSTOM_PRESET_CATEGORY, ...PRESET_CATEGORIES]
    : PRESET_CATEGORIES;
  const portraitGuide = portraitGuides[selectedFaceIndex] ?? portraitGuides[0] ?? null;
  const portraitControlBindings: Record<PortraitControlKey, { value: number; setValue: (value: number) => void }> = {
    skinSmoothing: { value: skinSmoothing, setValue: setSkinSmoothing },
    glowUp: { value: glowUp, setValue: setGlowUp },
    faceSlimming: { value: faceSlimming, setValue: setFaceSlimming },
    blemishRemoval: { value: blemishRemoval, setValue: setBlemishRemoval },
    expressionLift: { value: expressionLift, setValue: setExpressionLift },
    beautyBoost: { value: beautyBoost, setValue: setBeautyBoost },
    ageShift: { value: ageShift, setValue: setAgeShift },
    eyeBrightening: { value: eyeBrightening, setValue: setEyeBrightening },
    jawDefinition: { value: jawDefinition, setValue: setJawDefinition },
    skinPolish: { value: skinPolish, setValue: setSkinPolish },
    teethWhitening: { value: teethWhitening, setValue: setTeethWhitening },
    makeupStrength: { value: makeupStrength, setValue: setMakeupStrength },
    artifactRemoval: { value: artifactRemoval, setValue: setArtifactRemoval }
  };

  // clampNumber, createSeededRandom, buildDeterministicSeed imported from @/lib/engine/math-utils

  const markSliderInteraction = () => {
    if (sliderInteractionTimeoutRef.current) {
      clearTimeout(sliderInteractionTimeoutRef.current);
    }
    setIsSliderInteracting(true);
  };

  const releaseSliderInteraction = (delay = 120) => {
    if (sliderInteractionTimeoutRef.current) {
      clearTimeout(sliderInteractionTimeoutRef.current);
    }
    sliderInteractionTimeoutRef.current = setTimeout(() => {
      setIsSliderInteracting(false);
      sliderInteractionTimeoutRef.current = null;
    }, delay);
  };

  const adaptPresetToCurrentImage = (preset: Preset) => {
    const img = originalImageRef.current;
    if (!img) return preset;
    return adaptPresetToImage(preset, img);
  };

  // createNeutralSnapshot imported from @/lib/editor-config

  const resetUpscaleControls = () => {
    setUpscaleEnabled(DEFAULT_UPSCALE_SETTINGS.enabled);
    setUpscaleScaleFactor(DEFAULT_UPSCALE_SETTINGS.scaleFactor);
    setUpscaleTuningPreset('custom');
    setUpscaleModePreset(DEFAULT_UPSCALE_SETTINGS.modePreset);
    setUpscaleContentProfile(DEFAULT_UPSCALE_SETTINGS.contentProfile);
    setUpscaleDetailRecovery(DEFAULT_UPSCALE_SETTINGS.detailRecovery);
    setUpscaleEdgeProtection(DEFAULT_UPSCALE_SETTINGS.edgeProtection);
    setUpscaleAntiHalo(DEFAULT_UPSCALE_SETTINGS.antiHalo);
    setUpscaleFallbackNotice(false);
    setIsUpscalePreviewing(false);
  };

  const upscaleSettings = useMemo<UpscaleSettings>(() => ({
    enabled: upscaleEnabled,
    scaleFactor: upscaleScaleFactor,
    modePreset: upscaleModePreset,
    contentProfile: upscaleContentProfile,
    detailRecovery: upscaleDetailRecovery,
    edgeProtection: upscaleEdgeProtection,
    antiHalo: upscaleAntiHalo
  }), [upscaleEnabled, upscaleScaleFactor, upscaleModePreset, upscaleContentProfile, upscaleDetailRecovery, upscaleEdgeProtection, upscaleAntiHalo]);

  const previewUpscaleSettings = useMemo<UpscaleSettings>(() => ({
    ...upscaleSettings,
    scaleFactor: Math.min(upscaleSettings.scaleFactor, 2),
    detailRecovery: Math.round(upscaleSettings.detailRecovery * 0.82),
    edgeProtection: Math.min(100, Math.round(upscaleSettings.edgeProtection + 8)),
    antiHalo: Math.min(100, Math.round(upscaleSettings.antiHalo + 10))
  }), [upscaleSettings]);

  const applyUpscalePresetSelection = (presetId: UpscaleTuningPreset | 'custom') => {
    setUpscaleTuningPreset(presetId);
    if (presetId === 'custom') {
      return;
    }

    const nextSettings = applyUpscaleTuningPreset(upscaleSettings, presetId);
    setUpscaleModePreset(nextSettings.modePreset);
    setUpscaleContentProfile(nextSettings.contentProfile);
    setUpscaleDetailRecovery(nextSettings.detailRecovery);
    setUpscaleEdgeProtection(nextSettings.edgeProtection);
    setUpscaleAntiHalo(nextSettings.antiHalo);
  };

  const markUpscalePresetCustom = () => {
    setUpscaleTuningPreset('custom');
  };

  const buildExportCanvas = async () => {
    const renderSurface = renderSurfaceRef.current;
    if (!renderSurface) return null;

    if (!upscaleEnabled) {
      return renderSurface;
    }

    try {
      const { upscaleCanvas } = await import('@/lib/upscale/engine');
      setUpscaleFallbackNotice(false);
      return await upscaleCanvas(renderSurface, upscaleSettings);
    } catch {
      setUpscaleFallbackNotice(true);
      return renderSurface;
    }
  };

  // buildPortraitGuide imported from @/lib/engine/portrait-guide

  const applyPortraitPreset = (preset: PortraitPreset) => {
    pendingHistoryMetaRef.current = {
      label: 'Portrait preset applied',
      detail: preset.name
    };

    const values = buildPortraitPresetValues(preset);
    setBeautyBoost(values.beautyBoost);
    setBlemishRemoval(values.blemishRemoval);
    setFaceSlimming(values.faceSlimming);
    setExpressionLift(values.expressionLift);
    setAgeShift(values.ageShift);
    setEyeBrightening(values.eyeBrightening);
    setJawDefinition(values.jawDefinition);
    setSkinPolish(values.skinPolish);
    setSkinSmoothing(values.skinSmoothing);
    setGlowUp(values.glowUp);
    setTeethWhitening(values.teethWhitening);
    setMakeupStrength(values.makeupStrength);
    setClarity(values.clarity);
    setArtifactRemoval(values.artifactRemoval);
  };

  const createSnapshot = useCallback((): EngineSnapshot => ({
    monochrome,
    saturation,
    hueShift,
    shadowCrush,
    midtones,
    highlights,
    activeLUT,
    inkBleed,
    halation,
    chromaOffset,
    grain,
    threshold,
    halftone,
    scanlines,
    vignette,
    lightLeak,
    lightLeakStyle,
    gradientMap,
    dustAndScratches,
    sparkles,
    camcorderOSD,
    prismBlur,
    skinSmoothing,
    clarity,
    glowUp,
    faceSlimming,
    blemishRemoval,
    expressionLift,
    beautyBoost,
    ageShift,
    eyeBrightening,
    jawDefinition,
    skinPolish,
    teethWhitening,
    makeupStrength,
    artifactRemoval,
    colorKnockout,
    textureType,
    textureIntensity,
    activeCamera
  }), [monochrome, saturation, hueShift, shadowCrush, midtones, highlights, activeLUT, inkBleed, halation, chromaOffset, grain, threshold, halftone, scanlines, vignette, lightLeak, lightLeakStyle, gradientMap, dustAndScratches, sparkles, camcorderOSD, prismBlur, skinSmoothing, clarity, glowUp, faceSlimming, blemishRemoval, expressionLift, beautyBoost, ageShift, eyeBrightening, jawDefinition, skinPolish, teethWhitening, makeupStrength, artifactRemoval, colorKnockout, textureType, textureIntensity, activeCamera]);

  const applySnapshot = (snapshot: EngineSnapshot) => {
    skipHistoryRef.current = true;
    setMonochrome(snapshot.monochrome);
    setSaturation(snapshot.saturation);
    setHueShift(snapshot.hueShift);
    setShadowCrush(snapshot.shadowCrush);
    setMidtones(snapshot.midtones);
    setHighlights(snapshot.highlights);
    setActiveLUT(snapshot.activeLUT);
    setInkBleed(snapshot.inkBleed);
    setHalation(snapshot.halation);
    setChromaOffset(snapshot.chromaOffset);
    setGrain(snapshot.grain);
    setThreshold(snapshot.threshold);
    setHalftone(snapshot.halftone);
    setScanlines(snapshot.scanlines);
    setVignette(snapshot.vignette);
    setLightLeak(snapshot.lightLeak);
    setLightLeakStyle(snapshot.lightLeakStyle);
    setGradientMap(snapshot.gradientMap);
    setDustAndScratches(snapshot.dustAndScratches);
    setSparkles(snapshot.sparkles);
    setCamcorderOSD(snapshot.camcorderOSD);
    setPrismBlur(snapshot.prismBlur);
    setSkinSmoothing(clampPortraitControlValue('skinSmoothing', snapshot.skinSmoothing));
    setClarity(snapshot.clarity);
    setGlowUp(clampPortraitControlValue('glowUp', snapshot.glowUp));
    setFaceSlimming(clampPortraitControlValue('faceSlimming', snapshot.faceSlimming));
    setBlemishRemoval(clampPortraitControlValue('blemishRemoval', snapshot.blemishRemoval));
    setExpressionLift(clampPortraitControlValue('expressionLift', snapshot.expressionLift));
    setBeautyBoost(clampPortraitControlValue('beautyBoost', snapshot.beautyBoost));
    setAgeShift(clampPortraitControlValue('ageShift', snapshot.ageShift));
    setEyeBrightening(clampPortraitControlValue('eyeBrightening', snapshot.eyeBrightening));
    setJawDefinition(clampPortraitControlValue('jawDefinition', snapshot.jawDefinition));
    setSkinPolish(clampPortraitControlValue('skinPolish', snapshot.skinPolish));
    setTeethWhitening(clampPortraitControlValue('teethWhitening', snapshot.teethWhitening));
    setMakeupStrength(clampPortraitControlValue('makeupStrength', snapshot.makeupStrength));
    setArtifactRemoval(clampPortraitControlValue('artifactRemoval', snapshot.artifactRemoval));
    setColorKnockout(snapshot.colorKnockout);
    setTextureType(snapshot.textureType);
    setTextureIntensity(snapshot.textureIntensity);
    setActiveCamera(snapshot.activeCamera);
  };

  const summarizeSnapshotChange = (prev: EngineSnapshot, next: EngineSnapshot) => {
    const changedKeys = (Object.keys(next) as Array<keyof EngineSnapshot>).filter((key) => prev[key] !== next[key]);
    if (changedKeys.length === 0) {
      return null;
    }

    const primaryKey = changedKeys[0];
    const primaryLabel = PARAM_LABELS[primaryKey];
    const detail = changedKeys.length === 1
      ? primaryLabel
      : `${primaryLabel} + ${changedKeys.length - 1} more fields`;

    return {
      label: changedKeys.length === 1 ? 'Parameter adjusted' : 'Stack updated',
      detail
    };
  };

  const commitHistoryEntry = (snapshot: EngineSnapshot, label: string, detail: string) => {
    historyIdRef.current += 1;
    const nextEntry: HistoryEntry = {
      id: historyIdRef.current,
      label,
      detail,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      snapshot
    };

    const nextHistory = [...historyEntriesRef.current.slice(0, historyIndexRef.current + 1), nextEntry].slice(-24);
    historyEntriesRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setHistoryEntries(nextHistory);
    setHistoryIndex(historyIndexRef.current);
  };

  const jumpToHistory = (index: number) => {
    const target = historyEntriesRef.current[index];
    if (!target) return;
    setActiveMenu(null);
    setHelpOpen(false);
    historyIndexRef.current = index;
    setHistoryIndex(index);
    applySnapshot(target.snapshot);
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    jumpToHistory(historyIndexRef.current - 1);
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyEntriesRef.current.length - 1) return;
    jumpToHistory(historyIndexRef.current + 1);
  };

  const resetSpecificationStack = () => {
    pendingHistoryMetaRef.current = {
      label: 'System reset',
      detail: 'SYSTEM 04 neutral stack restored'
    };
    applySnapshot(createNeutralSnapshot());
    resetUpscaleControls();
  };

  const buildPresetFromCurrentState = (name: string): Preset => buildPresetFromSnapshot(createSnapshot(), name);

  const openSavePresetDialog = () => {
    setActiveMenu(null);
    setPresetName('');
    setIsSavePresetOpen(true);
  };

  const closeSavePresetDialog = () => {
    setIsSavePresetOpen(false);
    setPresetName('');
  };

  const applyBeautyBoost = () => {
    pendingHistoryMetaRef.current = {
      label: 'Portrait magic applied',
      detail: 'Face-aware portrait polish tuned for a polished finish'
    };
    setBeautyBoost(clampPortraitControlValue('beautyBoost', 34));
    setGlowUp(clampPortraitControlValue('glowUp', 6));
    setSkinSmoothing(clampPortraitControlValue('skinSmoothing', 16));
    setBlemishRemoval(clampPortraitControlValue('blemishRemoval', 24));
    setEyeBrightening(clampPortraitControlValue('eyeBrightening', 14));
    setJawDefinition(clampPortraitControlValue('jawDefinition', 12));
    setSkinPolish(clampPortraitControlValue('skinPolish', 26));
    setTeethWhitening(clampPortraitControlValue('teethWhitening', 10));
    setMakeupStrength(clampPortraitControlValue('makeupStrength', 8));
    setExpressionLift(clampPortraitControlValue('expressionLift', 12));
    setFaceSlimming(clampPortraitControlValue('faceSlimming', 6));
    setAgeShift(clampPortraitControlValue('ageShift', -5));
    setClarity(14);
    setArtifactRemoval(clampPortraitControlValue('artifactRemoval', Math.max(artifactRemoval, 8)));
  };

  const saveCustomPreset = () => {
    const trimmedName = presetName.trim();
    if (!trimmedName) return;

    const nextPreset = buildPresetFromCurrentState(trimmedName);
    const normalizedName = trimmedName.toLowerCase();
    const nextCustomPresets = [
      nextPreset,
      ...customPresets.filter((preset) => !(preset.category === CUSTOM_PRESET_CATEGORY && preset.name.toLowerCase() === normalizedName))
    ];

    setCustomPresets(nextCustomPresets);
    localStorage.setItem(CUSTOM_PRESET_STORAGE_KEY, JSON.stringify(nextCustomPresets));
    setActiveCategory(CUSTOM_PRESET_CATEGORY);
    closeSavePresetDialog();
  };

  const requestDeleteCustomPreset = (preset: Preset) => {
    setPendingDeletePreset(preset);
  };

  const cancelDeleteCustomPreset = () => {
    setPendingDeletePreset(null);
  };

  const deleteCustomPreset = (presetId: string) => {
    const nextCustomPresets = customPresets.filter((preset) => preset.id !== presetId);
    setCustomPresets(nextCustomPresets);
    setPendingDeletePreset(null);

    if (nextCustomPresets.length === 0) {
      localStorage.removeItem(CUSTOM_PRESET_STORAGE_KEY);
      if (activeCategory === CUSTOM_PRESET_CATEGORY) {
        setActiveCategory(PRESET_CATEGORIES[0] ?? null);
      }
      return;
    }

    localStorage.setItem(CUSTOM_PRESET_STORAGE_KEY, JSON.stringify(nextCustomPresets));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setWorkspaceNotice(null);

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setWorkspaceNotice('Use a JPG, PNG, or WebP image. SVG and other formats are blocked for export safety.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setWorkspaceNotice('This file is over 50 MB. Use an optimized source file for stable browser rendering.');
      e.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      
      const img = new globalThis.Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE) {
          setWorkspaceNotice('This image exceeds the 8K side limit. Resize it to 8192px or less on each side.');
          e.target.value = '';
          return;
        }

        applySnapshot(createNeutralSnapshot());
        resetUpscaleControls();
        pendingHistoryMetaRef.current = null;
        originalImageRef.current = img;
        setPortraitSuppressed(false); // Reset suppression on new upload
        setPreviewImageSrc(src);
        setSourceImageSize({ width, height });
        setImageSrc(src);
        setImageReady(Date.now()); // Forces the render layer reliably
        setIsFocusMode(false);
        setWorkspaceNotice(`Loaded ${file.name} (${width}x${height}).`);
      };
      img.onerror = () => {
        setWorkspaceNotice('The image could not be decoded. Try a standard JPG, PNG, or WebP export.');
        e.target.value = '';
      };
      img.src = src;
    };
    reader.onerror = () => {
      setWorkspaceNotice('The image could not be read by the browser.');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageSrc(null);
    setPreviewImageSrc(null);
    setWorkspaceNotice(null);
    setImageReady(0);
    setIsFocusMode(false);
    setRenderRevision(0);
    setIsUpscalePreviewing(false);
    setUpscaleFallbackNotice(false);
    if (originalImageRef.current) {
        originalImageRef.current = null;
        setSourceImageSize({ width: 0, height: 0 });
    }
    if (canvasRef.current) {
      const previewCtx = canvasRef.current.getContext('2d');
      previewCtx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.width = 0;
      canvasRef.current.height = 0;
    }
    if (renderSurfaceRef.current) {
      const renderCtx = renderSurfaceRef.current.getContext('2d');
      renderCtx?.clearRect(0, 0, renderSurfaceRef.current.width, renderSurfaceRef.current.height);
      renderSurfaceRef.current.width = 0;
      renderSurfaceRef.current.height = 0;
    }
  };

  useEffect(() => {
    historyEntriesRef.current = historyEntries;
  }, [historyEntries]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    return () => {
      if (sliderInteractionTimeoutRef.current) {
        clearTimeout(sliderInteractionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!openPanels.retouch || !imageSrc || portraitDetectorRef.current || portraitModelRequestedRef.current || portraitSuppressed) {
      return () => {
        active = false;
      };
    }

    portraitModelRequestedRef.current = true;

    const loadPortraitModel = async () => {
      try {
        setPortraitModelState('loading');
        const [tf, faceLandmarksDetection] = await Promise.all([
          import('@tensorflow/tfjs-core'),
          import('@tensorflow-models/face-landmarks-detection'),
          import('@tensorflow/tfjs-backend-webgl')
        ]).then(([tfModule, faceModule]) => [tfModule, faceModule] as const);

        await tf.setBackend('webgl');
        await tf.ready();

        const detector = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            runtime: 'tfjs',
            refineLandmarks: true,
            maxFaces: 4
          }
        );

        if (!active) {
          detector.dispose();
          return;
        }

        portraitDetectorRef.current = detector;
        setPortraitModelState('ready');
        setPortraitModelRevision((value) => value + 1);
      } catch {
        if (active) {
          setPortraitModelState('unavailable');
          portraitModelRequestedRef.current = false;
        }
      }
    };

    void loadPortraitModel();

    return () => {
      active = false;
    };
  }, [openPanels.retouch, imageSrc, portraitSuppressed]);

  useEffect(() => {
    return () => {
      portraitDetectorRef.current?.dispose();
      portraitDetectorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const updateCanvasDisplay = () => {
      if (!canvasRef.current) return;
      setCanvasDisplaySize({
        width: canvasRef.current.clientWidth,
        height: canvasRef.current.clientHeight
      });
    };

    updateCanvasDisplay();
    const resizeObserver = new ResizeObserver(updateCanvasDisplay);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }
    window.addEventListener('resize', updateCanvasDisplay);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCanvasDisplay);
    };
  }, [imageReady, zoomLevel, isFocusMode]);

  useEffect(() => {
    let cancelled = false;

    const analyzePortrait = async () => {
      if (!originalImageRef.current || portraitSuppressed) {
        setPortraitGuides([]);
        setSelectedFaceIndex(0);
        return;
      }

      const detector = portraitDetectorRef.current;
      if (!detector) return;

      try {
        // Only set 'analyzing' if we have no guides yet — reduces UI blinking
        if (portraitGuides.length === 0 && portraitModelState !== 'analyzing') {
          setPortraitModelState('analyzing');
        }

        const faces = await detector.estimateFaces(originalImageRef.current, { flipHorizontal: false });
        if (cancelled) return;

        const nextGuides = faces.map((face) => buildPortraitGuide(face)).filter(Boolean) as PortraitGuide[];
        
        // If no faces found after 1 solid check, suppress for this image to save resources
        if (nextGuides.length === 0) {
          setPortraitSuppressed(true);
          setPortraitGuides([]);
          setPortraitModelState('idle');
          return;
        }

        setPortraitGuides(nextGuides);
        setSelectedFaceIndex((current) => Math.min(current, Math.max(0, nextGuides.length - 1)));
        setPortraitModelState('ready');
        
        // Ensure display size is synced for targets
        if (canvasRef.current) {
          setCanvasDisplaySize({
            width: canvasRef.current.clientWidth,
            height: canvasRef.current.clientHeight
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Portrait analysis failure:', err);
          setPortraitGuides([]);
          setPortraitModelState('unavailable');
        }
      }
    };

    void analyzePortrait();

    return () => {
      cancelled = true;
    };
    // NOTE: portraitModelState intentionally excluded to prevent analyze→ready→analyze loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageReady, portraitModelRevision]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  // Setup texture cache
  useEffect(() => {
    if (textureType.startsWith('4k_') && !textureCache[textureType]) {
      const url = TEXTURE_URLS[textureType];
      if (url) {
        const img = new globalThis.Image();
        img.crossOrigin = 'anonymous'; // Important for CORS so export doesn't taint
        img.onload = () => {
          setTextureCache(prev => ({ ...prev, [textureType]: img }));
        };
        img.src = url;
      }
    }
  }, [textureType, textureCache]);

  // Premium Intelligence Auto-Tone
  const handleAutoTone = () => {
    if (!originalImageRef.current) return;
    setIsProcessing(true);
    
    // We execute in timeout so UI can show spinner processing state
    setTimeout(() => {
      const result = computeAutoTone(originalImageRef.current!);
      setShadowCrush(result.shadowCrush);
      setMidtones(result.midtones);
      setHighlights(result.highlights);
      setSaturation(result.saturation);
      setMonochrome(result.monochrome);
      setHueShift(result.hueShift);
      setColorKnockout(result.colorKnockout);
      setGradientMap(result.gradientMap);
      setIsProcessing(false);
    }, 50);
  };

  const renderCanvas = useCallback(() => {
    const previewCanvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!previewCanvas || !img) return;

    if (!renderSurfaceRef.current) {
      renderSurfaceRef.current = document.createElement('canvas');
    }

    const canvas = renderSurfaceRef.current;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // MANDATORY FOR HYPER-REALISM
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const maxWidth = isSliderInteracting ? 1100 : 1600;
    const scale = Math.min(1, maxWidth / img.width);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / img.width;
    const scaleY = canvas.height / img.height;
    const scaledPortraitGuide = portraitGuide ? scalePortraitGuide(portraitGuide, scaleX, scaleY) : null;
    const effectiveSkinSmoothing = clampPortraitControlValue('skinSmoothing', skinSmoothing);
    const effectiveGlowUp = clampPortraitControlValue('glowUp', glowUp);
    const effectiveFaceSlimming = clampPortraitControlValue('faceSlimming', faceSlimming);
    const effectiveBlemishRemoval = clampPortraitControlValue('blemishRemoval', blemishRemoval);
    const effectiveExpressionLift = clampPortraitControlValue('expressionLift', expressionLift);
    const effectiveBeautyBoost = clampPortraitControlValue('beautyBoost', beautyBoost);
    const effectiveAgeShift = clampPortraitControlValue('ageShift', ageShift);
    const effectiveEyeBrightening = clampPortraitControlValue('eyeBrightening', eyeBrightening);
    const effectiveJawDefinition = clampPortraitControlValue('jawDefinition', jawDefinition);
    const effectiveSkinPolish = clampPortraitControlValue('skinPolish', skinPolish);
    const effectiveTeethWhitening = clampPortraitControlValue('teethWhitening', teethWhitening);
    const effectiveMakeupStrength = clampPortraitControlValue('makeupStrength', makeupStrength);
    const effectiveArtifactRemoval = clampPortraitControlValue('artifactRemoval', artifactRemoval);
    const deterministicSeed = buildDeterministicSeed(canvas.width, canvas.height, imageReady, grain, sparkles, textureIntensity, threshold, halftone, scanlines, vignette, dustAndScratches, prismBlur, lightLeak, hueShift, shadowCrush, saturation);

    const masks = buildPortraitMasks(canvas.width, canvas.height, scaledPortraitGuide, effectiveBeautyBoost, effectiveSkinPolish);
    const {
      faceMaskCanvas, faceInnerMaskCanvas, eyeMaskCanvas, browMaskCanvas,
      mouthMaskCanvas, skinMaskCanvas, featureProtectMaskCanvas, portraitBlendMaskCanvas,
      faceMaskAlpha, faceInnerMaskAlpha, eyeMaskAlpha, skinMaskAlpha,
      mouthMaskAlpha, portraitBlendMaskAlpha,
    } = masks;

    // --- PASS 0.1 Artifact Removal ---
    // If artifact removal is requested, we do a quick underlying blur on the base image 
    // and then blend it back with native image before the core filter stack to denoise.
    if (effectiveArtifactRemoval > 0) {
      // First draw base
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Blur pass
      ctx.filter = `blur(${0.35 + effectiveArtifactRemoval * 0.016}px)`;
      ctx.globalAlpha = Math.min(0.24, Math.pow(effectiveArtifactRemoval / 100, 1.08) * 0.26);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;
      ctx.filter = 'none';
      
      // We must flatten it into an image block we can re-filter
      const denoiseCanvas = document.createElement('canvas');
      denoiseCanvas.width = canvas.width; denoiseCanvas.height = canvas.height;
      denoiseCanvas.getContext('2d')!.drawImage(canvas, 0, 0);

      // Now clear and set up for Pass 1
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      
      const blurRadius = (inkBleed / 100) * 4; 
      const contrastVal = 100 + (shadowCrush * 1.5);
      const brightVal = 100 - (shadowCrush * 0.3);
      const actualSat = monochrome ? 0 : saturation;
      
      ctx.filter = `blur(${blurRadius}px) contrast(${contrastVal}%) brightness(${brightVal}%) saturate(${actualSat}%) hue-rotate(${hueShift}deg)`;
      ctx.drawImage(denoiseCanvas, 0, 0);
      ctx.filter = 'none';
    } else {
      // --- PASS 1: Base Processing ---
      ctx.globalCompositeOperation = 'source-over';
      const blurRadius = (inkBleed / 100) * 4; 
      const contrastVal = 100 + (shadowCrush * 1.5);
      const brightVal = 100 - (shadowCrush * 0.3);
      const actualSat = monochrome ? 0 : saturation;
      
      ctx.filter = `blur(${blurRadius}px) contrast(${contrastVal}%) brightness(${brightVal}%) saturate(${actualSat}%) hue-rotate(${hueShift}deg)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    }

    // To mimic True Levels & Curves without slowing down the initial paint, we apply a specific color map if custom gamma/highlights are set.
    // (Added in PASS 1.2 loop for performance so we don't loop imagery twice).

    // --- PASS 0.5: Portrait Retouch Stack ---
    const portraitSmooth = effectiveSkinSmoothing;
    const portraitGlow = effectiveGlowUp;

    // Guard includes ALL portrait controls so each fires even when used in isolation
    if (scaledPortraitGuide && (
      portraitSmooth > 0 || portraitGlow > 0 || effectiveBeautyBoost > 0 ||
      effectiveExpressionLift > 0 || effectiveAgeShift !== 0 || effectiveSkinPolish > 0 ||
      effectiveBlemishRemoval > 0 || effectiveEyeBrightening > 0 || effectiveJawDefinition > 0
    )) {
      const protectedDetailSource = document.createElement('canvas');
      protectedDetailSource.width = canvas.width;
      protectedDetailSource.height = canvas.height;
      protectedDetailSource.getContext('2d')?.drawImage(canvas, 0, 0);

      if (portraitSmooth > 0) {
        applySkinSmoothing(ctx, canvas, portraitSmooth, skinMaskCanvas ?? faceInnerMaskCanvas);
      }

      if (effectiveSkinPolish > 0) {
        applySkinPolish(ctx, canvas, effectiveSkinPolish, skinMaskCanvas ?? faceInnerMaskCanvas);
      }

      if (effectiveBlemishRemoval > 0) {
        applyBlemishRemoval(ctx, canvas, effectiveBlemishRemoval, skinMaskCanvas, skinMaskAlpha);
      }

      if (effectiveBeautyBoost > 0) {
        applyBeautyBoostCanvas(ctx, canvas, effectiveBeautyBoost, faceInnerMaskCanvas ?? faceMaskCanvas);
      }

      if (effectiveGlowUp > 0) {
        applyGlowAccent(ctx, canvas, scaledPortraitGuide, effectiveGlowUp, skinMaskCanvas);
      }

      if (effectiveExpressionLift > 0) {
        applyExpressionLift(ctx, canvas, scaledPortraitGuide, effectiveExpressionLift, faceInnerMaskCanvas);
      }

      if (effectiveJawDefinition > 0) {
        applyJawDefinition(ctx, canvas, scaledPortraitGuide, effectiveJawDefinition);
      }

      // PASS 0.5i: Eye Brightening canvas-level screen pass.
      // This was previously missing — only the per-pixel color pipeline path ran.
      // The canvas pass provides the high-frequency luminosity boost that makes eyes pop.
      if (effectiveEyeBrightening > 0) {
        applyEyeBrightening(ctx, canvas, effectiveEyeBrightening, eyeMaskCanvas);
      }

      if (featureProtectMaskCanvas) {
        applyFeatureProtection(ctx, canvas, protectedDetailSource, featureProtectMaskCanvas, portraitSmooth, effectiveSkinPolish);
      }
    }

    // --- PASS 0.8: Hyper-Realistic Macro Clarity ---
    if (clarity > 0) {
      // Fast unsharp map implementation using difference blending proxy and contrast multiplier
      const clCanvas = document.createElement('canvas');
      clCanvas.width = canvas.width;
      clCanvas.height = canvas.height;
      const clCtx = clCanvas.getContext('2d')!;
      
      // Draw slightly washed out blurred layer
      clCtx.filter = `blur(1.5px) contrast(80%)`;
      clCtx.drawImage(canvas, 0, 0);

      // We extract high-frequency detail by subtracting blur from the current image
      // Since HTML5 canvas doesn't have a native 'subtract' or reliable 'difference' that acts like High Pass,
      // We will mimic high pass using blend modes that boost structure boundaries.
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = (clarity / 100) * (scaledPortraitGuide ? 0.46 : 0.8);
      
      // Drawing the normal image OVER itself via OVERLAY intrinsically boosts contrast, 
      // but to make it *Clarity*, we want midtone contrast. 
      // In CSS, `contrast` affects overall image, we need edge contrast.
      const edgeCanvas = document.createElement('canvas');
      edgeCanvas.width = canvas.width;
      edgeCanvas.height = canvas.height;
      const edgeCtx = edgeCanvas.getContext('2d')!;
      edgeCtx.filter = `contrast(150%) saturate(0%)`;
      edgeCtx.drawImage(canvas, 0, 0);
      
      ctx.drawImage(edgeCanvas, 0, 0);
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
    }

    // --- PASS 1.2: Selective Retouching, LUTs, & Color Knockout ---
    applyColorPipeline(ctx, canvas, scaledPortraitGuide, {
      colorKnockout,
      effectiveTeethWhitening,
      effectiveMakeupStrength,
      effectiveEyeBrightening,
      midtones,
      highlights,
      activeLUT,
      effectiveBeautyBoost,
      effectiveAgeShift,
      chromaOffset
    }, {
      faceMaskAlpha,
      faceInnerMaskAlpha,
      skinMaskAlpha,
      mouthMaskAlpha,
      portraitBlendMaskAlpha,
      eyeMaskAlpha,
      faceInnerMaskCanvas
    });
    
    // --- PASS 1.3: Geometry Warping (Face Slimming) ---
    // Moved here so that all previously painted effects (eyes, teeth, skin, jaw)
    // are warped together with the face geometry, ensuring perfect alignment.
    if (scaledPortraitGuide && effectiveFaceSlimming > 0) {
      applyFaceSlimming(ctx, canvas, scaledPortraitGuide, effectiveFaceSlimming, faceMaskCanvas);
    }

    // --- PASS 1.5: Gradient Mapping (Thermal & Cyberpunk) ---
    applyGradientMap(ctx, canvas, gradientMap);

    // --- PASS 2: Film Halation (Glow Engine) ---
    applyFilmHalation(ctx, canvas, halation, inkBleed, gradientMap, monochrome);

    // --- PASS 2.5: Light Leaks (Film Burn) ---
    applyLightLeaks(ctx, canvas, lightLeak, lightLeakStyle);

    // --- PASS 2.7: Prism Edge Blur (Dreamcore) ---
    applyPrismEdgeBlur(ctx, canvas, prismBlur);

    // --- PASS 3: Threshold Bitmap & Bayer Dither processing ---
    applyThresholdBitmap(ctx, canvas, threshold);

    // --- PASS 3.5: Halftone Engine ---
    applyHalftone(ctx, canvas, halftone);

    // --- PASS 4: Chromatic Aberration / Glitch Engine ---
    applyChromaticAberration(ctx, canvas, chromaOffset, monochrome);

    // --- PASS 4.5: Scanlines Engine ---
    applyScanlines(ctx, canvas, scanlines);

    // --- PASS 4.8: Star Filter (Bling/Sparkles) ---
    if (sparkles > 0) {
      const sparkleRandom = createSeededRandom(deterministicSeed ^ 0x51f15e5);
      renderSparkles(ctx, canvas, sparkles, sparkleRandom);
    }

    // --- PASS 5: Procedural Noise/Grain Engine ---
    if (grain > 0) {
      const grainRandom = createSeededRandom(deterministicSeed ^ 0x9e3779b9);
      renderGrain(ctx, canvas.width, canvas.height, grain, monochrome, grainRandom);
    }

    // --- PASS 6: Lens Vignette ---
    if (vignette > 0) {
      renderVignette(ctx, canvas.width, canvas.height, vignette);
    }

    // --- PASS 6.2: Physical Textures ---
    if (textureType !== 'none' && textureIntensity > 0) {
      const textureRandom = createSeededRandom(deterministicSeed ^ 0x7f4a7c15);
      const tile = generateTextureTile(textureType, textureIntensity, textureRandom);
      applyTextureTile(ctx, canvas.width, canvas.height, tile);
    }

    if (dustAndScratches > 0) {
      const distressRandom = createSeededRandom(deterministicSeed ^ 0x13579bdf);
      renderDustAndScratches(ctx, canvas.width, canvas.height, dustAndScratches, distressRandom);
    }

    if (camcorderOSD) {
      const pad = Math.max(18, canvas.width * 0.02);
      ctx.save();
      ctx.fillStyle = 'rgba(235,245,255,0.82)';
      ctx.font = `${Math.max(11, Math.round(canvas.width * 0.014))}px monospace`;
      ctx.textBaseline = 'top';
      ctx.fillText('REC', pad + 18, pad);
      ctx.fillText('SP', canvas.width - pad - 46, pad);
      ctx.fillText('FORMAT CAM', pad, canvas.height - pad - 18);
      ctx.beginPath();
      ctx.arc(pad + 7, pad + 7, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,82,82,0.88)';
      ctx.fill();
      ctx.restore();
    }

    // --- PASS 7: Real-time Histogram Calc ---
    if (histRef.current && threshold === 0 && !isSliderInteracting) {
      const hCtx = histRef.current.getContext('2d');
      if (hCtx) {
        const stride = 16; 
        const imgData = ctx.getImageData(0, 0, Math.min(canvas.width, 800), Math.min(canvas.height, 800)).data;
        const bins = new Array(256).fill(0);
        let maxBin = 0;
        for (let i = 0; i < imgData.length; i += 4 * stride) {
          const luma = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);
          if (luma >= 0 && luma <= 255) {
             bins[luma]++;
             if (bins[luma] > maxBin) maxBin = bins[luma];
          }
        }
        hCtx.clearRect(0, 0, 256, 60);
        hCtx.fillStyle = '#e8a82d';
        for (let i = 0; i < 256; i++) {
          const h = (bins[i] / maxBin) * 60;
          hCtx.fillRect(i, 60 - h, 1, h);
        }
      }
    }

    drawCanvasToPreview(canvas, previewCanvas);
    setRenderRevision((value) => value + 1);
  }, [imageReady, portraitGuide, skinSmoothing, glowUp, faceSlimming, blemishRemoval, expressionLift, beautyBoost, ageShift, eyeBrightening, jawDefinition, skinPolish, teethWhitening, makeupStrength, artifactRemoval, clarity, isSliderInteracting, inkBleed, shadowCrush, midtones, highlights, activeLUT, grain, threshold, saturation, hueShift, halation, chromaOffset, monochrome, halftone, scanlines, vignette, lightLeak, lightLeakStyle, gradientMap, prismBlur, colorKnockout, textureType, textureIntensity, dustAndScratches, sparkles, camcorderOSD]);

  useEffect(() => {
    const previewCanvas = canvasRef.current;
    const renderSurface = renderSurfaceRef.current;

    if (!previewCanvas || !renderSurface || !imageSrc) {
      return;
    }

    if (!upscaleEnabled) {
      drawCanvasToPreview(renderSurface, previewCanvas);
      queueMicrotask(() => {
        setIsUpscalePreviewing(false);
        setUpscaleFallbackNotice(false);
      });
      return;
    }

    let active = true;
    const requestId = ++upscaleRequestRef.current;
    queueMicrotask(() => {
      setIsUpscalePreviewing(true);
    });

    void (async () => {
      try {
        const { upscaleCanvas } = await import('@/lib/upscale/engine');
        const upscaledCanvas = await upscaleCanvas(renderSurface, previewUpscaleSettings);
        if (!active || requestId !== upscaleRequestRef.current) return;
        drawCanvasToPreview(upscaledCanvas, previewCanvas);
        setUpscaleFallbackNotice(false);
      } catch {
        if (!active || requestId !== upscaleRequestRef.current) return;
        drawCanvasToPreview(renderSurface, previewCanvas);
        setUpscaleFallbackNotice(true);
      } finally {
        if (active && requestId === upscaleRequestRef.current) {
          setIsUpscalePreviewing(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [renderRevision, imageSrc, upscaleEnabled, previewUpscaleSettings]);

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(renderCanvas);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
    // Dependency execution guard for 4K external textures loading
  }, [renderCanvas]);

  useEffect(() => {
    const nextSnapshot = createSnapshot();

    if (!snapshotSyncRef.current) {
      snapshotSyncRef.current = nextSnapshot;
      commitHistoryEntry(nextSnapshot, 'Session started', 'SYSTEM 04 industrial base loaded');
      return;
    }

    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      snapshotSyncRef.current = nextSnapshot;
      return;
    }

    const summary = summarizeSnapshotChange(snapshotSyncRef.current, nextSnapshot);
    if (!summary) return;

    const pendingMeta = pendingHistoryMetaRef.current;
    pendingHistoryMetaRef.current = null;

    commitHistoryEntry(
      nextSnapshot,
      pendingMeta?.label ?? summary.label,
      pendingMeta?.detail ?? summary.detail
    );

    snapshotSyncRef.current = nextSnapshot;
  }, [createSnapshot]);

  const applyPreset = (p: Preset) => {
    const preset = adaptPresetToCurrentImage(p);
    pendingHistoryMetaRef.current = {
      label: 'Specification preset applied',
      detail: preset.name
    };
    setInkBleed(preset.inkBleed);
    setShadowCrush(preset.shadowCrush);
    setMidtones(preset.midtones || 0);
    setHighlights(preset.highlights || 0);
    setActiveLUT(preset.activeLUT || 'none');
    setGrain(preset.grain);
    setThreshold(preset.threshold);
    setSaturation(preset.saturation || 100);
    setHueShift(preset.hueShift || 0);
    setHalation(preset.halation || 0);
    setChromaOffset(preset.chromaOffset || 0);
    setMonochrome(preset.monochrome || false);
    setHalftone(preset.halftone || 0);
    setScanlines(preset.scanlines || 0);
    setVignette(preset.vignette || 0);
    setLightLeak(preset.lightLeak || 0);
    setLightLeakStyle(preset.lightLeakStyle || 'amber');
    setGradientMap(preset.gradientMap || 'none');
    setDustAndScratches(preset.dustAndScratches || 0);
    setSparkles(preset.sparkles || 0);
    setCamcorderOSD(preset.camcorderOSD || false);
    setPrismBlur(preset.prismBlur || 0);
    setSkinSmoothing(clampPortraitControlValue('skinSmoothing', preset.skinSmoothing || 0));
    setClarity(preset.clarity || 0);
    setGlowUp(clampPortraitControlValue('glowUp', preset.glowUp || 0));
    setFaceSlimming(clampPortraitControlValue('faceSlimming', preset.faceSlimming || 0));
    setBlemishRemoval(clampPortraitControlValue('blemishRemoval', preset.blemishRemoval || 0));
    setExpressionLift(clampPortraitControlValue('expressionLift', preset.expressionLift || 0));
    setBeautyBoost(clampPortraitControlValue('beautyBoost', preset.beautyBoost || 0));
    setAgeShift(clampPortraitControlValue('ageShift', preset.ageShift || 0));
    setEyeBrightening(clampPortraitControlValue('eyeBrightening', preset.eyeBrightening || 0));
    setJawDefinition(clampPortraitControlValue('jawDefinition', preset.jawDefinition || 0));
    setSkinPolish(clampPortraitControlValue('skinPolish', preset.skinPolish || 0));
    setTeethWhitening(clampPortraitControlValue('teethWhitening', preset.teethWhitening || 0));
    setMakeupStrength(clampPortraitControlValue('makeupStrength', preset.makeupStrength || 0));
    setColorKnockout(preset.colorKnockout || 'none');
    setTextureType(preset.textureType || 'none');
    setTextureIntensity(preset.textureIntensity || 50);
    setArtifactRemoval(clampPortraitControlValue('artifactRemoval', preset.artifactRemoval || 0));
    setActiveCamera('Custom Preset');
  };

  const applyCameraSimulation = (cameraId: string) => {
    pendingHistoryMetaRef.current = {
      label: 'Capture profile updated',
      detail: cameraId
    };
    setActiveCamera(cameraId);

    const profile = getCameraProfile(cameraId);
    setSaturation(profile.saturation);
    setHueShift(profile.hueShift);
    setShadowCrush(profile.shadowCrush);
    setInkBleed(profile.inkBleed);
    setHalation(profile.halation);
    setChromaOffset(profile.chromaOffset);
    setGrain(profile.grain);
    setVignette(profile.vignette);
    setThreshold(profile.threshold);
    setHalftone(profile.halftone);
    setScanlines(profile.scanlines);
    setMonochrome(profile.monochrome);
  };

  const exportImage = async (format: 'png' | 'jpeg') => {
    if (!renderSurfaceRef.current) {
      setWorkspaceNotice('Import an image before rendering an output.');
      return;
    }
    setIsProcessing(true);
    setWorkspaceNotice(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const outputCanvas = await buildExportCanvas();
      if (!outputCanvas) {
        setWorkspaceNotice('No render surface is available yet. Wait for the preview to finish and try again.');
        return;
      }

      const dataUrl = outputCanvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.95 : undefined);
      const link = document.createElement('a');
      const upscaleSuffix = upscaleEnabled ? `-${upscaleScaleFactor.toFixed(2).replace(/\.00$/, '').replace('.', '_')}x` : '';
      link.download = `format-system-04${upscaleSuffix}.${format}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setWorkspaceNotice(`Rendered ${format.toUpperCase()} output.`);
    } catch {
      setWorkspaceNotice('Export failed. If a remote texture is active, switch Texture Surface to none and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPresets = allPresets.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (activeCategory ? p.category === activeCategory : true)
  );

  return (
    <div className="flex flex-col h-screen w-full bg-[#181818] text-[#e0e0e0] font-sans text-[13px] overflow-hidden">
      
      {/* TOP MENU BAR */}
      <header className="h-[36px] bg-[#141414] border-b border-[#333] flex items-center px-4 shrink-0">
          <div className="flex items-center gap-1 text-[#aaa] relative" ref={menuRef}>
          {(['file', 'edit', 'help'] as const).map((menu) => (
            <div key={menu} className="relative">
              <button
                onClick={() => {
                  if (menu === 'help') {
                    setHelpOpen(true);
                  }
                  setActiveMenu((current) => current === menu ? null : menu);
                }}
                className={`cursor-pointer px-2 py-1 rounded-sm uppercase tracking-[0.16em] text-[10px] transition-colors ${activeMenu === menu ? 'text-white bg-[#232323]' : 'hover:text-white hover:bg-[#1c1c1c]'}`}
              >
                {menu}
              </button>

              {activeMenu === menu && menu === 'file' && (
                <div className="absolute top-[calc(100%+6px)] left-0 min-w-[210px] rounded-[4px] border border-[#3a3527] bg-[#111111] p-1 shadow-[0_18px_40px_rgba(0,0,0,0.45)] z-30">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px]">Import Image</button>
                  <button onClick={() => exportImage('png')} disabled={!imageSrc} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] disabled:opacity-40">Render PNG Output</button>
                  <button onClick={() => exportImage('jpeg')} disabled={!imageSrc} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] disabled:opacity-40">Render JPG Output</button>
                  <button onClick={openSavePresetDialog} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px]">Save Specification Preset</button>
                  <button onClick={handleRemoveImage} disabled={!imageSrc} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] disabled:opacity-40">Clear Working Image</button>
                </div>
              )}

              {activeMenu === menu && menu === 'edit' && (
                <div className="absolute top-[calc(100%+6px)] left-0 min-w-[210px] rounded-[4px] border border-[#3a3527] bg-[#111111] p-1 shadow-[0_18px_40px_rgba(0,0,0,0.45)] z-30">
                  <button onClick={handleUndo} disabled={historyIndex <= 0} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] disabled:opacity-40">Undo Last Edit</button>
                  <button onClick={handleRedo} disabled={historyIndex >= historyEntries.length - 1} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] disabled:opacity-40">Redo Edit</button>
                  <button onClick={resetSpecificationStack} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px]">Reset Specification Stack</button>
                  <button onClick={() => setLeftPanels((prev) => ({ ...prev, history: true, lastEdits: true }))} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px]">Open Revision Panels</button>
                </div>
              )}

              {activeMenu === menu && menu === 'help' && (
                <div className="absolute top-[calc(100%+6px)] left-0 min-w-[210px] rounded-[4px] border border-[#3a3527] bg-[#111111] p-1 shadow-[0_18px_40px_rgba(0,0,0,0.45)] z-30">
                  <button onClick={() => setHelpOpen(true)} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px]">Open FORMAT Guide</button>
                  <button onClick={() => setLeftPanels((prev) => ({ ...prev, history: true }))} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px]">Show Revision History</button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="hidden md:flex flex-1 justify-center items-center gap-10">
          <div className="flex items-center gap-2">
            <span 
              className={`cursor-pointer transition-colors ${compareLocked ? 'text-white font-semibold' : 'text-[#888] hover:text-[#ccc]'}`}
              onClick={() => setCompareLocked(!compareLocked)}
              title="Toggle Compare Lock"
            >
              Compare
            </span>
            <button 
              className={`w-6 h-6 rounded-sm text-black flex items-center justify-center transition-colors ${showOriginal || compareLocked ? 'bg-red-500' : 'bg-[#e8a82d] hover:bg-[#ffba33]'}`}
              onClick={() => setCompareLocked(!compareLocked)}
              onMouseDown={() => !compareLocked && setShowOriginal(true)}
              onMouseUp={() => !compareLocked && setShowOriginal(false)}
              onMouseLeave={() => !compareLocked && setShowOriginal(false)}
              title="Click to lock, hold to view"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFocusMode((current) => !current)}
              disabled={!imageSrc}
              className="w-6 h-6 rounded-sm border border-[#444] text-[#888] flex items-center justify-center hover:bg-[#333] disabled:opacity-40 disabled:hover:bg-transparent"
              title={isFocusMode ? 'Exit canvas focus mode' : 'Enter canvas focus mode'}
            >
              {isFocusMode ? <Minimize className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[#888]">Zoom</span>
            {['FIT', '1:1'].map((z) => (
              <button 
                key={z} 
                onClick={() => setZoomLevel(z as 'FIT' | '1:1')}
                className={`px-2 h-5 text-[11px] font-semibold rounded-sm transition-colors ${zoomLevel === z ? 'bg-[#e8a82d] text-black' : 'border border-[#444] text-[#888] hover:bg-[#333]'}`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
           {imageSrc && (
             <>
                <button 
                  onClick={() => {
                    exportImage('png');
                  }}
                 className="flex items-center gap-1.5 px-3 py-1 bg-[#141414] border border-[#444] rounded text-[11px] text-[#aaa] hover:text-white hover:border-[#666] transition-colors uppercase tracking-wider"
               >
                 <FileDown className="w-3.5 h-3.5" />
                  PNG
                </button>
               <button 
                 onClick={() => {
                   exportImage('jpeg');
                 }}
                 className="flex items-center gap-1.5 px-3 py-1 bg-[#141414] border border-[#e8a82d]/50 rounded text-[11px] text-[#e8a82d] hover:text-black hover:bg-[#e8a82d] transition-colors uppercase tracking-wider mr-2"
               >
                 <FileDown className="w-3.5 h-3.5" />
                  JPG
                </button>
               <button 
                 onClick={handleRemoveImage}
                 className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded text-[11px] text-red-400 hover:bg-red-500 hover:text-white transition-colors mr-4"
               >
                  Clear
                </button>
              </>
            )}
           <div className="ml-2 pl-3 border-l border-[#3a3527] flex flex-col items-end leading-none">
              <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#f3efe6]">FORMAT <span className="text-[#a7a095] tracking-[0.12em] normal-case">by TAGDesigns</span></span>
              <span className="mt-1 hidden sm:inline text-[9px] uppercase tracking-[0.24em] text-[#d6a13a]">SYSTEM 04 // INDUSTRIAL SPECIFICATION</span>
            </div>
         </div>
       </header>

      {/* MIDDLE ROW */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR: Presets */}
        {!isFocusMode && <aside className="hidden md:flex md:w-[240px] xl:w-[300px] bg-[#202020] border-r border-[#333] flex-col shrink-0">
          {/* Categories / Accordions */}
          <div className="flex flex-col border-b border-[#333]">
            <div 
              className="px-4 py-3 flex justify-between items-center text-[#e0e0e0] border-b border-[#333] cursor-pointer hover:bg-[#2a2a2a]"
              onClick={() => toggleLeftPanel('specifications')}
            >
              <span className="font-medium uppercase tracking-[0.18em] text-[10px] text-[#f1ece2]">Specifications</span>
               <span className="text-[#888] flex items-center gap-2">{availableCategories.length} {leftPanels.specifications ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</span>
            </div>
            
            <AnimatePresence>
              {leftPanels.specifications && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                  {/* Search and Filters */}
                  <div className="p-4 flex flex-col gap-3 bg-[#202020]">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search specification presets..." 
                        className="w-full bg-[#141414] border border-[#444] rounded-sm py-1.5 pl-3 pr-8 text-white focus:outline-none focus:border-[#e8a82d] placeholder-[#666]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Search className="w-3.5 h-3.5 text-[#888] absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                    
                      <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#666] uppercase tracking-[0.16em] font-semibold">Index</span>
                       <div className="flex gap-2 text-[11px]">
                         <button className="flex items-center gap-1.5 px-3 py-1 bg-[#141414] border border-[#444] rounded-full text-[#aaa] hover:text-white hover:border-[#666]">
                           <Star className="w-3 h-3" /> Starred
                         </button>
                         <button className="flex items-center gap-1.5 px-3 py-1 bg-[#141414] border border-[#444] rounded-full text-[#aaa] hover:text-white hover:border-[#666]">
                           <Clock className="w-3 h-3" /> Recent
                         </button>
                       </div>
                     </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      <button 
                        onClick={() => setActiveCategory(null)}
                        className={`text-[10px] uppercase tracking-[0.12em] px-2 py-1 rounded-sm border ${activeCategory === null ? 'bg-[#e8a82d] border-[#e8a82d] text-black font-semibold' : 'border-transparent text-[#888] hover:text-[#ddd]'}`}
                      >
                        All Specs
                      </button>
                      {availableCategories.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          title={cat}
                          className={`text-[10px] uppercase tracking-[0.12em] px-2 py-1 rounded-sm border ${activeCategory === cat ? 'bg-[#e8a82d] border-[#e8a82d] text-black font-semibold' : 'border-transparent text-[#888] hover:text-[#ddd]'}`}
                        >
                          {CATEGORY_SHORT_LABELS[cat] ?? cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div 
              className="px-4 py-3 flex justify-between items-center text-[#e0e0e0] border-b border-[#333] cursor-pointer bg-[#2a2a2a]"
              onClick={() => toggleLeftPanel('presets')}
            >
              <span className="font-semibold text-white uppercase tracking-[0.16em] text-[10px]">Specification Presets</span>
              <span className="text-[#888] flex items-center gap-2">{filteredPresets.length} {leftPanels.presets ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</span>
            </div>
          </div>

          <AnimatePresence>
            {leftPanels.presets && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex-1 overflow-hidden flex flex-col">
                {/* Preset Thumbnails List */}
                <div className="flex-1 overflow-y-auto bg-[#202020] p-2 hide-scrollbar">
                  <div className="grid grid-cols-2 gap-2">
                      {filteredPresets.map(preset => {
                      const isCustomPreset = preset.category === CUSTOM_PRESET_CATEGORY;
                      // Generative dynamic styling for thumbnails matching the engine
                      let b = (preset.inkBleed / 100) * 3;
                      let c = 100 + (preset.shadowCrush * 1.5) + (preset.midtones ? preset.midtones * 0.2 : 0);
                      let br = 100 - (preset.shadowCrush * 0.3) + (preset.highlights ? preset.highlights * 0.5 : 0);
                      let sat = preset.monochrome ? 0 : preset.saturation;
                      let hue = preset.hueShift;
                      
                      // Inject simulated LUT effects strictly for thumbnail preview accuracy
                       if (preset.activeLUT === 'clarendon') { c += 15; sat += 10; hue -= 5; br += 5; }
                       if (preset.activeLUT === 'gingham') { c -= 15; sat -= 10; br += 10; hue += 5; }
                       if (preset.activeLUT === 'juno') { sat += 15; c += 5; hue -= 5; }
                       if (preset.activeLUT === 'lark') { sat += 10; br -= 5; hue += 10; }
                       if (preset.activeLUT === 'portra-soft') { sat += 6; br += 8; hue += 4; }
                       if (preset.activeLUT === 'editorial-cool') { sat -= 4; br += 4; hue -= 10; }
                       if (preset.activeLUT === 'copper-print') { sat += 8; br -= 2; hue += 12; }
                       if (preset.activeLUT === 'teal-film') { sat += 4; hue -= 16; }
                       if (preset.activeLUT === 'clean-luxe') { c += 8; br += 8; sat += 2; }
                       if (preset.activeLUT === 'mocha-editorial') { c += 5; br -= 3; hue += 8; }
                      
                      // Simulate gradient maps in CSS if possible (using heavy hue/saturate hacks for thumbnails)
                      if (preset.gradientMap === 'thermal') { hue += 180; sat += 50; }
                      else if (preset.gradientMap === 'cyberpunk') { hue += 280; sat += 30; }
                      else if (preset.gradientMap === 'nightvision') { sat = 0; } // Will look green due to next pass if we had full css. Approximation fine.
                      else if (preset.colorKnockout === 'red') { sat -= 50; }
                      
                      const filterStack = `blur(${b}px) contrast(${c}%) brightness(${br}%) saturate(${sat}%) hue-rotate(${hue}deg)`;
                      
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
                          className="flex flex-col bg-[#222] hover:bg-[#2a2a2a] border border-[#333] hover:border-[#e8a82d] rounded-[4px] transition-all group text-left overflow-hidden shadow-sm cursor-pointer focus:outline-none focus:border-[#e8a82d]"
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
                                className="absolute top-1.5 right-1.5 z-10 h-7 w-7 rounded-[3px] border border-[#5a3f1f] bg-[#111111]/92 text-[#d7a54f] opacity-0 group-hover:opacity-100 hover:bg-[#1a1a1a] hover:text-[#f0c66f] transition-all flex items-center justify-center"
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
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={`https://picsum.photos/seed/gritbase/200/150`} 
                                alt={preset.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 origin-center"
                                style={{ filter: filterStack }}
                              />
                            )}
                            {preset.grain > 0 && (
                              <div className="absolute inset-0 mix-blend-overlay pointer-events-none" style={{ opacity: preset.grain/100, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} />
                            )}
                            {preset.halation > 0 && (
                              <div className="absolute inset-0 mix-blend-screen pointer-events-none" style={{ opacity: preset.halation/100, backgroundColor: 'rgba(255,50,0,0.1)' }} />
                            )}
                          </div>
                          <div className="p-2 w-full">
                             <span className="text-[11px] font-semibold text-[#ccc] group-hover:text-white leading-tight truncate block">{preset.name}</span>
                               <span className="text-[9px] text-[#777] uppercase tracking-wider block mt-0.5">{CATEGORY_SHORT_LABELS[preset.category] ?? preset.category}</span>
                              {preset.description && (
                                <span className="text-[9px] text-[#8a847a] leading-tight block mt-1 line-clamp-2">{preset.description}</span>
                              )}
                              {preset.usageTags && preset.usageTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {preset.usageTags.map((tag) => (
                                    <span key={`${preset.id}-${tag}`} className="text-[8px] uppercase tracking-[0.14em] rounded-[2px] border border-[#4b4027] bg-[#17130d] px-1.5 py-0.5 text-[#d1b170]">
                                      {tag.replace('-', ' ')}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                       )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
            <div className="flex flex-col border-t border-[#333] bg-[#1a1a1a]">
             <div className="px-4 py-3 flex justify-between items-center text-[#aaa] cursor-pointer hover:bg-[#222]" onClick={() => toggleLeftPanel('lastEdits')}>
               <span className="uppercase tracking-[0.16em] text-[10px] text-[#e0dbd1]">Last Edits</span>
               <span className="flex items-center gap-2">{Math.min(historyEntries.length, 4)} {leftPanels.lastEdits ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</span>
             </div>
             <AnimatePresence>
               {leftPanels.lastEdits && (
                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                   <div className="px-4 pb-3 flex flex-col gap-2 text-[11px]">
                     {historyEntries.slice(-4).reverse().map((entry, index) => (
                       <button key={`${entry.id}-${index}`} onClick={() => jumpToHistory(historyEntries.findIndex((item) => item.id === entry.id))} className="text-left rounded-[3px] border border-[#2f2f2f] bg-[#141414] px-3 py-2 hover:border-[#5a4823] hover:bg-[#181818] transition-colors">
                         <div className="flex items-center justify-between gap-3">
                           <span className="text-[#e2ddd3]">{entry.label}</span>
                           <span className="text-[#6f6a62] font-mono">{entry.timestamp}</span>
                         </div>
                         <div className="mt-1 text-[#8d877d] text-[10px] uppercase tracking-[0.12em]">{entry.detail}</div>
                       </button>
                     ))}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
             <div className="px-4 py-3 flex justify-between items-center text-[#aaa] cursor-pointer hover:bg-[#222]" onClick={() => toggleLeftPanel('history')}>
               <span className="uppercase tracking-[0.16em] text-[10px] text-[#e0dbd1]">History</span>
               <span className="flex items-center gap-2">{leftPanels.history ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</span>
             </div>
             <AnimatePresence>
               {leftPanels.history && (
                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                   <div className="px-4 pb-4 flex flex-col gap-2 text-[11px] max-h-[220px] overflow-y-auto">
                     {historyEntries.map((entry, index) => (
                       <button key={`${entry.id}-${index}-timeline`} onClick={() => jumpToHistory(index)} className={`text-left rounded-[3px] border px-3 py-2 transition-colors ${index === historyIndex ? 'border-[#a67824] bg-[#1f1a11]' : 'border-[#2f2f2f] bg-[#141414] hover:border-[#5a4823] hover:bg-[#181818]'}`}>
                         <div className="flex items-center justify-between gap-3">
                           <span className="text-[#e2ddd3]">{entry.label}</span>
                           <span className="text-[#6f6a62] font-mono">{entry.timestamp}</span>
                         </div>
                         <div className="mt-1 text-[#8d877d] text-[10px] uppercase tracking-[0.12em]">{entry.detail}</div>
                       </button>
                     ))}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
         </aside>}

        {/* CENTER CANVAS */}
        <main className={`min-w-0 flex-1 flex bg-[#181818] relative ${zoomLevel === 'FIT' ? 'items-center justify-center overflow-hidden' : 'items-start justify-start overflow-auto'} ${isFocusMode ? 'p-3' : 'p-4 md:p-8'}`}>
           {isFocusMode && imageSrc && (
             <div className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded-[4px] border border-[#3a3527] bg-[#111111]/92 px-2 py-2 shadow-[0_16px_36px_rgba(0,0,0,0.4)] backdrop-blur-sm">
               <span className="text-[10px] uppercase tracking-[0.18em] text-[#d6a13a]">Canvas Focus</span>
               <button onClick={() => setZoomLevel('FIT')} className={`px-2 h-6 text-[10px] rounded-sm border transition-colors ${zoomLevel === 'FIT' ? 'bg-[#e8a82d] border-[#e8a82d] text-black' : 'border-[#444] text-[#aaa] hover:bg-[#1f1f1f]'}`}>FIT</button>
               <button onClick={() => setZoomLevel('1:1')} className={`px-2 h-6 text-[10px] rounded-sm border transition-colors ${zoomLevel === '1:1' ? 'bg-[#e8a82d] border-[#e8a82d] text-black' : 'border-[#444] text-[#aaa] hover:bg-[#1f1f1f]'}`}>1:1</button>
               <button onClick={() => setIsFocusMode(false)} className="h-6 w-6 rounded-sm border border-[#444] text-[#aaa] hover:bg-[#1f1f1f] flex items-center justify-center"><Minimize className="w-3.5 h-3.5" /></button>
             </div>
           )}
            {!imageSrc ? (
              <div className="flex w-full max-w-lg flex-col items-center gap-4 m-auto">
                <div className="md:hidden w-full rounded-[6px] border border-[#3a3527] bg-[#151515] px-4 py-3 text-center text-[11px] leading-relaxed text-[#aaa49a]">
                  Mobile import mode is optimized for quick review. Use a tablet or desktop viewport for the full FORMAT control surface.
                </div>
                <label className="border-2 border-dashed border-[#444] hover:border-[#666] hover:bg-[#202020] cursor-pointer transition-colors rounded-lg w-full min-h-[240px] sm:aspect-video flex flex-col items-center justify-center text-[#888] gap-4 px-6">
                  <Upload className="w-10 h-10" />
                  <div className="text-center">
                    <p className="font-semibold text-[#ccc] mb-1">Upload Image to edit</p>
                    <p className="text-[11px]">Supports JPG, PNG, WebP up to 8K resolution</p>
                  </div>
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} />
                </label>
                {workspaceNotice && (
                  <div className="w-full rounded-[4px] border border-[#4d3b1d] bg-[#17130d] px-3 py-2 text-center text-[11px] text-[#d7b978]">
                    {workspaceNotice}
                  </div>
                )}
              </div>
            ) : (
             <div ref={canvasStageRef} className={`relative ${zoomLevel === '1:1' ? 'shrink-0' : 'w-full h-full flex items-center justify-center'}`}>
                 <canvas ref={canvasRef} className={`bg-[#111] shadow-[0_0_80px_rgba(0,0,0,0.8)] transition-all duration-300 ${zoomLevel === 'FIT' ? 'max-w-full max-h-[85vh] object-contain' : ''}`} />
                 <AnimatePresence>
                   {(showOriginal || compareLocked) && (
                     <motion.img 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        src={imageSrc}
                        className={`absolute pointer-events-none z-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] ${zoomLevel === 'FIT' ? 'max-w-full max-h-[85vh] object-contain' : ''}`}
                     />
                   )}
                 </AnimatePresence>
                  {showFaceTargets && portraitGuides.length > 0 && sourceImageSize.width > 0 && sourceImageSize.height > 0 && canvasDisplaySize.width > 0 && canvasDisplaySize.height > 0 && (
                    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                      <div className="relative" style={{ width: canvasDisplaySize.width, height: canvasDisplaySize.height }}>
                        {portraitGuides.map((guide, index) => {
                          const scaleX = canvasDisplaySize.width / Math.max(1, sourceImageSize.width);
                          const scaleY = canvasDisplaySize.height / Math.max(1, sourceImageSize.height);
                          const ovalPath = guide.faceOval.map((point) => `${point.x * scaleX},${point.y * scaleY}`).join(' ');
                          return (
                            <button
                              key={`face-box-${index}`}
                              onClick={() => setSelectedFaceIndex(index)}
                              className="absolute border-0 bg-transparent transition-colors"
                              style={{
                                left: 0,
                                top: 0,
                                width: canvasDisplaySize.width,
                                height: canvasDisplaySize.height,
                                pointerEvents: 'auto'
                              }}
                              title={`Target Face ${index + 1}`}
                            >
                              <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${canvasDisplaySize.width} ${canvasDisplaySize.height}`} fill="none">
                                <polygon
                                  points={ovalPath}
                                  fill={selectedFaceIndex === index ? 'rgba(232,168,45,0.12)' : 'rgba(255,255,255,0.04)'}
                                  stroke={selectedFaceIndex === index ? '#e8a82d' : 'rgba(255,255,255,0.42)'}
                                  strokeWidth="1.5"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span
                                className={`absolute rounded-[3px] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] ${selectedFaceIndex === index ? 'bg-[#e8a82d] text-black' : 'bg-black/70 text-white'}`}
                                style={{ left: guide.bounds.x * scaleX, top: Math.max(0, guide.bounds.y * scaleY - 20) }}
                              >
                                Face {index + 1}
                              </span>
                            </button>
                          );
                        })}
                     </div>
                   </div>
                 )}
              </div>
            )}
        </main>

         {/* RIGHT SIDEBAR: Controls */}
         {!isFocusMode && <aside className="hidden md:flex md:w-[280px] xl:w-[320px] bg-[#202020] border-l border-[#333] flex-col overflow-y-auto shrink-0 hide-scrollbar shadow-[-5px_0_15px_rgba(0,0,0,0.3)] z-10"
           onPointerDownCapture={(event) => {
             const target = event.target as HTMLElement;
             if (target instanceof HTMLInputElement && target.type === 'range') {
               markSliderInteraction();
             }
           }}
           onInputCapture={(event) => {
             const target = event.target as HTMLElement;
             if (target instanceof HTMLInputElement && target.type === 'range') {
               markSliderInteraction();
               releaseSliderInteraction(140);
             }
           }}
           onPointerUpCapture={(event) => {
             const target = event.target as HTMLElement;
             if (target instanceof HTMLInputElement && target.type === 'range') {
               releaseSliderInteraction(80);
             }
           }}
           onKeyUpCapture={(event) => {
             const target = event.target as HTMLElement;
             if (target instanceof HTMLInputElement && target.type === 'range') {
               releaseSliderInteraction(80);
             }
           }}>
          
          {/* Real-Time Histogram */}
          <div className="border-b border-[#333] pb-2 bg-[#181818]">
            <div className="px-4 py-2.5 flex justify-between items-center text-[#e0e0e0]">
               <span className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2">
                 <Activity className="w-3.5 h-3.5 text-[#e8a82d]" /> Live Histogram
               </span>
            </div>
            
            <div className="px-4 pb-2 pt-1">
               <div className="w-full h-[65px] bg-[#111] border border-[#333] rounded-[2px] relative flex items-end shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.1]" style={{backgroundImage: 'linear-gradient(90deg, #333 1px, transparent 1px), linear-gradient(180deg, #333 1px, transparent 1px)', backgroundSize: '10px 10px'}} />
                  <canvas ref={histRef} width="256" height="65" className="w-full h-full opacity-80" />
               </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col pt-2">
            
            {/* CAMERA SIMULATION PANEL */}
            <div className="mb-2 border-b border-[#333]">
              <div 
                className="px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525]"
                onClick={() => togglePanel('camera')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-[#e8a82d]" /> Camera Simulation
                </span>
                {openPanels.camera ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
              
              <AnimatePresence>
                {openPanels.camera && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="p-4 pt-1 pb-4 flex flex-col gap-2">
                       <span className="text-[11px] text-[#888] font-medium leading-tight uppercase tracking-[0.12em]">Capture Profile</span>
                      <div className="relative">
                        <select 
                          className="w-full bg-[#141414] border border-[#444] text-white text-[12px] p-2 pr-8 rounded-[3px] focus:outline-none focus:border-[#e8a82d] appearance-none cursor-pointer"
                          value={activeCamera}
                          onChange={(e) => applyCameraSimulation(e.target.value)}
                        >
                          <option value="Standard Matrix">Standard Matrix (Bypass)</option>
                          <option value="1970s Kodachrome (35mm)">1970s Kodachrome (35mm)</option>
                          <option value="1980s VHS Camcorder">1980s VHS Camcorder</option>
                          <option value="1990s Disposable Flash">1990s Disposable Flash</option>
                          <option value="2000s Early Digital (CCD)">2000s Early Digital (CCD)</option>
                          <option value="Custom Preset" disabled hidden>Custom Parameter Stack</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#888] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {activeCamera !== 'Standard Matrix' && activeCamera !== 'Custom Preset' && (
                        <p className="text-[10px] text-[#e8a82d] mt-1 italic">
                           Capture constraints enforced across tone and optics modules.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* TONES & COLOR PANEL */}
            <div className="mb-2 border-b border-[#333]">
              <div 
                className="px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525]"
                onClick={() => togglePanel('tones')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-[#e8a82d]" /> Tone & Color
                </span>
                {openPanels.tones ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
              
              <AnimatePresence>
                {openPanels.tones && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="p-4 pt-1 flex flex-col gap-4">
                      {/* Smart Auto-Tone */}
                      <button 
                         onClick={handleAutoTone}
                         className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] text-[#ccc] hover:text-[#e8a82d] border border-[#444] hover:border-[#e8a82d] px-3 py-2 rounded-[3px] text-[11px] font-bold uppercase tracking-wider transition-colors mb-2"
                      >
                         <Wand2 className="w-3.5 h-3.5" />
                         Intelligent Auto-Tone
                      </button>

                      {/* Monochrome Toggle */}
                      <label className="flex items-center gap-2 text-[12px] text-[#ccc] cursor-pointer group w-max">
                        <input type="checkbox" checked={monochrome} onChange={(e) => setMonochrome(e.target.checked)} className="w-3.5 h-3.5 rounded-sm bg-[#141414] border-[#444] group-hover:border-[#e8a82d]" />
                        Force B&W Monochrome
                      </label>

                      {/* Saturation */}
                      <div className={`flex flex-col gap-1.5 transition-opacity ${monochrome ? 'opacity-30 pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-[#aaa] font-medium">Saturation Pipeline</span>
                          <input type="number" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#444] rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        <input type="range" min="0" max="300" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} />
                      </div>

                      {/* Hue Shift */}
                      <div className={`flex flex-col gap-1.5 transition-opacity ${monochrome ? 'opacity-30 pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-[#aaa] font-medium">Color Phase (Hue)</span>
                          <input type="number" value={hueShift} onChange={(e) => setHueShift(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#444] rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        {/* Custom multi-color track for hue */}
                        <input type="range" min="-180" max="180" value={hueShift} onChange={(e) => setHueShift(parseInt(e.target.value))} />
                      </div>

                      {/* Gradient Mapping */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-[#333]/50">
                        <span className="text-[11px] text-[#aaa] font-medium flex items-center gap-1.5"><Map className="w-3 h-3" /> Aura & Gradient Map</span>
                        <div className="relative">
                          <select 
                            className="w-full bg-[#141414] border border-[#444] text-white text-[12px] p-2 pr-8 rounded-[3px] focus:outline-none focus:border-[#e8a82d] appearance-none cursor-pointer"
                            value={gradientMap}
                            onChange={(e) => setGradientMap(e.target.value)}
                          >
                            <option value="none">Standard Optics</option>
                            <option value="thermal">Thermal Heatmap</option>
                            <option value="cyberpunk">Cyberpunk Neon</option>
                            <option value="nightvision">IR Night Vision</option>
                            <option value="xray">Silver X-Ray</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#888] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Color Knockout */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-[#333]/50">
                        <span className="text-[11px] text-[#aaa] font-medium flex items-center gap-1.5">Selective Color Splash</span>
                        <div className="relative">
                          <select 
                            className="w-full bg-[#141414] border border-[#444] text-white text-[12px] p-2 pr-8 rounded-[3px] focus:outline-none focus:border-[#e8a82d] appearance-none cursor-pointer"
                            value={colorKnockout}
                            onChange={(e) => setColorKnockout(e.target.value as EngineSnapshot['colorKnockout'])}
                          >
                            <option value="none">No Knockout (Full Color)</option>
                            <option value="red">Knockout All Except Red</option>
                            <option value="green">Knockout All Except Green</option>
                            <option value="blue">Knockout All Except Blue</option>
                            <option value="warm">Isolate Warm Tones (Skin)</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#888] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Shadow Crush -> Replaced with Levels */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-[#333]/50">
                        <div className="flex justify-between items-center text-[#fff]">
                          <span className="text-[11px] font-medium flex items-center gap-1.5"><Sliders className="w-3 h-3 text-[#aaa]" /> Levels (Black Point)</span>
                          <input type="number" value={shadowCrush} onChange={(e) => setShadowCrush(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#444] rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        <input type="range" min="0" max="150" value={shadowCrush} onChange={(e) => setShadowCrush(parseInt(e.target.value))} />
                      </div>
                      
                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex justify-between items-center text-[#fff]">
                          <span className="text-[11px] text-[#aaa] font-medium pl-4">Curves (Midtones / Gamma)</span>
                          <input type="number" value={midtones} onChange={(e) => setMidtones(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#444] rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        <input type="range" min="-100" max="100" value={midtones} onChange={(e) => setMidtones(parseInt(e.target.value))} />
                      </div>

                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex justify-between items-center text-[#fff]">
                          <span className="text-[11px] text-[#aaa] font-medium pl-4">Levels (White Point)</span>
                          <input type="number" value={highlights} onChange={(e) => setHighlights(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#444] rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        <input type="range" min="0" max="200" value={highlights} onChange={(e) => setHighlights(parseInt(e.target.value))} />
                      </div>

                      {/* Instagram LUTs */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-[#333]/50">
                         <span className="text-[11px] text-[#e8a82d] font-medium flex items-center gap-1.5 uppercase tracking-[0.12em]">LUT Specification</span>
                        <div className="relative">
                          <select 
                            className="w-full bg-[#141414] border border-[#e8a82d]/30 text-white text-[12px] p-2 pr-8 rounded-[3px] focus:outline-none focus:border-[#e8a82d] appearance-none cursor-pointer"
                            value={activeLUT}
                            onChange={(e) => setActiveLUT(e.target.value)}
                          >
                           <option value="none">No Filter</option>
                           <option value="clarendon">Clarendon (Pop highlights/cyans)</option>
                           <option value="gingham">Gingham (Washed out/warm text)</option>
                           <option value="juno">Juno (Warm tones pop)</option>
                           <option value="lark">Lark (Desaturate reds, boost blues)</option>
                           <option value="portra-soft">Portra Soft (Editorial skin warmth)</option>
                           <option value="editorial-cool">Editorial Cool (cool neutral polish)</option>
                           <option value="copper-print">Copper Print (warm metallic print)</option>
                           <option value="teal-film">Teal Film (cinema cyan contrast)</option>
                           <option value="clean-luxe">Clean Luxe (bright premium finish)</option>
                           <option value="mocha-editorial">Mocha Editorial (rich brown tone)</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#888] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AIRBRUSH RETOUCH PANEL */}
            <div className="mb-2 border-b border-[#333]">
              <div 
                className="px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525]"
                onClick={() => togglePanel('retouch')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                   <Sparkles className="w-3.5 h-3.5 text-[#e8a82d]" /> Face & Airbrush
                </span>
                {openPanels.retouch ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
              
              <AnimatePresence>
                {openPanels.retouch && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="p-4 pt-1 flex flex-col gap-4">
                      <div className="rounded-[6px] border border-[#2f2a20] bg-[#171717] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.18em] text-[#d6a13a]">Portrait Intelligence</div>
                            <div className="mt-1 text-[11px] text-[#c9c2b7]">
                              {portraitModelState === 'loading' && 'Loading face landmark model...'}
                              {portraitModelState === 'analyzing' && 'Analyzing facial geometry...'}
                              {portraitModelState === 'ready' && portraitGuide && `Face landmarks locked for ${portraitGuides.length} detected face${portraitGuides.length === 1 ? '' : 's'}.`}
                              {portraitModelState === 'ready' && !portraitGuide && 'No face detected in the current frame.'}
                              {portraitModelState === 'unavailable' && 'Portrait AI unavailable. Using standard image controls.'}
                              {portraitModelState === 'idle' && 'Initializing portrait system...'}
                            </div>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.14em] ${portraitGuide ? 'bg-[#1d2417] text-[#a6d28d]' : 'bg-[#221b12] text-[#d6a13a]'}`}>
                            {portraitGuide ? 'Face Tracked' : 'Standby'}
                          </span>
                        </div>

                        {portraitGuide && (
                          <>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {PORTRAIT_PRESETS.map((preset) => (
                                <button
                                  key={preset.id}
                                  onClick={() => applyPortraitPreset(preset)}
                                  className="rounded-[3px] border border-[#444] bg-[#121212] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#c9c2b7] hover:border-[#e8a82d] hover:text-[#f2ede3]"
                                >
                                  {preset.name}
                                </button>
                              ))}
                            </div>

                            {portraitGuides.length > 1 && (
                              <div className="mt-3 border-t border-[#2d2a22] pt-3">
                                <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[#8e877c]">Target Face</div>
                                <div className="flex flex-wrap gap-2">
                                  {portraitGuides.map((_, index) => (
                                    <button
                                      key={`face-target-${index}`}
                                      onClick={() => setSelectedFaceIndex(index)}
                                      className={`rounded-[3px] border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] ${selectedFaceIndex === index ? 'border-[#e8a82d] bg-[#221b12] text-[#f2ede3]' : 'border-[#444] bg-[#121212] text-[#c9c2b7] hover:border-[#e8a82d]'}`}
                                    >
                                      Face {index + 1}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <label className="mt-3 flex items-center gap-2 text-[11px] text-[#bdb6aa] cursor-pointer w-max">
                              <input type="checkbox" checked={showFaceTargets} onChange={(e) => setShowFaceTargets(e.target.checked)} className="w-3.5 h-3.5 rounded-sm bg-[#141414] border-[#444]" />
                              Show Face Targets
                            </label>
                          </>
                        )}
                      </div>

                      {portraitGuide && (
                        <>
                          <button 
                             onClick={applyBeautyBoost}
                              className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] text-[#f3e6c4] hover:text-[#e8a82d] border border-[#5a4823] hover:border-[#e8a82d] px-3 py-2 rounded-[3px] text-[11px] font-bold uppercase tracking-wider transition-colors"
                          >
                             <Wand2 className="w-3.5 h-3.5" />
                             Magic Portrait Polish
                          </button>

                          <div className="rounded-[6px] border border-[#2f2f2f] bg-[#141414] p-3 flex flex-col gap-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-[#8e877c]">Compact Portrait Controls</div>

                            <div className="grid grid-cols-2 gap-3">
                              {PORTRAIT_CONTROL_DEFINITIONS.map((control) => {
                                const binding = portraitControlBindings[control.key];
                                const limits = PORTRAIT_CONTROL_LIMITS[control.key];
                                return (
                                  <ControlSlider
                                    key={control.key}
                                    label={control.label}
                                    min={limits.min}
                                    max={limits.max}
                                    value={binding.value}
                                    accentClass={control.accentClass}
                                    inputClassName={`bg-[#101010] ${control.borderClass ?? 'border-[#444]'}`}
                                    onChange={(value) => binding.setValue(clampPortraitControlValue(control.key, value))}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* OPTICS & LENS PANEL */}
            <div className="mb-2 border-b border-[#333]">
              <div 
                className="px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525]"
                onClick={() => togglePanel('optics')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <Aperture className="w-3.5 h-3.5 text-[#e8a82d]" /> Lens Optics
                </span>
                {openPanels.optics ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
              
              <AnimatePresence>
                {openPanels.optics && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="p-4 pt-1 flex flex-col gap-4">
                      {/* Artifact Removal */}
                      <div className="border-b border-[#333]/50 pb-4">
                        <ControlSlider
                          label="Artifact Removal (Denoise)"
                          icon={<RefreshCw className="w-3 h-3" />}
                          min={0}
                          max={PORTRAIT_CONTROL_LIMITS.artifactRemoval.max}
                          value={artifactRemoval}
                          accentClass="text-[#99ccff]"
                          inputClassName="bg-[#141414] border border-[#99ccff]/50"
                          description="Smoothes macro-blocking and digital JPG compression artifacts prior to rendering."
                          onChange={(value) => setArtifactRemoval(clampPortraitControlValue('artifactRemoval', value))}
                        />
                      </div>

                      {/* Skin Softening */}
                      <div className="border-b border-[#333]/50 pb-4">
                        <ControlSlider
                          label="Glamour Surface Softening"
                          min={0}
                          max={PORTRAIT_CONTROL_LIMITS.skinSmoothing.max}
                          value={skinSmoothing}
                          accentClass="text-[#ffccff]"
                          inputClassName="bg-[#141414] border border-[#ffccff]/50"
                          onChange={(value) => setSkinSmoothing(clampPortraitControlValue('skinSmoothing', value))}
                        />
                      </div>

                      {/* Clarity / Macro Details */}
                      <div className="border-b border-[#333]/50 pb-4">
                        <ControlSlider
                          label="Hyper-Realistic Clarity"
                          icon={<ZoomIn className="w-3 h-3" />}
                          min={0}
                          max={100}
                          value={clarity}
                          accentClass="text-[#ffcc44]"
                          inputClassName="bg-[#141414] border border-[#ffcc44]/50"
                          onChange={setClarity}
                        />
                      </div>

                      {/* Ink Bleed */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-[#aaa] font-medium">Lens Blur Radius</span>
                          <input type="number" value={inkBleed} onChange={(e) => setInkBleed(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#444] rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        <input type="range" min="0" max="100" value={inkBleed} onChange={(e) => setInkBleed(parseInt(e.target.value))} />
                      </div>

                      {/* Halation */}
                      <div className={`flex flex-col gap-1.5 transition-opacity ${monochrome ? 'opacity-30 pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-[#aaa] font-medium">Film Halation (Glow)</span>
                          <input type="number" value={halation} onChange={(e) => setHalation(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#444] rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        <input type="range" min="0" max="100" value={halation} onChange={(e) => setHalation(parseInt(e.target.value))} />
                      </div>

                      {/* Light Leaks */}
                      <div className={`flex flex-col gap-1.5 pt-2 border-t border-[#333]/50`}>
                        <div className="flex justify-between items-center text-[#ff6600]">
                          <span className="text-[11px] font-medium flex items-center gap-1.5"><Flame className="w-3 h-3" /> Film Light Leaks</span>
                          <input type="number" value={lightLeak} onChange={(e) => setLightLeak(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#ff6600]/50 rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#ff6600]" />
                        </div>
                        <input type="range" min="0" max="100" value={lightLeak} onChange={(e) => setLightLeak(parseInt(e.target.value))} />
                        <div className="relative mt-2">
                          <select 
                            className="w-full bg-[#141414] border border-[#444] text-white text-[12px] p-2 pr-8 rounded-[3px] focus:outline-none focus:border-[#e8a82d] appearance-none cursor-pointer"
                            value={lightLeakStyle}
                            onChange={(e) => setLightLeakStyle(e.target.value)}
                          >
                            <option value="amber">Amber Burn</option>
                            <option value="rose">Rose Bloom</option>
                            <option value="prism">Prism Flare</option>
                            <option value="sunset">Sunset Wash</option>
                            <option value="frost">Frost Veil</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#888] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Prism Blur */}
                      <div className={`flex flex-col gap-1.5 pt-2 border-t border-[#333]/50`}>
                        <div className="flex justify-between items-center text-[#99ccff]">
                          <span className="text-[11px] font-medium flex items-center gap-1.5"><Eye className="w-3 h-3" /> Dreamcore Edge Blur</span>
                          <input type="number" value={prismBlur} onChange={(e) => setPrismBlur(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#99ccff]/50 rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#99ccff]" />
                        </div>
                        <input type="range" min="0" max="100" value={prismBlur} onChange={(e) => setPrismBlur(parseInt(e.target.value))} />
                      </div>

                      {/* Lens Vignette */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-[#333]/50">
                        <div className="flex justify-between items-center text-[#aaa]">
                          <span className="text-[11px] font-medium">Lens Vignette (Corners)</span>
                          <input type="number" value={vignette} onChange={(e) => setVignette(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#444] rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        <input type="range" min="0" max="100" value={vignette} onChange={(e) => setVignette(parseInt(e.target.value))} />
                      </div>

                      {/* Chromatic Aberration */}
                      <div className={`flex flex-col gap-1.5 transition-opacity ${monochrome ? 'opacity-30 pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-cyan-400 font-medium">Chromatic Shift <span className="text-red-400">(Glitch)</span></span>
                          <input type="number" value={chromaOffset} onChange={(e) => setChromaOffset(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#444] rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        <input type="range" min="0" max="100" value={chromaOffset} onChange={(e) => setChromaOffset(parseInt(e.target.value))} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* TEXTURE PANEL */}
            <div className="mb-2">
              <div 
                className="px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525]"
                onClick={() => togglePanel('texture')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <Droplet className="w-3.5 h-3.5 text-[#e8a82d]" /> Particles & Texture
                </span>
                {openPanels.texture ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
              
              <AnimatePresence>
                {openPanels.texture && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="p-4 pt-1 flex flex-col gap-4">
                      {/* Surface Texture Type */}
                      <div className="flex flex-col gap-1.5">
                         <span className="text-[11px] text-[#aaa] font-medium flex items-center gap-1.5 uppercase tracking-[0.12em]">Surface Specification</span>
                        <div className="relative">
                           <select 
                             className="w-full bg-[#141414] border border-[#444] text-white text-[12px] p-2 pr-8 rounded-[3px] focus:outline-none focus:border-[#e8a82d] appearance-none cursor-pointer"
                             value={textureType}
                             onChange={(e) => setTextureType(e.target.value as string)}
                           >
                            <option value="none">No Texture</option>
                            <option value="paper">Pressed Paper</option>
                            <option value="canvas">Woven Canvas</option>
                            <option value="linen">Fine Linen</option>
                            <option value="stone">Stone Composite</option>
                            <option value="metal">Brushed Metal</option>
                            <option value="grunge">Distressed Surface</option>
                            <option value="4k_film_dust">Film Dust Microtexture</option>
                            <option value="4k_leather_grain">Leather Grain</option>
                            <option value="4k_glass_refraction">Glass Refraction</option>
                            <option value="4k_holographic_foil">Holographic Sheen</option>
                            <option value="4k_crushed_plastic">Plastic Reflection</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#888] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Texture Intensity */}
                      <div className={`flex flex-col gap-1.5 transition-opacity ${textureType === 'none' ? 'opacity-30 pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-[#aaa] font-medium">Texture Intensity</span>
                          <input type="number" value={textureIntensity} onChange={(e) => setTextureIntensity(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#444] rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        <input type="range" min="0" max="100" value={textureIntensity} onChange={(e) => setTextureIntensity(parseInt(e.target.value))} />
                      </div>

                      {/* Grain */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-[#aaa] font-medium">Film Grain Overlay</span>
                          <input type="number" value={grain} onChange={(e) => setGrain(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#444] rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        <input type="range" min="0" max="100" value={grain} onChange={(e) => setGrain(parseInt(e.target.value))} />
                      </div>

                      {/* Threshold */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-red-500">
                          <span className="text-[11px] font-bold">Lithograph Bitmap</span>
                          <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-red-900 rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-red-500" />
                        </div>
                        <input type="range" min="0" max="255" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PRINT & OVERLAYS PANEL */}
            <div className="mb-2">
              <div 
                className="px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525]"
                onClick={() => togglePanel('print')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <Box className="w-3.5 h-3.5 text-[#e8a82d]" /> Print & CRT Engine
                </span>
                {openPanels.print ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
              
              <AnimatePresence>
                {openPanels.print && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="p-4 pt-1 flex flex-col gap-4">
                      {/* Halftone */}
                      <div className="flex flex-col gap-1.5 border-l-2 border-[#e8a82d] pl-2 -ml-2">
                        <div className="flex justify-between items-center text-white">
                          <span className="text-[11px] font-medium">Printer Halftone Dots</span>
                          <input type="number" value={halftone} onChange={(e) => setHalftone(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#e8a82d]/50 rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        <input type="range" min="0" max="25" value={halftone} onChange={(e) => setHalftone(parseInt(e.target.value))} />
                      </div>

                      {/* Scanlines */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[#aaa]">
                          <span className="text-[11px] font-medium">CRT VHS Scanlines</span>
                          <input type="number" value={scanlines} onChange={(e) => setScanlines(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#444] rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d]" />
                        </div>
                        <input type="range" min="0" max="100" step="5" value={scanlines} onChange={(e) => setScanlines(parseInt(e.target.value))} />
                      </div>

                      {/* Sparkles / Star Filter */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-[#333]/50">
                        <div className="flex justify-between items-center text-[#ffcc00]">
                          <span className="text-[11px] font-medium flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Y2K Star Filter (Highlights Only)</span>
                          <input type="number" value={sparkles} onChange={(e) => setSparkles(Number(e.target.value))} className="w-12 h-5 bg-[#141414] border border-[#ffcc00]/50 rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#ffcc00]" />
                        </div>
                        <input type="range" min="0" max="100" value={sparkles} onChange={(e) => setSparkles(parseInt(e.target.value))} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="mt-6 px-4 flex justify-end pb-8">
               <button onClick={openSavePresetDialog} className="bg-[#2a2a2a] border border-[#444] text-[#ccc] font-medium text-[11px] uppercase tracking-wider px-4 py-2 rounded-[3px] hover:bg-[#333] transition-colors shadow-sm w-full">
                   Save Specification Preset
                </button>
             </div>
           </div>
         </aside>}
      </div>

      {/* BOTTOM ACTION BAR */}
      {!isFocusMode && <footer className="hidden lg:flex min-h-[48px] bg-[#222] border-t border-[#111] flex-wrap items-center justify-between gap-3 px-4 py-2 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] z-20">
        <div className="text-[11px] text-[#aaa] font-mono tracking-tight flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> 
          {workspaceNotice ?? 'FORMAT Ready'}
          {imageSrc && `• Output Target: ${upscaleEnabled ? `${upscaleScaleFactor.toFixed(2).replace(/\.00$/, '')}x raster export` : 'Custom_Raster.jpg'}`}
          {isUpscalePreviewing && '• Upscale previewing'}
          {upscaleFallbackNotice && '• Upscale fallback active'}
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-3 rounded-[4px] border border-[#3a3527] bg-[#181818] px-3 py-2">
            <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#d7d1c5]">
              <input
                type="checkbox"
                checked={upscaleEnabled}
                onChange={(event) => setUpscaleEnabled(event.target.checked)}
                disabled={!imageSrc}
                className="w-3.5 h-3.5 bg-[#141414] border-[#444] disabled:opacity-40"
              />
              Enable Upscaler
            </label>
            <label className="flex items-center gap-2 text-[11px] text-[#aaa]">
              <span className="uppercase tracking-[0.12em]">Scale</span>
              <select
                value={upscaleScaleFactor}
                onChange={(event) => {
                  markUpscalePresetCustom();
                  setUpscaleScaleFactor(Number(event.target.value));
                }}
                disabled={!imageSrc || !upscaleEnabled}
                className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[11px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40"
              >
                {[1.5, 2, 3].map((factor) => (
                  <option key={factor} value={factor}>{factor}x</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[11px] text-[#aaa]">
              <span className="uppercase tracking-[0.12em]">Preset</span>
              <select
                value={upscaleTuningPreset}
                onChange={(event) => applyUpscalePresetSelection(event.target.value as UpscaleTuningPreset | 'custom')}
                disabled={!imageSrc || !upscaleEnabled}
                className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[11px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40"
              >
                <option value="custom">Custom</option>
                {UPSCALE_TUNING_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[11px] text-[#aaa]">
              <span className="uppercase tracking-[0.12em]">Mode</span>
              <select
                value={upscaleModePreset}
                onChange={(event) => {
                  markUpscalePresetCustom();
                  setUpscaleModePreset(event.target.value as UpscaleModePreset);
                }}
                disabled={!imageSrc || !upscaleEnabled}
                className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[11px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40"
              >
                {UPSCALE_MODE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[11px] text-[#aaa]">
              <span className="uppercase tracking-[0.12em]">Profile</span>
              <select
                value={upscaleContentProfile}
                onChange={(event) => {
                  markUpscalePresetCustom();
                  setUpscaleContentProfile(event.target.value as UpscaleContentProfile);
                }}
                disabled={!imageSrc || !upscaleEnabled}
                className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[11px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40"
              >
                {UPSCALE_CONTENT_PROFILES.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[11px] text-[#aaa]">
              <span className="uppercase tracking-[0.12em]">Detail Recovery</span>
              <input
                type="range"
                min="0"
                max="100"
                value={upscaleDetailRecovery}
                onChange={(event) => {
                  markUpscalePresetCustom();
                  setUpscaleDetailRecovery(Number(event.target.value));
                }}
                disabled={!imageSrc || !upscaleEnabled}
                className="w-20 disabled:opacity-40"
              />
            </label>
            <label className="flex items-center gap-2 text-[11px] text-[#aaa]">
              <span className="uppercase tracking-[0.12em]">Edge Protection</span>
              <input
                type="range"
                min="0"
                max="100"
                value={upscaleEdgeProtection}
                onChange={(event) => {
                  markUpscalePresetCustom();
                  setUpscaleEdgeProtection(Number(event.target.value));
                }}
                disabled={!imageSrc || !upscaleEnabled}
                className="w-20 disabled:opacity-40"
              />
            </label>
            <label className="flex items-center gap-2 text-[11px] text-[#aaa]">
              <span className="uppercase tracking-[0.12em]">Anti-Halo</span>
              <input
                type="range"
                min="0"
                max="100"
                value={upscaleAntiHalo}
                onChange={(event) => {
                  markUpscalePresetCustom();
                  setUpscaleAntiHalo(Number(event.target.value));
                }}
                disabled={!imageSrc || !upscaleEnabled}
                className="w-20 disabled:opacity-40"
              />
            </label>
          </div>

          <div className="flex lg:hidden items-center gap-2 rounded-[4px] border border-[#3a3527] bg-[#181818] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#d7d1c5]">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={upscaleEnabled}
                onChange={(event) => setUpscaleEnabled(event.target.checked)}
                disabled={!imageSrc}
                className="w-3.5 h-3.5 bg-[#141414] border-[#444] disabled:opacity-40"
              />
              Upscaler
            </label>
            <select
              value={upscaleScaleFactor}
              onChange={(event) => {
                markUpscalePresetCustom();
                setUpscaleScaleFactor(Number(event.target.value));
              }}
              disabled={!imageSrc || !upscaleEnabled}
              className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[10px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40"
            >
              {[1.5, 2, 3].map((factor) => (
                <option key={factor} value={factor}>{factor}x</option>
              ))}
            </select>
            <select
              value={upscaleTuningPreset}
              onChange={(event) => applyUpscalePresetSelection(event.target.value as UpscaleTuningPreset | 'custom')}
              disabled={!imageSrc || !upscaleEnabled}
              className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[10px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40"
            >
              <option value="custom">Custom</option>
              {UPSCALE_TUNING_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
            <select
              value={upscaleModePreset}
              onChange={(event) => {
                markUpscalePresetCustom();
                setUpscaleModePreset(event.target.value as UpscaleModePreset);
              }}
              disabled={!imageSrc || !upscaleEnabled}
              className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[10px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40"
            >
              {UPSCALE_MODE_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
            <select
              value={upscaleContentProfile}
              onChange={(event) => {
                markUpscalePresetCustom();
                setUpscaleContentProfile(event.target.value as UpscaleContentProfile);
              }}
              disabled={!imageSrc || !upscaleEnabled}
              className="h-7 rounded-[3px] border border-[#444] bg-[#101010] px-2 text-[10px] text-[#f2ede3] focus:border-[#e8a82d] focus:outline-none disabled:opacity-40"
            >
              {UPSCALE_CONTENT_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-[12px] text-[#aaa] cursor-pointer hover:text-white group transition-colors">
            <input type="checkbox" className="w-3.5 h-3.5 bg-[#141414] border-[#444] group-hover:border-[#e8a82d]" />
            Commit as Smart Filter
            <HelpCircle className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
          </label>
          
          <div className="flex gap-2">
            <button onClick={resetSpecificationStack} className="bg-[#333] text-[#ddd] hover:text-white hover:bg-[#444] px-6 py-1.5 text-[13px] rounded-[3px] font-semibold border border-[#444] transition-colors shadow-sm">
              Reset Stack
            </button>
            <button 
              onClick={() => exportImage('jpeg')}
              disabled={isProcessing || !imageSrc}
              className="bg-[#e8a82d] text-black hover:bg-[#ffba33] px-10 py-1.5 text-[13px] rounded-[3px] font-bold shadow-[0_0_10px_rgba(232,168,45,0.2)] hover:shadow-[0_0_15px_rgba(232,168,45,0.4)] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 flex items-center justify-center min-w-[140px]"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Rendering...
                </>
              ) : (
                upscaleEnabled ? 'Render Upscaled Output' : 'Render Output'
              )}
            </button>
          </div>
        </div>
      </footer>}

      <input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} />

      <AnimatePresence>
        {helpOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/55 flex items-start justify-center pt-20 px-6">
            <motion.div initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }} className="w-full max-w-[620px] rounded-[8px] border border-[#3a3527] bg-[#121212] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
              <div className="border-b border-[#2f2f2f] px-6 py-5">
                <div className="text-[12px] uppercase tracking-[0.24em] text-[#d6a13a]">FORMAT by TAGDesigns</div>
                <div className="mt-2 text-[20px] font-semibold text-[#f2ede3]">SYSTEM 04 // INDUSTRIAL SPECIFICATION</div>
                <div className="mt-2 text-[12px] text-[#8d877d]">Revision controls, export paths, and stack behavior for the current workspace.</div>
              </div>
              <div className="grid gap-5 px-6 py-5 text-[12px] text-[#c8c2b8] md:grid-cols-2">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[#d6a13a]">File</div>
                  <div className="mt-2 space-y-1 text-[#a8a196]">
                    <p>Import working imagery from the File menu.</p>
                    <p>Render PNG or JPG outputs from the header or action bar.</p>
                    <p>Clear Working Image removes the current raster only.</p>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[#d6a13a]">Edit</div>
                  <div className="mt-2 space-y-1 text-[#a8a196]">
                    <p>Undo and Redo step through the recorded specification timeline.</p>
                    <p>Last Edits shows the most recent stack changes.</p>
                    <p>Reset Stack restores the SYSTEM 04 neutral base.</p>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[#d6a13a]">Workflow</div>
                  <div className="mt-2 space-y-1 text-[#a8a196]">
                    <p>Specification Presets define the starting stack.</p>
                    <p>Inspector modules refine capture, tone, portrait, optics, and surface output.</p>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[#d6a13a]">Brand</div>
                  <div className="mt-2 space-y-1 text-[#a8a196]">
                    <p>Primary brand: FORMAT</p>
                    <p>Parent entity: TAGDesigns</p>
                    <p>Version style: SYSTEM 04</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end border-t border-[#2f2f2f] px-6 py-4">
                <button onClick={() => { setHelpOpen(false); setActiveMenu(null); }} className="rounded-[3px] border border-[#4a4a4a] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-[#ddd7ce] hover:bg-[#1b1b1b]">Close Guide</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSavePresetOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/55 flex items-start justify-center pt-24 px-6">
            <motion.div initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }} className="w-full max-w-[520px] rounded-[8px] border border-[#3a3527] bg-[#121212] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
              <div className="border-b border-[#2f2f2f] px-6 py-5">
                <div className="text-[12px] uppercase tracking-[0.24em] text-[#d6a13a]">Specification Preset</div>
                <div className="mt-2 text-[20px] font-semibold text-[#f2ede3]">Save to Local Specification Bank</div>
                <div className="mt-2 text-[12px] text-[#8d877d]">Stores the current FORMAT stack in this browser under `Custom Specifications`.</div>
              </div>
              <div className="px-6 py-5">
                <label className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#d6a13a]">Preset Name</span>
                  <input
                    autoFocus
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveCustomPreset();
                      if (e.key === 'Escape') closeSavePresetDialog();
                    }}
                    placeholder="Example: Editorial Brass Portrait"
                    className="w-full rounded-[4px] border border-[#444] bg-[#141414] px-3 py-3 text-[13px] text-white focus:border-[#e8a82d] focus:outline-none"
                  />
                </label>
                <div className="mt-4 rounded-[4px] border border-[#2f2f2f] bg-[#141414] px-4 py-3 text-[11px] text-[#9d978b]">
                  Category destination: <span className="text-[#e2ddd3]">{CUSTOM_PRESET_CATEGORY}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-[#2f2f2f] px-6 py-4">
                <button onClick={closeSavePresetDialog} className="rounded-[3px] border border-[#4a4a4a] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-[#ddd7ce] hover:bg-[#1b1b1b]">Cancel</button>
                <button onClick={saveCustomPreset} disabled={!presetName.trim()} className="rounded-[3px] border border-[#e8a82d] bg-[#e8a82d] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black disabled:opacity-40">Save Preset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingDeletePreset && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/60 flex items-start justify-center pt-28 px-6">
            <motion.div initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }} className="w-full max-w-[460px] rounded-[8px] border border-[#4b3520] bg-[#121212] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
              <div className="border-b border-[#2f2f2f] px-6 py-5">
                <div className="text-[12px] uppercase tracking-[0.24em] text-[#d6a13a]">Delete Custom Preset</div>
                <div className="mt-2 text-[20px] font-semibold text-[#f2ede3]">Remove `{pendingDeletePreset.name}`?</div>
                <div className="mt-2 text-[12px] text-[#8d877d]">This only deletes the locally saved custom preset from this browser.</div>
              </div>
              <div className="flex justify-end gap-2 px-6 py-4">
                <button onClick={cancelDeleteCustomPreset} className="rounded-[3px] border border-[#4a4a4a] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-[#ddd7ce] hover:bg-[#1b1b1b]">Cancel</button>
                <button onClick={() => deleteCustomPreset(pendingDeletePreset.id)} className="rounded-[3px] border border-[#9f4a30] bg-[#9f4a30] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#b8583a]">Delete Preset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
