import type {
  DisposableFlashSettings,
  DisposableFrameMode,
  DisposableStampColor,
  DisposableStampFormat,
  DisposableStampMode,
  DisposableStampPosition
} from '@/lib/effects/effect-types';
import { clampNumber, createSeededRandom, smoothStep } from '@/lib/engine/math-utils';
import type { PortraitPoint } from '@/lib/editor-config';

type DisposableNumericKey = {
  [K in keyof DisposableFlashSettings]: DisposableFlashSettings[K] extends number ? K : never;
}[keyof DisposableFlashSettings];

const NUMERIC_KEYS: DisposableNumericKey[] = [
  'flashStrength',
  'flashFalloff',
  'warmLightLeak',
  'redEdgeBurn',
  'cyanShadowCast',
  'filmGrain',
  'dustAndScratches',
  'plasticLensSoftness',
  'chromaticFringing',
  'vignette'
];

export const DISPOSABLE_FLASH_NUMERIC_KEYS = NUMERIC_KEYS;

export const createNeutralDisposableFlashSettings = (): DisposableFlashSettings => ({
  flashStrength: 0,
  flashFalloff: 0,
  warmLightLeak: 0,
  redEdgeBurn: 0,
  cyanShadowCast: 0,
  filmGrain: 0,
  dustAndScratches: 0,
  plasticLensSoftness: 0,
  chromaticFringing: 0,
  vignette: 0,
  dateStamp: false,
  printFrame: false,
  stampMode: 'off',
  stampFormat: 'MM_DD_YY',
  stampColor: 'orange',
  stampPosition: 'bottom-left',
  customDate: '',
  frameMode: 'off'
});

const STAMP_MODES: DisposableStampMode[] = ['off', 'today', 'seeded-retro', 'custom'];
const STAMP_FORMATS: DisposableStampFormat[] = ['MM_DD_YY', 'DD_MM_YY', 'YYYY_MM_DD'];
const STAMP_COLORS: DisposableStampColor[] = ['orange', 'red', 'white'];
const STAMP_POSITIONS: DisposableStampPosition[] = ['bottom-left', 'bottom-right'];
const FRAME_MODES: DisposableFrameMode[] = ['off', 'in-frame', 'expanded-print'];

const isValidDateString = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const normalizeChoice = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => (
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? value as T : fallback
);

export const normalizeDisposableFlashSettings = (
  settings: Partial<DisposableFlashSettings> | null | undefined
): DisposableFlashSettings => {
  const neutral = createNeutralDisposableFlashSettings();
  const next = { ...neutral, ...(settings ?? {}) };
  const stampModeProvided = typeof settings?.stampMode === 'string';
  const frameModeProvided = typeof settings?.frameMode === 'string';

  for (const key of NUMERIC_KEYS) {
    const value = next[key];
    next[key] = clampNumber(Number.isFinite(value) ? value : 0, 0, 100);
  }

  const legacyDateEnabled = Boolean(next.dateStamp);
  const legacyFrameEnabled = Boolean(next.printFrame);
  next.stampMode = stampModeProvided
    ? normalizeChoice(next.stampMode, STAMP_MODES, legacyDateEnabled ? 'seeded-retro' : 'off')
    : legacyDateEnabled ? 'seeded-retro' : 'off';
  next.stampFormat = normalizeChoice(next.stampFormat, STAMP_FORMATS, 'MM_DD_YY');
  next.stampColor = normalizeChoice(next.stampColor, STAMP_COLORS, 'orange');
  next.stampPosition = normalizeChoice(next.stampPosition, STAMP_POSITIONS, 'bottom-left');
  next.customDate = typeof next.customDate === 'string' ? next.customDate.trim() : '';
  if (!isValidDateString(next.customDate)) {
    next.customDate = '';
  }
  if (next.stampMode === 'custom' && !next.customDate) {
    next.customDate = '';
    next.stampMode = 'seeded-retro';
  }
  next.frameMode = frameModeProvided
    ? normalizeChoice(next.frameMode, FRAME_MODES, legacyFrameEnabled ? 'in-frame' : 'off')
    : legacyFrameEnabled ? 'in-frame' : 'off';
  next.dateStamp = next.stampMode !== 'off';
  next.printFrame = next.frameMode !== 'off';
  return next;
};

