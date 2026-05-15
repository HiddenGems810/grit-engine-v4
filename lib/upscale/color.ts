const clampUnit = (value: number) => Math.min(1, Math.max(0, value));

export const srgbToLinear = (value: number) => {
  const normalized = clampUnit(value);
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }
  return Math.pow((normalized + 0.055) / 1.055, 2.4);
};

export const linearToSrgb = (value: number) => {
  const normalized = clampUnit(value);
  if (normalized <= 0.0031308) {
    return normalized * 12.92;
  }
  return 1.055 * Math.pow(normalized, 1 / 2.4) - 0.055;
};

export const getLuma = (r: number, g: number, b: number) => (0.2126 * r) + (0.7152 * g) + (0.0722 * b);

export const reconstructGreen = (luma: number, red: number, blue: number) => {
  return (luma - (0.2126 * red) - (0.0722 * blue)) / 0.7152;
};
