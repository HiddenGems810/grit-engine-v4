'use client';

import { useState, useRef, useEffect, useMemo, useCallback, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, Box, RefreshCw, 
  ChevronDown, ChevronRight,
  ZoomIn,
  Palette, Activity, Aperture, Droplet, Camera,
  Flame, Map, Sparkles, Eye, Wand2
} from 'lucide-react';
import { PRESETS, PRESET_CATEGORIES, Preset } from '../lib/presets';
import { applyUpscaleTuningPreset, DEFAULT_UPSCALE_SETTINGS, UPSCALE_CONTENT_PROFILES, UPSCALE_MODE_PRESETS, UPSCALE_TUNING_PRESETS } from '@/lib/upscale/presets';
import type { UpscaleContentProfile, UpscaleModePreset, UpscaleSettings, UpscaleTuningPreset } from '@/lib/upscale/types';
import { ControlSlider } from '@/components/control-slider';
import { CanvasStage } from '@/components/canvas-stage';
import { ExportControls } from '@/components/export-controls';
import { LeftSidebar } from '@/components/left-sidebar';
import { MobileControlDock } from '@/components/mobile-control-dock';
import { TopMenu } from '@/components/top-menu';
import { reduceEditorSnapshot } from '@/lib/editor-state';
import {
  CUSTOM_PRESET_CATEGORY,
  CUSTOM_PRESET_STORAGE_KEY,
  EngineSnapshot,
  FACE_OVAL_INDICES,
  LEFT_BROW_CONTOUR_INDICES,
  LEFT_EYE_CONTOUR_INDICES,
  MenuKey,
  PORTRAIT_CONTROL_DEFINITIONS,
  PORTRAIT_CONTROL_LIMITS,
  PORTRAIT_PRESETS,
  PortraitControlKey,
  PortraitPoint,
  PortraitPreset,
  RIGHT_BROW_CONTOUR_INDICES,
  RIGHT_EYE_CONTOUR_INDICES,
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
import { scalePortraitGuide } from '@/lib/engine/portrait-guide';
import { getCameraProfile } from '@/lib/engine/camera-profiles';
import { HistoryManager } from '@/lib/engine/history';
import { useImageWorkspace } from '@/hooks/use-image-workspace';
import { usePortraitDetector } from '@/hooks/use-portrait-detector';
import { useUpscalePreview } from '@/hooks/use-upscale-preview';
import { detectBrowserCapabilities, validateCanvasCapability } from '@/lib/browser/capabilities';
import { EXPORT_UPSCALE_MEMORY_LIMIT_BYTES, validateUpscaleMemoryBudget } from '@/lib/upscale/memory';
import { TEXTURE_ASSETS } from '@/lib/textures';
import { buildPortraitMasks, createFaceMask } from '@/lib/engine/portrait-masks';
import { drawCanvasToPreview } from '@/lib/engine/canvas-utils';
import { generateTextureTile, applyTextureTile } from '@/lib/engine/texture-engine';
import { applyMaterialFinishWithKernelScheduler } from '@/lib/materials/material-engine';
import { MATERIAL_PRESETS } from '@/lib/materials/material-registry';
import type { FilmProfile, OpticalProfile, PaperSurface, PrintMode } from '@/lib/materials/material-types';
import { createKernelWorkerClient } from '@/lib/engine/kernel-worker-client';
import { KernelScheduler } from '@/lib/engine/kernel-scheduler';
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
import { computeAspectCrop, computeExportQualityInfo, type ExportAspectId } from '@/lib/export-quality';
import { createRenderFingerprint, type RenderFingerprint } from '@/lib/engine/render-fingerprint';
import { mergeCustomPresets, parseCustomPresetBundle, serializeCustomPresetBundle } from '@/lib/custom-presets';

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
  const [materialProfile, setMaterialProfile] = useState('none');
  const [materialStrength, setMaterialStrength] = useState(0);
  const [printProfile, setPrintProfile] = useState<PrintMode>('none');
  const [paperSurface, setPaperSurface] = useState<PaperSurface>('none');
  const [filmProfile, setFilmProfile] = useState<FilmProfile>('none');
  const [opticalProfile, setOpticalProfile] = useState<OpticalProfile>('none');
  const [materialFaceProtection, setMaterialFaceProtection] = useState(true);
  const [materialEdgeProtection, setMaterialEdgeProtection] = useState(true);

  // -- UI States --
  const [zoomLevel, setZoomLevel] = useState<'FIT' | '1:1'>('FIT');
  const [compareLocked, setCompareLocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(PRESET_CATEGORIES[0]);
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
  const capabilityNotices = useMemo(
    () => (typeof window === 'undefined' ? [] : detectBrowserCapabilities().warnings),
    []
  );
  
  // -- Toggles --
  const [openPanels, setOpenPanels] = useState({ camera: false, tones: true, retouch: true, optics: false, texture: false, material: false, print: false });
  const [leftPanels, setLeftPanels] = useState({ specifications: true, presets: true, lastEdits: false, history: false });
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState(() => [] as ReturnType<HistoryManager['getEntries']>);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [customPresets, setCustomPresets] = useState<Preset[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const storedPresets = window.localStorage.getItem(CUSTOM_PRESET_STORAGE_KEY);
      if (!storedPresets) return [];
      return parseCustomPresetBundle(storedPresets).presets;
    } catch (error) {
      console.warn('Unable to load local custom presets.', error);
      return [];
    }
  });
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [pendingDeletePreset, setPendingDeletePreset] = useState<Preset | null>(null);

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
  const importPresetInputRef = useRef<HTMLInputElement>(null);
  const historyManagerRef = useRef(new HistoryManager());
  const snapshotSyncRef = useRef<EngineSnapshot | null>(null);
  const skipHistoryRef = useRef(false);
  const pendingHistoryMetaRef = useRef<{ label: string; detail: string } | null>(null);
  const upscaleRequestRef = useRef(0);
  const renderRequestRef = useRef(0);
  const renderForExportRef = useRef<(() => Promise<HTMLCanvasElement | null>) | null>(null);
  const kernelSchedulerRef = useRef<KernelScheduler | null>(null);
  const sliderInteractionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ width: 0, height: 0 });
  const [exportAspect, setExportAspect] = useState<ExportAspectId>('original');
  const [renderFingerprint, setRenderFingerprint] = useState<RenderFingerprint | null>(null);
  const [inspectorMode, setInspectorMode] = useState<'off' | 'split' | 'loupe' | 'clipping' | 'texture'>('off');

  const syncCanvasDisplaySize = useCallback(() => {
    if (!canvasRef.current) return;
    setCanvasDisplaySize({
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight
    });
  }, []);

  useEffect(() => {
    const workerClient = createKernelWorkerClient();
    const scheduler = new KernelScheduler(workerClient);
    kernelSchedulerRef.current = scheduler;

    return () => {
      scheduler.close();
      kernelSchedulerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && !window.location.search.includes('bench=1')) return;
    const benchmarkWindow = window as Window & {
      __FORMAT_RENDER_BENCHMARKS__?: () => Promise<unknown>;
    };
    benchmarkWindow.__FORMAT_RENDER_BENCHMARKS__ = async () => {
      const { runBrowserRenderBenchmarks } = await import('@/lib/bench/browser-render-benchmarks');
      return runBrowserRenderBenchmarks([
        { label: '1024px preview', width: 1024, height: 1024 },
        { label: '1600px preview', width: 1600, height: 1600 },
        { label: '4096px export', width: 4096, height: 4096 }
      ]);
    };

    return () => {
      delete benchmarkWindow.__FORMAT_RENDER_BENCHMARKS__;
    };
  }, []);

  const {
    portraitGuides,
    portraitGuide,
    selectedFaceIndex,
    setSelectedFaceIndex,
    portraitModelState,
    showFaceTargets,
    setShowFaceTargets,
    setPortraitSuppressed
  } = usePortraitDetector({
    enabled: openPanels.retouch,
    imageSrc,
    imageReady,
    originalImageRef,
    onDisplaySizeSync: syncCanvasDisplaySize
  });

  const allPresets = [...customPresets, ...PRESETS];
  const availableCategories = customPresets.length > 0
    ? [CUSTOM_PRESET_CATEGORY, ...PRESET_CATEGORIES]
    : [...PRESET_CATEGORIES];
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

  const exportQualityInfo = useMemo(() => {
    const currentRenderDimensions = renderFingerprint?.renderDimensions ?? { width: 0, height: 0 };
    const baseDimensions = currentRenderDimensions.width > 0 && currentRenderDimensions.height > 0
      ? computeAspectCrop(currentRenderDimensions.width, currentRenderDimensions.height, exportAspect)
      : { width: sourceImageSize.width, height: sourceImageSize.height };

    return computeExportQualityInfo({
      sourceDimensions: sourceImageSize,
      previewDimensions: currentRenderDimensions,
      baseExportDimensions: {
        width: baseDimensions.width,
        height: baseDimensions.height
      },
      upscaleEnabled,
      upscaleScaleFactor
    });
  }, [exportAspect, renderFingerprint, sourceImageSize, upscaleEnabled, upscaleScaleFactor]);

  const buildExportCanvas = async () => {
    const exportRenderSurface = await renderForExportRef.current?.();
    const renderSurface = exportRenderSurface ?? renderSurfaceRef.current;
    if (!renderSurface) return null;

    const crop = computeAspectCrop(renderSurface.width, renderSurface.height, exportAspect);
    const baseCanvas = exportAspect === 'original'
      ? renderSurface
      : (() => {
          const cropped = document.createElement('canvas');
          cropped.width = crop.width;
          cropped.height = crop.height;
          const croppedCtx = cropped.getContext('2d', { willReadFrequently: true });
          if (!croppedCtx) return renderSurface;
          croppedCtx.drawImage(
            renderSurface,
            crop.sx,
            crop.sy,
            crop.sw,
            crop.sh,
            0,
            0,
            crop.width,
            crop.height
          );
          return cropped;
        })();

    if (!upscaleEnabled) {
      return baseCanvas;
    }

    const memoryCheck = validateUpscaleMemoryBudget({
      width: baseCanvas.width,
      height: baseCanvas.height,
      scaleFactor: upscaleSettings.scaleFactor,
      limitBytes: EXPORT_UPSCALE_MEMORY_LIMIT_BYTES
    });

    if (!memoryCheck.ok) {
      setUpscaleFallbackNotice(true);
      setWorkspaceNotice(`${memoryCheck.reason} Exported the stable base render instead.`);
      return baseCanvas;
    }

    try {
      const { upscaleCanvas } = await import('@/lib/upscale/engine');
      setUpscaleFallbackNotice(false);
      return await upscaleCanvas(baseCanvas, upscaleSettings);
    } catch (error) {
      console.warn('Export upscale failed, using base render.', error);
      setUpscaleFallbackNotice(true);
      return baseCanvas;
    }
  };

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
    materialProfile,
    materialStrength,
    printProfile,
    paperSurface,
    filmProfile,
    opticalProfile,
    materialFaceProtection,
    materialEdgeProtection,
    activeCamera
  }), [monochrome, saturation, hueShift, shadowCrush, midtones, highlights, activeLUT, inkBleed, halation, chromaOffset, grain, threshold, halftone, scanlines, vignette, lightLeak, lightLeakStyle, gradientMap, dustAndScratches, sparkles, camcorderOSD, prismBlur, skinSmoothing, clarity, glowUp, faceSlimming, blemishRemoval, expressionLift, beautyBoost, ageShift, eyeBrightening, jawDefinition, skinPolish, teethWhitening, makeupStrength, artifactRemoval, colorKnockout, textureType, textureIntensity, materialProfile, materialStrength, printProfile, paperSurface, filmProfile, opticalProfile, materialFaceProtection, materialEdgeProtection, activeCamera]);

  const applySnapshot = (snapshot: EngineSnapshot, options: { skipHistory?: boolean } = { skipHistory: true }) => {
    const normalizedSnapshot = reduceEditorSnapshot(createNeutralSnapshot(), { type: 'apply-snapshot', snapshot });
    if (options.skipHistory ?? true) {
      skipHistoryRef.current = true;
    }
    setMonochrome(normalizedSnapshot.monochrome);
    setSaturation(normalizedSnapshot.saturation);
    setHueShift(normalizedSnapshot.hueShift);
    setShadowCrush(normalizedSnapshot.shadowCrush);
    setMidtones(normalizedSnapshot.midtones);
    setHighlights(normalizedSnapshot.highlights);
    setActiveLUT(normalizedSnapshot.activeLUT);
    setInkBleed(normalizedSnapshot.inkBleed);
    setHalation(normalizedSnapshot.halation);
    setChromaOffset(normalizedSnapshot.chromaOffset);
    setGrain(normalizedSnapshot.grain);
    setThreshold(normalizedSnapshot.threshold);
    setHalftone(normalizedSnapshot.halftone);
    setScanlines(normalizedSnapshot.scanlines);
    setVignette(normalizedSnapshot.vignette);
    setLightLeak(normalizedSnapshot.lightLeak);
    setLightLeakStyle(normalizedSnapshot.lightLeakStyle);
    setGradientMap(normalizedSnapshot.gradientMap);
    setDustAndScratches(normalizedSnapshot.dustAndScratches);
    setSparkles(normalizedSnapshot.sparkles);
    setCamcorderOSD(normalizedSnapshot.camcorderOSD);
    setPrismBlur(normalizedSnapshot.prismBlur);
    setSkinSmoothing(normalizedSnapshot.skinSmoothing);
    setClarity(normalizedSnapshot.clarity);
    setGlowUp(normalizedSnapshot.glowUp);
    setFaceSlimming(normalizedSnapshot.faceSlimming);
    setBlemishRemoval(normalizedSnapshot.blemishRemoval);
    setExpressionLift(normalizedSnapshot.expressionLift);
    setBeautyBoost(normalizedSnapshot.beautyBoost);
    setAgeShift(normalizedSnapshot.ageShift);
    setEyeBrightening(normalizedSnapshot.eyeBrightening);
    setJawDefinition(normalizedSnapshot.jawDefinition);
    setSkinPolish(normalizedSnapshot.skinPolish);
    setTeethWhitening(normalizedSnapshot.teethWhitening);
    setMakeupStrength(normalizedSnapshot.makeupStrength);
    setArtifactRemoval(normalizedSnapshot.artifactRemoval);
    setColorKnockout(normalizedSnapshot.colorKnockout);
    setTextureType(normalizedSnapshot.textureType);
    setTextureIntensity(normalizedSnapshot.textureIntensity);
    setMaterialProfile(normalizedSnapshot.materialProfile);
    setMaterialStrength(normalizedSnapshot.materialStrength);
    setPrintProfile(normalizedSnapshot.printProfile);
    setPaperSurface(normalizedSnapshot.paperSurface);
    setFilmProfile(normalizedSnapshot.filmProfile);
    setOpticalProfile(normalizedSnapshot.opticalProfile);
    setMaterialFaceProtection(normalizedSnapshot.materialFaceProtection);
    setMaterialEdgeProtection(normalizedSnapshot.materialEdgeProtection);
    setActiveCamera(normalizedSnapshot.activeCamera);
  };

  const commitHistoryEntry = (snapshot: EngineSnapshot, label: string, detail: string) => {
    const history = historyManagerRef.current;
    history.commit(snapshot, label, detail);
    setHistoryEntries([...history.getEntries()]);
    setHistoryIndex(history.getIndex());
  };

  const jumpToHistory = (index: number) => {
    const snapshot = historyManagerRef.current.jumpTo(index);
    if (!snapshot) return;
    setActiveMenu(null);
    setHelpOpen(false);
    setHistoryEntries([...historyManagerRef.current.getEntries()]);
    setHistoryIndex(historyManagerRef.current.getIndex());
    applySnapshot(snapshot);
  };

  const handleUndo = () => {
    const snapshot = historyManagerRef.current.undo();
    if (!snapshot) return;
    setActiveMenu(null);
    setHelpOpen(false);
    setHistoryEntries([...historyManagerRef.current.getEntries()]);
    setHistoryIndex(historyManagerRef.current.getIndex());
    applySnapshot(snapshot);
  };

  const handleRedo = () => {
    const snapshot = historyManagerRef.current.redo();
    if (!snapshot) return;
    setActiveMenu(null);
    setHelpOpen(false);
    setHistoryEntries([...historyManagerRef.current.getEntries()]);
    setHistoryIndex(historyManagerRef.current.getIndex());
    applySnapshot(snapshot);
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

  const applyAntiAiSlopRepair = () => {
    pendingHistoryMetaRef.current = {
      label: 'Anti-AI repair applied',
      detail: 'Texture recovery, fake sharpness reduction, and identity-safe skin protection'
    };
    setShadowCrush(38);
    setMidtones(10);
    setHighlights(8);
    setSaturation(102);
    setHueShift(0);
    setInkBleed(8);
    setClarity(10);
    setArtifactRemoval(clampPortraitControlValue('artifactRemoval', 26));
    setSkinSmoothing(clampPortraitControlValue('skinSmoothing', 8));
    setSkinPolish(clampPortraitControlValue('skinPolish', 18));
    setBeautyBoost(clampPortraitControlValue('beautyBoost', 16));
    setEyeBrightening(clampPortraitControlValue('eyeBrightening', 8));
    setFaceSlimming(0);
    setAgeShift(0);
    setGrain(18);
    setHalation(7);
    setMaterialProfile('matte-photo-paper');
    setMaterialStrength(28);
    setPrintProfile('none');
    setPaperSurface('matte-photo-paper');
    setFilmProfile('fine-35mm');
    setOpticalProfile('glass-diffusion');
    setMaterialFaceProtection(true);
    setMaterialEdgeProtection(true);
    setWorkspaceNotice('Anti-AI Slop Repair applied with face identity protection.');
  };

  const applyPhotographedStack = () => {
    pendingHistoryMetaRef.current = {
      label: 'Photographed stack applied',
      detail: 'Subtle grain, halation, lens softness, and physical finish'
    };
    setShadowCrush(42);
    setMidtones(8);
    setHighlights(10);
    setSaturation(106);
    setHueShift(0);
    setInkBleed(7);
    setClarity(14);
    setArtifactRemoval(clampPortraitControlValue('artifactRemoval', 10));
    setSkinSmoothing(clampPortraitControlValue('skinSmoothing', 6));
    setSkinPolish(clampPortraitControlValue('skinPolish', 14));
    setBeautyBoost(clampPortraitControlValue('beautyBoost', 12));
    setGrain(22);
    setHalation(10);
    setVignette(8);
    setMaterialProfile('matte-photo-paper');
    setMaterialStrength(22);
    setPrintProfile('none');
    setPaperSurface('matte-photo-paper');
    setFilmProfile('fine-35mm');
    setOpticalProfile('pro-mist');
    setMaterialFaceProtection(true);
    setMaterialEdgeProtection(true);
    setWorkspaceNotice('Make It Look Photographed stack applied.');
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
    localStorage.setItem(CUSTOM_PRESET_STORAGE_KEY, serializeCustomPresetBundle(nextCustomPresets));
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

    localStorage.setItem(CUSTOM_PRESET_STORAGE_KEY, serializeCustomPresetBundle(nextCustomPresets));
  };

  const exportCustomPresets = () => {
    setActiveMenu(null);
    if (customPresets.length === 0) {
      setWorkspaceNotice('No custom preset bundle to export yet.');
      return;
    }

    const blob = new Blob([serializeCustomPresetBundle(customPresets)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `format-custom-presets-v${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handlePresetBundleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    setActiveMenu(null);
    if (!file) return;

    try {
      const parsed = parseCustomPresetBundle(await file.text());
      const nextCustomPresets = mergeCustomPresets(customPresets, parsed.presets);
      setCustomPresets(nextCustomPresets);
      localStorage.setItem(CUSTOM_PRESET_STORAGE_KEY, serializeCustomPresetBundle(nextCustomPresets));
      setActiveCategory(CUSTOM_PRESET_CATEGORY);
      const warningText = parsed.warning ? ` ${parsed.warning}` : '';
      setWorkspaceNotice(
        `Imported ${parsed.presets.length} preset${parsed.presets.length === 1 ? '' : 's'}.${warningText}`
      );
    } catch (error) {
      console.warn('Preset bundle import failed.', error);
      setWorkspaceNotice(error instanceof Error ? error.message : 'Preset bundle import failed.');
    }
  };

  const { exportImage, handleImageUpload, handleRemoveImage } = useImageWorkspace({
    originalImageRef,
    canvasRef,
    renderSurfaceRef,
    setImageSrc,
    setPreviewImageSrc,
    setSourceImageSize,
    setWorkspaceNotice,
    setImageReady,
    setIsFocusMode,
    setRenderRevision,
    setIsUpscalePreviewing,
    setUpscaleFallbackNotice,
    setIsProcessing,
    setPortraitSuppressed,
    applySnapshot,
    resetUpscaleControls,
    clearPendingHistoryMeta: () => {
      pendingHistoryMetaRef.current = null;
    },
    buildExportCanvas,
    upscaleEnabled,
    upscaleScaleFactor
  });

  useEffect(() => {
    return () => {
      if (sliderInteractionTimeoutRef.current) {
        clearTimeout(sliderInteractionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    syncCanvasDisplaySize();
    const resizeObserver = new ResizeObserver(syncCanvasDisplaySize);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }
    window.addEventListener('resize', syncCanvasDisplaySize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncCanvasDisplaySize);
    };
  }, [imageReady, zoomLevel, isFocusMode, syncCanvasDisplaySize]);


  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

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

  const renderCanvas = useCallback(async (renderMode: 'preview' | 'export' = 'preview'): Promise<HTMLCanvasElement | null> => {
    const previewCanvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!img || (renderMode === 'preview' && !previewCanvas)) return null;

    if (!renderSurfaceRef.current) {
      renderSurfaceRef.current = document.createElement('canvas');
    }

    const renderRequestId = ++renderRequestRef.current;
    const canvas = document.createElement('canvas');

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    // MANDATORY FOR HYPER-REALISM
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const maxWidth = renderMode === 'export' ? Math.min(4096, img.width) : isSliderInteracting ? 1100 : 1600;
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

    if (materialProfile !== 'none' || printProfile !== 'none' || filmProfile !== 'none' || opticalProfile !== 'none' || paperSurface !== 'none') {
      const materialRandom = createSeededRandom(deterministicSeed ^ 0x4d47544d);
      const materialResult = await applyMaterialFinishWithKernelScheduler(ctx, canvas, {
        materialProfile,
        materialStrength: isSliderInteracting ? Math.min(materialStrength, 36) : materialStrength,
        printProfile,
        paperSurface,
        filmProfile,
        opticalProfile,
        faceProtection: materialFaceProtection,
        edgeProtection: materialEdgeProtection
      }, materialRandom, {
        scheduler: kernelSchedulerRef.current,
        requestId: renderRequestId,
        seed: deterministicSeed ^ 0x4d47544d,
        priority: renderMode === 'export' ? 'export' : 'preview',
        quality: renderMode === 'export' ? 'export' : isSliderInteracting ? 'fast-preview' : 'full-preview'
      });

      if (materialResult.stale || (renderMode === 'preview' && renderRequestId !== renderRequestRef.current)) {
        return null;
      }

      if (process.env.NODE_ENV !== 'production' && materialResult.warnings.length > 0) {
        console.debug('Material kernel fallback:', materialResult.warnings.join('; '));
      }
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

    if (renderMode === 'preview' && renderRequestId !== renderRequestRef.current) {
      return null;
    }

    const committedCanvas = renderSurfaceRef.current ?? document.createElement('canvas');
    renderSurfaceRef.current = committedCanvas;
    committedCanvas.width = canvas.width;
    committedCanvas.height = canvas.height;
    const committedCtx = committedCanvas.getContext('2d', { willReadFrequently: true });
    if (!committedCtx) return null;
    committedCtx.clearRect(0, 0, committedCanvas.width, committedCanvas.height);
    committedCtx.drawImage(canvas, 0, 0);

    if (renderMode === 'preview' && previewCanvas) {
      drawCanvasToPreview(committedCanvas, previewCanvas);
      setRenderRevision((value) => value + 1);
    }

    try {
      const outputData = committedCtx.getImageData(0, 0, committedCanvas.width, committedCanvas.height).data;
      setRenderFingerprint(createRenderFingerprint({
        sourceDimensions: sourceImageSize,
        renderDimensions: { width: committedCanvas.width, height: committedCanvas.height },
        snapshot: createSnapshot(),
        deterministicSeed,
        outputData
      }));
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('Render fingerprint output hash unavailable.', error);
      }
      setRenderFingerprint(createRenderFingerprint({
        sourceDimensions: sourceImageSize,
        renderDimensions: { width: committedCanvas.width, height: committedCanvas.height },
        snapshot: createSnapshot(),
        deterministicSeed
      }));
    }

    return committedCanvas;
  }, [imageReady, portraitGuide, skinSmoothing, glowUp, faceSlimming, blemishRemoval, expressionLift, beautyBoost, ageShift, eyeBrightening, jawDefinition, skinPolish, teethWhitening, makeupStrength, artifactRemoval, clarity, isSliderInteracting, inkBleed, shadowCrush, midtones, highlights, activeLUT, grain, threshold, saturation, hueShift, halation, chromaOffset, monochrome, halftone, scanlines, vignette, lightLeak, lightLeakStyle, gradientMap, prismBlur, colorKnockout, textureType, textureIntensity, dustAndScratches, sparkles, camcorderOSD, materialProfile, materialStrength, printProfile, paperSurface, filmProfile, opticalProfile, materialFaceProtection, materialEdgeProtection, sourceImageSize, createSnapshot]);

  useEffect(() => {
    renderForExportRef.current = () => renderCanvas('export');
    return () => {
      renderForExportRef.current = null;
    };
  }, [renderCanvas]);

  useUpscalePreview({
    canvasRef,
    renderSurfaceRef,
    imageSrc,
    renderRevision,
    upscaleEnabled,
    isSliderInteracting,
    previewUpscaleSettings,
    requestRef: upscaleRequestRef,
    setIsUpscalePreviewing,
    setUpscaleFallbackNotice
  });

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      void renderCanvas('preview');
    });
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

    const summary = HistoryManager.summarizeChange(snapshotSyncRef.current, nextSnapshot);
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
    applySnapshot(reduceEditorSnapshot(createSnapshot(), { type: 'apply-preset', preset }), { skipHistory: false });
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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredPresets = allPresets
    .filter((preset) => {
      const searchableText = [
        preset.name,
        preset.category,
        preset.family,
        preset.previewTone,
        preset.subjectBias,
        preset.intensity,
        preset.description,
        ...(preset.usageTags ?? []),
        ...(preset.bestFor ?? []),
        ...(preset.avoidFor ?? [])
      ].join(' ').toLowerCase();
      const searchMatches = normalizedSearchTerm.length === 0 || searchableText.includes(normalizedSearchTerm);
      const categoryMatches = activeCategory ? preset.category === activeCategory : true;
      const hideExperimentalByDefault = !activeCategory && normalizedSearchTerm.length === 0 && preset.family === 'experimental';

      return searchMatches && categoryMatches && !hideExperimentalByDefault;
    })
    .sort((a, b) => (
      (b.tier === 'hero' ? 1 : 0) - (a.tier === 'hero' ? 1 : 0)
      || b.oneClickScore - a.oneClickScore
      || b.commercialScore - a.commercialScore
      || b.viralScore - a.viralScore
    ));

  return (
    <div className="flex flex-col h-screen w-full bg-[#181818] text-[#e0e0e0] font-sans text-[13px] overflow-hidden">
      <TopMenu
        menuRef={menuRef}
        fileInputRef={fileInputRef}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        setHelpOpen={setHelpOpen}
        imageSrc={imageSrc}
        exportImage={exportImage}
        openSavePresetDialog={openSavePresetDialog}
        exportCustomPresets={exportCustomPresets}
        importPresetInputRef={importPresetInputRef}
        handleRemoveImage={handleRemoveImage}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        resetSpecificationStack={resetSpecificationStack}
        setLeftPanels={setLeftPanels}
        historyIndex={historyIndex}
        historyEntries={historyEntries}
        compareLocked={compareLocked}
        setCompareLocked={setCompareLocked}
        showOriginal={showOriginal}
        setShowOriginal={setShowOriginal}
        isFocusMode={isFocusMode}
        setIsFocusMode={setIsFocusMode}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
      />

      {/* MIDDLE ROW */}
      <div className="flex-1 flex overflow-hidden">
        
        <LeftSidebar
          isFocusMode={isFocusMode}
          leftPanels={leftPanels}
          availableCategories={availableCategories}
          filteredPresets={filteredPresets}
          searchTerm={searchTerm}
          activeCategory={activeCategory}
          imageReady={imageReady}
          previewImageSrc={previewImageSrc}
          historyEntries={historyEntries}
          historyIndex={historyIndex}
          toggleLeftPanel={toggleLeftPanel}
          setSearchTerm={setSearchTerm}
          setActiveCategory={setActiveCategory}
          applyPreset={applyPreset}
          requestDeleteCustomPreset={requestDeleteCustomPreset}
          jumpToHistory={jumpToHistory}
        />
        <CanvasStage
          imageSrc={imageSrc}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          isFocusMode={isFocusMode}
          setIsFocusMode={setIsFocusMode}
          canvasStageRef={canvasStageRef}
          canvasRef={canvasRef}
          handleImageUpload={handleImageUpload}
          workspaceNotice={workspaceNotice}
          capabilityNotices={capabilityNotices}
          showOriginal={showOriginal}
          compareLocked={compareLocked}
          showFaceTargets={showFaceTargets}
          portraitGuides={portraitGuides}
          sourceImageSize={sourceImageSize}
          canvasDisplaySize={canvasDisplaySize}
          selectedFaceIndex={selectedFaceIndex}
          setSelectedFaceIndex={setSelectedFaceIndex}
          inspectorMode={inspectorMode}
          setInspectorMode={setInspectorMode}
        />

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
              <button
                type="button"
                className="w-full px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#e8a82d]"
                onClick={() => togglePanel('camera')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-[#e8a82d]" /> Camera Simulation
                </span>
                {openPanels.camera ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              
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
              <button
                type="button"
                className="w-full px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#e8a82d]"
                onClick={() => togglePanel('tones')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-[#e8a82d]" /> Tone & Color
                </span>
                {openPanels.tones ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              
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
              <button
                type="button"
                className="w-full px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#e8a82d]"
                onClick={() => togglePanel('retouch')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                   <Sparkles className="w-3.5 h-3.5 text-[#e8a82d]" /> Face & Airbrush
                </span>
                {openPanels.retouch ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              
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

                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={applyAntiAiSlopRepair}
                          className="w-full rounded-[3px] border border-[#5a4823] bg-[#1a1711] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#f3e6c4] transition-colors hover:border-[#e8a82d] hover:bg-[#252016] hover:text-[#e8a82d] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
                        >
                          Anti-AI Slop Repair
                        </button>
                        <button
                          type="button"
                          onClick={applyPhotographedStack}
                          className="w-full rounded-[3px] border border-[#444] bg-[#151515] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#d7d1c5] transition-colors hover:border-[#e8a82d] hover:bg-[#222] hover:text-white focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
                        >
                          Make It Look Photographed
                        </button>
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
              <button
                type="button"
                className="w-full px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#e8a82d]"
                onClick={() => togglePanel('optics')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <Aperture className="w-3.5 h-3.5 text-[#e8a82d]" /> Lens Optics
                </span>
                {openPanels.optics ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              
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
              <button
                type="button"
                className="w-full px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#e8a82d]"
                onClick={() => togglePanel('texture')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <Droplet className="w-3.5 h-3.5 text-[#e8a82d]" /> Particles & Texture
                </span>
                {openPanels.texture ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              
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
                            {TEXTURE_ASSETS.map((texture) => (
                              <option key={texture.id} value={texture.id}>{texture.label}</option>
                            ))}
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

            {/* MATERIAL FINISH PANEL */}
            <div className="mb-2">
              <button
                type="button"
                className="w-full px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#e8a82d]"
                onClick={() => togglePanel('material')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <Box className="w-3.5 h-3.5 text-[#e8a82d]" /> Material Finish
                </span>
                {openPanels.material ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              <AnimatePresence>
                {openPanels.material && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="p-4 pt-1 flex flex-col gap-4">
                      <div className="flex flex-wrap gap-1">
                        {[
                          materialFaceProtection ? 'Portrait Safe' : null,
                          printProfile !== 'none' ? 'Print' : null,
                          filmProfile !== 'none' ? 'Film' : null,
                          paperSurface !== 'none' ? 'Paper' : null,
                          materialProfile.includes('xerox') || materialProfile.includes('bitmap') ? 'Graphic' : null,
                          materialProfile.includes('jpeg') || materialProfile.includes('crt') ? 'Experimental' : null
                        ].filter(Boolean).map((badge) => (
                          <span key={badge} className="rounded-[2px] border border-[#4b4027] bg-[#17130d] px-1.5 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[#d1b170]">{badge}</span>
                        ))}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-[#aaa] font-medium uppercase tracking-[0.12em]">Material Profile</span>
                        <select aria-label="Material Profile" value={materialProfile} onChange={(event) => setMaterialProfile(event.target.value)} className="w-full bg-[#141414] border border-[#444] text-white text-[12px] p-2 rounded-[3px] focus:outline-none focus:border-[#e8a82d]">
                          {MATERIAL_PRESETS.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
                        </select>
                      </div>

                      <ControlSlider label="Material Strength" value={materialStrength} onChange={setMaterialStrength} min={0} max={100} />

                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.12em] text-[#888]">
                          Print Mode
                          <select value={printProfile} onChange={(event) => setPrintProfile(event.target.value as PrintMode)} className="bg-[#141414] border border-[#444] text-white text-[11px] p-2 rounded-[3px]">
                            <option value="none">None</option>
                            <option value="am-halftone">AM Halftone</option>
                            <option value="cmyk-halftone">CMYK Halftone</option>
                            <option value="risograph">Risograph</option>
                            <option value="xerox">Xerox</option>
                            <option value="ordered-dither">Ordered Dither</option>
                            <option value="error-diffusion">Error Diffusion</option>
                            <option value="manga-tone">Manga Tone</option>
                            <option value="newsprint">Newsprint</option>
                          </select>
                        </label>
                        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.12em] text-[#888]">
                          Paper Surface
                          <select value={paperSurface} onChange={(event) => setPaperSurface(event.target.value as PaperSurface)} className="bg-[#141414] border border-[#444] text-white text-[11px] p-2 rounded-[3px]">
                            <option value="none">None</option>
                            <option value="cold-press-paper">Cold Press</option>
                            <option value="hot-press-paper">Hot Press</option>
                            <option value="newsprint">Newsprint</option>
                            <option value="magazine-paper">Magazine</option>
                            <option value="matte-photo-paper">Matte Photo</option>
                            <option value="glossy-photo-paper">Glossy Photo</option>
                            <option value="linen-fiber">Linen</option>
                            <option value="canvas-tooth">Canvas</option>
                            <option value="brushed-metal">Metal</option>
                            <option value="glass-reflection">Glass</option>
                          </select>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.12em] text-[#888]">
                          Grain Type
                          <select value={filmProfile} onChange={(event) => setFilmProfile(event.target.value as FilmProfile)} className="bg-[#141414] border border-[#444] text-white text-[11px] p-2 rounded-[3px]">
                            <option value="none">None</option>
                            <option value="fine-35mm">Fine 35mm</option>
                            <option value="pushed-35mm">Pushed 35mm</option>
                            <option value="expired-film">Expired Film</option>
                            <option value="super-8">Super 8</option>
                            <option value="disposable-flash">Disposable</option>
                            <option value="soft-pro-mist">Soft Pro Mist</option>
                            <option value="silver-gelatin">Silver Gelatin</option>
                            <option value="high-iso-phone-night">Phone Night</option>
                          </select>
                        </label>
                        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.12em] text-[#888]">
                          Optical Finish
                          <select value={opticalProfile} onChange={(event) => setOpticalProfile(event.target.value as OpticalProfile)} className="bg-[#141414] border border-[#444] text-white text-[11px] p-2 rounded-[3px]">
                            <option value="none">None</option>
                            <option value="lens-bloom">Lens Bloom</option>
                            <option value="pro-mist">Pro Mist</option>
                            <option value="glass-diffusion">Glass Diffusion</option>
                            <option value="anamorphic-streak">Anamorphic</option>
                            <option value="lens-dirt">Lens Dirt</option>
                            <option value="film-burn">Film Burn</option>
                            <option value="edge-glow">Edge Glow</option>
                          </select>
                        </label>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#aaa]">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={materialFaceProtection} onChange={(event) => setMaterialFaceProtection(event.target.checked)} /> Face Protection</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={materialEdgeProtection} onChange={(event) => setMaterialEdgeProtection(event.target.checked)} /> Edge Protection</label>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setMaterialProfile('none');
                          setMaterialStrength(0);
                          setPrintProfile('none');
                          setPaperSurface('none');
                          setFilmProfile('none');
                          setOpticalProfile('none');
                          setMaterialFaceProtection(true);
                          setMaterialEdgeProtection(true);
                        }}
                        className="rounded-[3px] border border-[#444] px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-[#ccc] hover:border-[#e8a82d] hover:text-white"
                      >
                        Reset Material
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PRINT & OVERLAYS PANEL */}
            <div className="mb-2">
              <button
                type="button"
                className="w-full px-4 py-2 flex justify-between items-center text-[#ddd] cursor-pointer hover:bg-[#252525] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#e8a82d]"
                onClick={() => togglePanel('print')}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <Box className="w-3.5 h-3.5 text-[#e8a82d]" /> Print & CRT Engine
                </span>
                {openPanels.print ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              
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
      {!isFocusMode && (
        <MobileControlDock
          filteredPresets={filteredPresets}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          applyPreset={applyPreset}
          saturation={saturation}
          setSaturation={setSaturation}
          shadowCrush={shadowCrush}
          setShadowCrush={setShadowCrush}
          highlights={highlights}
          setHighlights={setHighlights}
          clarity={clarity}
          setClarity={setClarity}
          skinPolish={skinPolish}
          setSkinPolish={(value) => setSkinPolish(clampPortraitControlValue('skinPolish', value))}
        />
      )}
      {!isFocusMode && (
        <ExportControls
          imageSrc={imageSrc}
          workspaceNotice={workspaceNotice}
          capabilityNotices={capabilityNotices}
          upscaleEnabled={upscaleEnabled}
          setUpscaleEnabled={setUpscaleEnabled}
          upscaleScaleFactor={upscaleScaleFactor}
          setUpscaleScaleFactor={setUpscaleScaleFactor}
          upscaleTuningPreset={upscaleTuningPreset}
          applyUpscalePresetSelection={applyUpscalePresetSelection}
          upscaleModePreset={upscaleModePreset}
          setUpscaleModePreset={setUpscaleModePreset}
          upscaleContentProfile={upscaleContentProfile}
          setUpscaleContentProfile={setUpscaleContentProfile}
          upscaleDetailRecovery={upscaleDetailRecovery}
          setUpscaleDetailRecovery={setUpscaleDetailRecovery}
          upscaleEdgeProtection={upscaleEdgeProtection}
          setUpscaleEdgeProtection={setUpscaleEdgeProtection}
          upscaleAntiHalo={upscaleAntiHalo}
          setUpscaleAntiHalo={setUpscaleAntiHalo}
          markUpscalePresetCustom={markUpscalePresetCustom}
          isUpscalePreviewing={isUpscalePreviewing}
          upscaleFallbackNotice={upscaleFallbackNotice}
          resetSpecificationStack={resetSpecificationStack}
          exportImage={exportImage}
          isProcessing={isProcessing}
          exportQualityInfo={exportQualityInfo}
          exportAspect={exportAspect}
          setExportAspect={setExportAspect}
          renderFingerprint={renderFingerprint}
        />
      )}

      <input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} onInput={handleImageUpload} />
      <input ref={importPresetInputRef} type="file" className="hidden" accept="application/json,.json" onChange={handlePresetBundleImport} />

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