export const hasDisposableFlashEffect = (settings: DisposableFlashSettings) => (
  NUMERIC_KEYS.some((key) => settings[key] > 0) || settings.stampMode !== 'off' || settings.frameMode !== 'off'
);

export const mixDisposableFlashSettings = (
  baseSettings: DisposableFlashSettings,
  targetSettings: DisposableFlashSettings,
  intensity: number
): DisposableFlashSettings => {
  const safeIntensity = clampNumber(Number.isFinite(intensity) ? intensity : 0, 0, 100);
  const blend = safeIntensity / 100;
  const base = normalizeDisposableFlashSettings(baseSettings);
  const target = normalizeDisposableFlashSettings(targetSettings);
  const next = { ...base };

  for (const key of NUMERIC_KEYS) {
    next[key] = Math.round((base[key] + ((target[key] - base[key]) * blend)) * 100) / 100;
  }

  if (safeIntensity >= 65) {
    next.stampMode = target.stampMode;
    next.stampFormat = target.stampFormat;
    next.stampColor = target.stampColor;
    next.stampPosition = target.stampPosition;
    next.customDate = target.customDate;
  } else {
    next.stampMode = base.stampMode;
    next.stampFormat = base.stampFormat;
    next.stampColor = base.stampColor;
    next.stampPosition = base.stampPosition;
    next.customDate = base.customDate;
  }
  next.frameMode = safeIntensity >= 45 ? target.frameMode : base.frameMode;
  next.dateStamp = next.stampMode !== 'off';
  next.printFrame = next.frameMode !== 'off';
  return normalizeDisposableFlashSettings(next);
};

type LightLeakPlan = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: 'amber' | 'orange' | 'red' | 'yellow';
};

type ScratchPlan = {
  x: number;
  y: number;
  length: number;
  drift: number;
  alpha: number;
  width: number;
};

type DustPlan = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
};

export type DisposableFlashRenderPlan = {
  seed: number;
  width: number;
  height: number;
  flashCenter: PortraitPoint;
  flashRadius: number;
  leaks: LightLeakPlan[];
  scratches: ScratchPlan[];
  dust: DustPlan[];
  frame: {
    borderPx: number;
    bottomPx: number;
  };
};

export const buildDisposableFlashRenderPlan = (
  width: number,
  height: number,
  settings: DisposableFlashSettings,
  seed: number,
  subjectCenter?: PortraitPoint | null
): DisposableFlashRenderPlan => {
  const safe = normalizeDisposableFlashSettings(settings);
  const rng = createSeededRandom(seed);
  const flashCenter = subjectCenter ?? {
    x: width * (0.47 + (rng() - 0.5) * 0.08),
    y: height * (0.43 + (rng() - 0.5) * 0.08)
  };
  const falloff = safe.flashFalloff / 100;
  const flashRadius = Math.max(width, height) * (0.56 + falloff * 0.46);

  const leaks: LightLeakPlan[] = [];
  const leakStrength = Math.max(safe.warmLightLeak, safe.redEdgeBurn);
  const leakCount = 3;
  const colors: LightLeakPlan['color'][] = ['amber', 'orange', 'red', 'yellow'];
  for (let index = 0; index < leakCount; index += 1) {
    const edgeBias = index % 2 === 0 ? -0.08 : 1.08;
    leaks.push({
      x: width * (edgeBias + (rng() - 0.5) * 0.22),
      y: height * (0.12 + rng() * 0.82),
      radius: Math.max(width, height) * (0.22 + rng() * 0.28),
      alpha: (0.08 + rng() * 0.14) * (leakStrength / 100),
      color: colors[Math.floor(rng() * colors.length)] ?? 'amber'
    });
  }

  const scratchCount = Math.round(18 + safe.dustAndScratches * 0.62);
  const scratches: ScratchPlan[] = [];
  for (let index = 0; index < scratchCount; index += 1) {
    scratches.push({
      x: rng() * width,
      y: rng() * height,
      length: height * (0.035 + rng() * 0.16),
      drift: (rng() - 0.5) * width * 0.035,
      alpha: 0.018 + rng() * 0.1 * (safe.dustAndScratches / 100),
      width: 0.35 + rng() * 1.15
    });
  }

  const dustCount = Math.round(50 + safe.dustAndScratches * 2.4);
  const dust: DustPlan[] = [];
  for (let index = 0; index < dustCount; index += 1) {
    dust.push({
      x: rng() * width,
      y: rng() * height,
      radius: 0.35 + rng() * 1.8,
      alpha: 0.018 + rng() * 0.14 * (safe.dustAndScratches / 100)
    });
  }

  return {
    seed,
    width,
    height,
    flashCenter: {
      x: clampNumber(flashCenter.x, 0, width),
      y: clampNumber(flashCenter.y, 0, height)
    },
    flashRadius,
    leaks,
    scratches,
    dust,
    frame: {
      borderPx: Math.max(12, Math.round(Math.min(width, height) * 0.038)),
      bottomPx: Math.max(32, Math.round(Math.min(width, height) * 0.095))
    }
  };
};

