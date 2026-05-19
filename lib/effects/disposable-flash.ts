import type { DisposableFlashSettings } from '@/lib/effects/effect-types';
import { clampNumber, createSeededRandom, smoothStep } from '@/lib/engine/math-utils';
import type { PortraitPoint } from '@/lib/editor-config';

type DisposableNumericKey = Exclude<keyof DisposableFlashSettings, 'dateStamp' | 'printFrame'>;

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
  printFrame: false
});

export const normalizeDisposableFlashSettings = (
  settings: Partial<DisposableFlashSettings> | null | undefined
): DisposableFlashSettings => {
  const neutral = createNeutralDisposableFlashSettings();
  const next = { ...neutral, ...(settings ?? {}) };

  for (const key of NUMERIC_KEYS) {
    const value = next[key];
    next[key] = clampNumber(Number.isFinite(value) ? value : 0, 0, 100);
  }

  next.dateStamp = Boolean(next.dateStamp);
  next.printFrame = Boolean(next.printFrame);
  return next;
};

export const hasDisposableFlashEffect = (settings: DisposableFlashSettings) => (
  NUMERIC_KEYS.some((key) => settings[key] > 0) || settings.dateStamp || settings.printFrame
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

  next.dateStamp = safeIntensity >= 65 ? target.dateStamp : base.dateStamp;
  next.printFrame = safeIntensity >= 45 ? target.printFrame : base.printFrame;
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
  settings: DisposableFlashSettings
) => {
  if (!settings.printFrame && !settings.dateStamp) return;

  ctx.save();
  if (settings.printFrame) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(245,241,230,0.96)';
    ctx.fillRect(0, 0, canvas.width, plan.frame.borderPx);
    ctx.fillRect(0, 0, plan.frame.borderPx, canvas.height);
    ctx.fillRect(canvas.width - plan.frame.borderPx, 0, plan.frame.borderPx, canvas.height);
    ctx.fillRect(0, canvas.height - plan.frame.bottomPx, canvas.width, plan.frame.bottomPx);
  }

  if (settings.dateStamp) {
    const pad = Math.max(14, Math.round(canvas.width * 0.018));
    const fontSize = Math.max(12, Math.round(canvas.width * 0.022));
    ctx.font = `700 ${fontSize}px monospace`;
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 2;
    ctx.fillStyle = 'rgba(255,146,42,0.92)';
    ctx.fillText('09 24 99', pad, canvas.height - pad);
  }
  ctx.restore();
};

export const applyDisposableFlashFilm = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: DisposableFlashSettings,
  seed: number,
  subjectCenter?: PortraitPoint | null
) => {
  const safe = normalizeDisposableFlashSettings(settings);
  if (!hasDisposableFlashEffect(safe)) return;

  const plan = buildDisposableFlashRenderPlan(canvas.width, canvas.height, safe, seed, subjectCenter);

  drawFlashExposure(ctx, canvas, plan, safe);
  drawCheapLensSoftness(ctx, canvas, safe);
  applyToneAndGrainPass(ctx, canvas, safe, seed);
  drawLightLeaks(ctx, plan, safe);
  drawDustAndScratches(ctx, plan, safe);
  applyChromaticFringing(ctx, canvas, safe);
  drawVignette(ctx, canvas, safe);
  drawPrintFrameAndDate(ctx, canvas, plan, safe);
};
