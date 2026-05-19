export type PreciseSliderBounds = {
  min: number;
  max: number;
  step?: number;
};

export type SliderInputParseOptions = PreciseSliderBounds & {
  fallback: number;
};

const countDecimals = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  const text = String(value);
  const decimal = text.split('.')[1];
  return decimal ? decimal.length : 0;
};

export const normalizePreciseSliderValue = (
  value: number,
  { min, max, step = 1 }: PreciseSliderBounds
) => {
  if (!Number.isFinite(value)) return min;

  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const clamped = Math.min(safeMax, Math.max(safeMin, value));
  const stepped = Math.round((clamped - safeMin) / safeStep) * safeStep + safeMin;
  const precision = countDecimals(safeStep);

  return Number(Math.min(safeMax, Math.max(safeMin, stepped)).toFixed(precision));
};

export const sliderInputTextToValue = (
  text: string,
  { min, max, step = 1, fallback }: SliderInputParseOptions
) => {
  const trimmed = text.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') {
    return normalizePreciseSliderValue(fallback, { min, max, step });
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return normalizePreciseSliderValue(fallback, { min, max, step });
  }

  return normalizePreciseSliderValue(parsed, { min, max, step });
};