export type DisposableFlashRenderOptions = {
  fastPreview?: boolean;
};

const pad2 = (value: number) => String(value).padStart(2, '0');

export const formatDisposableDateStamp = (date: Date, format: DisposableStampFormat) => {
  const year = date.getUTCFullYear();
  const month = pad2(date.getUTCMonth() + 1);
  const day = pad2(date.getUTCDate());
  const shortYear = pad2(year % 100);
  if (format === 'DD_MM_YY') return `${day} ${month} ${shortYear}`;
  if (format === 'YYYY_MM_DD') return `${year} ${month} ${day}`;
  return `${month} ${day} ${shortYear}`;
};

const seededRetroDate = (seed: number) => {
  const rng = createSeededRandom(seed ^ 0x991999);
  const start = Date.UTC(1994, 0, 1);
  const end = Date.UTC(2007, 11, 31);
  const value = start + Math.floor(rng() * (end - start));
  return new Date(value);
};

export const resolveDisposableDateStamp = (
  settings: DisposableFlashSettings,
  seed: number,
  now = new Date()
) => {
  const safe = normalizeDisposableFlashSettings(settings);
  if (safe.stampMode === 'off') return '';
  if (safe.stampMode === 'today') {
    return formatDisposableDateStamp(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())), safe.stampFormat);
  }
  if (safe.stampMode === 'custom' && isValidDateString(safe.customDate)) {
    return formatDisposableDateStamp(new Date(`${safe.customDate}T00:00:00.000Z`), safe.stampFormat);
  }
  return formatDisposableDateStamp(seededRetroDate(seed), safe.stampFormat);
};

export const buildExpandedPrintFrameMetrics = (width: number, height: number) => {
  const shortEdge = Math.min(width, height);
  const borderPx = Math.max(18, Math.round(shortEdge * 0.055));
  const bottomPx = Math.max(46, Math.round(shortEdge * 0.15));
  return {
    width: width + borderPx * 2,
    height: height + borderPx + bottomPx,
    imageX: borderPx,
    imageY: borderPx,
    imageWidth: width,
    imageHeight: height,
    borderPx,
    bottomPx
  };
};

const clampChannel = (value: number) => clampNumber(Math.round(value), 0, 255);

const applyToneAndGrainPass = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: DisposableFlashSettings,
  seed: number
) => {
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = data.data;
  const rng = createSeededRandom(seed ^ 0xa6f11a5);
  const flash = settings.flashStrength / 100;
  const cyan = settings.cyanShadowCast / 100;
  const grain = settings.filmGrain / 100;

  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const luma = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    const shadowWeight = 1 - smoothStep(42, 180, luma);
    const highlightWeight = smoothStep(160, 255, luma);
    const blackLift = flash * 12;
    const crunch = 1 + flash * 0.18;
    const grainGain = grain * (0.34 + shadowWeight * 0.82 + (1 - highlightWeight) * 0.2);
    const lumaNoise = (rng() - 0.5) * 58 * grainGain;
    const chromaNoise = (rng() - 0.5) * 22 * grainGain;
    const cyanPush = cyan * shadowWeight;
    const warmFlash = flash * highlightWeight;

    pixels[index] = clampChannel(((r - 128) * crunch) + 128 + blackLift - cyanPush * 18 + warmFlash * 12 + lumaNoise + chromaNoise);
    pixels[index + 1] = clampChannel(((g - 128) * crunch) + 128 + blackLift + cyanPush * 15 + lumaNoise);
    pixels[index + 2] = clampChannel(((b - 128) * crunch) + 128 + blackLift + cyanPush * 28 - warmFlash * 8 + lumaNoise - chromaNoise);
  }

  ctx.putImageData(data, 0, 0);
};

const drawFlashExposure = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  plan: DisposableFlashRenderPlan,
  settings: DisposableFlashSettings
) => {
  if (settings.flashStrength <= 0) return;

  const strength = settings.flashStrength / 100;
  const gradient = ctx.createRadialGradient(
    plan.flashCenter.x,
    plan.flashCenter.y,
    Math.max(12, plan.flashRadius * 0.045),
    plan.flashCenter.x,
    plan.flashCenter.y,
    plan.flashRadius
  );
  gradient.addColorStop(0, `rgba(255,244,219,${(0.42 * strength).toFixed(3)})`);
  gradient.addColorStop(0.28, `rgba(255,247,225,${(0.22 * strength).toFixed(3)})`);
  gradient.addColorStop(0.72, `rgba(255,255,255,${(0.06 * strength).toFixed(3)})`);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
};

const drawCheapLensSoftness = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: DisposableFlashSettings
) => {
  if (settings.plasticLensSoftness <= 0) return;

  const strength = settings.plasticLensSoftness / 100;
  const copy = document.createElement('canvas');
  copy.width = canvas.width;
  copy.height = canvas.height;
  copy.getContext('2d')?.drawImage(canvas, 0, 0);

  ctx.save();
  ctx.filter = `blur(${(0.5 + strength * 2.2).toFixed(2)}px)`;
  ctx.globalAlpha = 0.12 + strength * 0.2;
  ctx.drawImage(copy, 0, 0);
  ctx.restore();
};

const drawLightLeaks = (
  ctx: CanvasRenderingContext2D,
  plan: DisposableFlashRenderPlan,
  settings: DisposableFlashSettings
) => {
  if (settings.warmLightLeak <= 0 && settings.redEdgeBurn <= 0) return;

  const colorStops: Record<LightLeakPlan['color'], string> = {
    amber: '255,185,72',
    orange: '255,116,34',
    red: '255,48,26',
    yellow: '255,230,117'
  };

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const leak of plan.leaks) {
    const gradient = ctx.createRadialGradient(leak.x, leak.y, 0, leak.x, leak.y, leak.radius);
    gradient.addColorStop(0, `rgba(${colorStops[leak.color]},${leak.alpha.toFixed(3)})`);
    gradient.addColorStop(0.45, `rgba(${colorStops[leak.color]},${(leak.alpha * 0.46).toFixed(3)})`);
    gradient.addColorStop(1, 'rgba(255,140,24,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, plan.width, plan.height);
  }

  if (settings.redEdgeBurn > 0) {
    const alpha = settings.redEdgeBurn / 100;
    const left = ctx.createLinearGradient(0, 0, plan.width * 0.42, 0);
    left.addColorStop(0, `rgba(255,28,12,${(0.2 * alpha).toFixed(3)})`);
    left.addColorStop(0.4, `rgba(255,112,31,${(0.08 * alpha).toFixed(3)})`);
    left.addColorStop(1, 'rgba(255,112,31,0)');
    ctx.fillStyle = left;
    ctx.fillRect(0, 0, plan.width, plan.height);

    const right = ctx.createLinearGradient(plan.width, 0, plan.width * 0.58, 0);
    right.addColorStop(0, `rgba(255,58,22,${(0.16 * alpha).toFixed(3)})`);
    right.addColorStop(1, 'rgba(255,58,22,0)');
    ctx.fillStyle = right;
    ctx.fillRect(0, 0, plan.width, plan.height);
  }
  ctx.restore();
};

const drawDustAndScratches = (
  ctx: CanvasRenderingContext2D,
  plan: DisposableFlashRenderPlan,
  settings: DisposableFlashSettings
) => {
  if (settings.dustAndScratches <= 0) return;

  const strength = settings.dustAndScratches / 100;
  const distress = document.createElement('canvas');
  distress.width = plan.width;
  distress.height = plan.height;
  const dtx = distress.getContext('2d');
  if (!dtx) return;

  dtx.lineCap = 'round';
  dtx.strokeStyle = 'rgba(255,255,255,0.12)';
  for (const scratch of plan.scratches) {
    dtx.globalAlpha = scratch.alpha;
    dtx.lineWidth = scratch.width;
    dtx.beginPath();
    dtx.moveTo(scratch.x, scratch.y);
    dtx.lineTo(scratch.x + scratch.drift, scratch.y + scratch.length);
    dtx.stroke();
  }

  for (const dot of plan.dust) {
    dtx.globalAlpha = dot.alpha;
    dtx.fillStyle = 'rgba(255,255,255,0.9)';
    dtx.beginPath();
    dtx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    dtx.fill();
  }

  dtx.globalAlpha = 1;
  dtx.filter = `blur(${(0.08 + strength * 0.38).toFixed(2)}px)`;
  dtx.drawImage(distress, 0, 0);
  dtx.filter = 'none';

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = clampNumber(0.18 + strength * 0.46, 0, 0.56);
  ctx.drawImage(distress, 0, 0);
  ctx.restore();
};

const applyChromaticFringing = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: DisposableFlashSettings
) => {
  if (settings.chromaticFringing <= 0) return;

  const shift = Math.max(1, Math.round((settings.chromaticFringing / 100) * Math.max(3, canvas.width * 0.006)));
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4;
      const edgeX = Math.abs((x / Math.max(1, canvas.width - 1)) - 0.5) * 2;
      const edgeY = Math.abs((y / Math.max(1, canvas.height - 1)) - 0.5) * 2;
      const edgeWeight = smoothStep(0.3, 1, Math.max(edgeX, edgeY));
      const localShift = Math.max(1, Math.round(shift * edgeWeight));
      const redIndex = (y * canvas.width + Math.max(0, x - localShift)) * 4;
      const blueIndex = (y * canvas.width + Math.min(canvas.width - 1, x + localShift)) * 4;

      data[index] = copy[redIndex];
      data[index + 2] = copy[blueIndex + 2];
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

const drawVignette = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: DisposableFlashSettings
) => {
  if (settings.vignette <= 0) return;

  const strength = settings.vignette / 100;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.max(canvas.width, canvas.height) * 0.75;
  const gradient = ctx.createRadialGradient(cx, cy, radius * 0.38, cx, cy, radius);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.7, `rgba(20,10,4,${(0.08 * strength).toFixed(3)})`);
  gradient.addColorStop(1, `rgba(0,0,0,${(0.42 * strength).toFixed(3)})`);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
};

const drawPrintFrameAndDate = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  plan: DisposableFlashRenderPlan,
  settings: DisposableFlashSettings,
  seed: number
) => {
  if (settings.frameMode === 'expanded-print') return;
  if (settings.frameMode === 'off' && settings.stampMode === 'off') return;

  ctx.save();
  if (settings.frameMode === 'in-frame') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(245,241,230,0.96)';
    ctx.fillRect(0, 0, canvas.width, plan.frame.borderPx);
    ctx.fillRect(0, 0, plan.frame.borderPx, canvas.height);
    ctx.fillRect(canvas.width - plan.frame.borderPx, 0, plan.frame.borderPx, canvas.height);
    ctx.fillRect(0, canvas.height - plan.frame.bottomPx, canvas.width, plan.frame.bottomPx);
  }

  if (settings.stampMode !== 'off') {
    const pad = Math.max(14, Math.round(canvas.width * 0.018));
    const fontSize = Math.max(18, Math.round(Math.min(canvas.width, canvas.height) * 0.035));
    ctx.font = `700 ${fontSize}px monospace`;
    ctx.textBaseline = 'bottom';
    const text = resolveDisposableDateStamp(settings, seed);
    const textWidth = ctx.measureText(text).width;
    const x = settings.stampPosition === 'bottom-right'
      ? canvas.width - pad - textWidth
      : pad;
    const y = canvas.height - pad;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(x - 7, y - fontSize - 5, textWidth + 14, fontSize + 10);
    ctx.shadowColor = 'rgba(0,0,0,0.72)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = stampFillStyle(settings.stampColor);
    ctx.fillText(text, x, y);
  }
  ctx.restore();
};

const stampFillStyle = (color: DisposableStampColor) => {
  if (color === 'red') return 'rgba(255,67,47,0.92)';
  if (color === 'white') return 'rgba(255,245,225,0.9)';
  return 'rgba(255,146,42,0.92)';
};

export const createExpandedDisposablePrintCanvas = (
  sourceCanvas: HTMLCanvasElement,
  settings: DisposableFlashSettings,
  seed: number
) => {
  const safe = normalizeDisposableFlashSettings(settings);
  if (safe.frameMode !== 'expanded-print') return sourceCanvas;

  const metrics = buildExpandedPrintFrameMetrics(sourceCanvas.width, sourceCanvas.height);
  const expanded = document.createElement('canvas');
  expanded.width = metrics.width;
  expanded.height = metrics.height;
  const ctx = expanded.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  ctx.fillStyle = '#f2ecde';
  ctx.fillRect(0, 0, expanded.width, expanded.height);
  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let y = 0; y < expanded.height; y += Math.max(4, Math.round(metrics.borderPx / 3))) {
    ctx.fillStyle = y % 2 === 0 ? 'rgba(180,160,120,0.05)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, y, expanded.width, 1);
  }
  ctx.restore();

  ctx.drawImage(sourceCanvas, metrics.imageX, metrics.imageY, metrics.imageWidth, metrics.imageHeight);

  if (safe.stampMode !== 'off') {
    const text = resolveDisposableDateStamp(safe, seed);
    const pad = Math.max(16, Math.round(metrics.borderPx * 0.8));
    const fontSize = Math.max(18, Math.round(Math.min(sourceCanvas.width, sourceCanvas.height) * 0.035));
    ctx.font = `700 ${fontSize}px monospace`;
    ctx.textBaseline = 'bottom';
    const textWidth = ctx.measureText(text).width;
    const x = safe.stampPosition === 'bottom-right'
      ? expanded.width - pad - textWidth
      : pad;
    const y = expanded.height - Math.max(12, Math.round(metrics.bottomPx * 0.28));
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.fillRect(x - 7, y - fontSize - 5, textWidth + 14, fontSize + 10);
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 1;
    ctx.fillStyle = stampFillStyle(safe.stampColor);
    ctx.fillText(text, x, y);
  }

  return expanded;
};

export const applyDisposableFlashFilm = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: DisposableFlashSettings,
  seed: number,
  subjectCenter?: PortraitPoint | null,
  options: DisposableFlashRenderOptions = {}
) => {
  const safe = normalizeDisposableFlashSettings(settings);
  if (!hasDisposableFlashEffect(safe)) return;

  const plan = buildDisposableFlashRenderPlan(canvas.width, canvas.height, safe, seed, subjectCenter);
  const renderSettings = options.fastPreview
    ? {
        ...safe,
        filmGrain: Math.min(safe.filmGrain, 18),
        dustAndScratches: 0,
        chromaticFringing: Math.min(safe.chromaticFringing, 8),
        plasticLensSoftness: Math.min(safe.plasticLensSoftness, 24)
      }
    : safe;

  drawFlashExposure(ctx, canvas, plan, renderSettings);
  drawCheapLensSoftness(ctx, canvas, renderSettings);
  if (!options.fastPreview) {
    applyToneAndGrainPass(ctx, canvas, renderSettings, seed);
  } else if (renderSettings.cyanShadowCast > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = Math.min(0.18, renderSettings.cyanShadowCast / 520);
    ctx.fillStyle = 'rgb(42,120,132)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  drawLightLeaks(ctx, plan, renderSettings);
  if (!options.fastPreview) {
    drawDustAndScratches(ctx, plan, renderSettings);
    applyChromaticFringing(ctx, canvas, renderSettings);
  }
  drawVignette(ctx, canvas, renderSettings);
  drawPrintFrameAndDate(ctx, canvas, plan, safe, seed);
};
