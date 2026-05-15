import { getLuma, linearToSrgb, reconstructGreen, srgbToLinear } from '@/lib/upscale/color';
import { resolveUpscaleSettings } from '@/lib/upscale/presets';
import { ResolvedUpscaleSettings, UpscaleSettings } from '@/lib/upscale/types';

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sinc = (value: number) => {
  if (value === 0) return 1;
  const scaled = Math.PI * value;
  return Math.sin(scaled) / scaled;
};

const lanczosKernel = (x: number, radius: number) => {
  const distance = Math.abs(x);
  if (distance >= radius) return 0;
  return sinc(distance) * sinc(distance / radius);
};

const sampleClamped = (data: Float32Array, width: number, height: number, x: number, y: number) => {
  const safeX = clampNumber(x, 0, width - 1);
  const safeY = clampNumber(y, 0, height - 1);
  return data[(safeY * width) + safeX];
};

const resizeLanczosSeparable = (
  source: Float32Array,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  radius = 3
) => {
  const intermediate = new Float32Array(targetWidth * sourceHeight);
  const horizontalScale = targetWidth / sourceWidth;

  for (let y = 0; y < sourceHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = (x + 0.5) / horizontalScale - 0.5;
      const start = Math.floor(sourceX - radius + 1);
      const end = Math.ceil(sourceX + radius);
      let weightedValue = 0;
      let totalWeight = 0;

      for (let sx = start; sx <= end; sx += 1) {
        const weight = lanczosKernel(sourceX - sx, radius);
        if (weight === 0) continue;
        weightedValue += sampleClamped(source, sourceWidth, sourceHeight, sx, y) * weight;
        totalWeight += weight;
      }

      intermediate[(y * targetWidth) + x] = totalWeight === 0 ? sampleClamped(source, sourceWidth, sourceHeight, Math.round(sourceX), y) : weightedValue / totalWeight;
    }
  }

  const output = new Float32Array(targetWidth * targetHeight);
  const verticalScale = targetHeight / sourceHeight;

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = (y + 0.5) / verticalScale - 0.5;
    const start = Math.floor(sourceY - radius + 1);
    const end = Math.ceil(sourceY + radius);

    for (let x = 0; x < targetWidth; x += 1) {
      let weightedValue = 0;
      let totalWeight = 0;

      for (let sy = start; sy <= end; sy += 1) {
        const weight = lanczosKernel(sourceY - sy, radius);
        if (weight === 0) continue;
        weightedValue += sampleClamped(intermediate, targetWidth, sourceHeight, x, sy) * weight;
        totalWeight += weight;
      }

      output[(y * targetWidth) + x] = totalWeight === 0 ? sampleClamped(intermediate, targetWidth, sourceHeight, x, Math.round(sourceY)) : weightedValue / totalWeight;
    }
  }

  return output;
};

const resizeBilinear = (
  source: Float32Array,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) => {
  const output = new Float32Array(targetWidth * targetHeight);
  const xScale = sourceWidth / targetWidth;
  const yScale = sourceHeight / targetHeight;

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = (y + 0.5) * yScale - 0.5;
    const y0 = Math.floor(sourceY);
    const y1 = Math.min(sourceHeight - 1, y0 + 1);
    const fy = sourceY - y0;

    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = (x + 0.5) * xScale - 0.5;
      const x0 = Math.floor(sourceX);
      const x1 = Math.min(sourceWidth - 1, x0 + 1);
      const fx = sourceX - x0;

      const top = sampleClamped(source, sourceWidth, sourceHeight, x0, y0) * (1 - fx)
        + sampleClamped(source, sourceWidth, sourceHeight, x1, y0) * fx;
      const bottom = sampleClamped(source, sourceWidth, sourceHeight, x0, y1) * (1 - fx)
        + sampleClamped(source, sourceWidth, sourceHeight, x1, y1) * fx;

      output[(y * targetWidth) + x] = top * (1 - fy) + bottom * fy;
    }
  }

  return output;
};

const blurBox = (source: Float32Array, width: number, height: number, radius: number) => {
  if (radius <= 0) {
    return new Float32Array(source);
  }

  const horizontal = new Float32Array(source.length);
  const output = new Float32Array(source.length);
  const kernelSize = radius * 2 + 1;

  for (let y = 0; y < height; y += 1) {
    let sum = 0;
    for (let k = -radius; k <= radius; k += 1) {
      sum += sampleClamped(source, width, height, k, y);
    }

    for (let x = 0; x < width; x += 1) {
      horizontal[(y * width) + x] = sum / kernelSize;
      sum += sampleClamped(source, width, height, x + radius + 1, y);
      sum -= sampleClamped(source, width, height, x - radius, y);
    }
  }

  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let k = -radius; k <= radius; k += 1) {
      sum += sampleClamped(horizontal, width, height, x, k);
    }

    for (let y = 0; y < height; y += 1) {
      output[(y * width) + x] = sum / kernelSize;
      sum += sampleClamped(horizontal, width, height, x, y + radius + 1);
      sum -= sampleClamped(horizontal, width, height, x, y - radius);
    }
  }

  return output;
};

const enhanceLuma = (baseLuma: Float32Array, width: number, height: number, settings: ResolvedUpscaleSettings) => {
  const fineBlur = blurBox(baseLuma, width, height, 1);
  const wideBlur = blurBox(baseLuma, width, height, 2);
  const enhanced = new Float32Array(baseLuma.length);
  const antiRing = clampNumber(settings.antiRingStrength, 0, 1.5);
  const detailStrength = clampNumber(settings.detailStrength, 0, 1.5);
  const edgeStrength = clampNumber(settings.edgeStrength, 0, 1.5);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width) + x;
      const center = baseLuma[index];
      const gx = Math.abs(sampleClamped(baseLuma, width, height, x + 1, y) - sampleClamped(baseLuma, width, height, x - 1, y));
      const gy = Math.abs(sampleClamped(baseLuma, width, height, x, y + 1) - sampleClamped(baseLuma, width, height, x, y - 1));
      const edgeMagnitude = clampNumber((gx + gy) * 2.2, 0, 1);
      const localContrast = center - fineBlur[index];
      const broadContrast = center - wideBlur[index];
      const edgeLimiter = 1 - edgeMagnitude * (0.3 + edgeStrength * 0.35);
      const structureBoost = 0.28 + edgeMagnitude * 0.72;
      const sharpened = center
        + (localContrast * detailStrength * structureBoost * clampNumber(edgeLimiter, 0.18, 1))
        + (broadContrast * detailStrength * 0.2 * (1 - edgeMagnitude * 0.35));

      let localMin = center;
      let localMax = center;
      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          const value = sampleClamped(baseLuma, width, height, x + kx, y + ky);
          localMin = Math.min(localMin, value);
          localMax = Math.max(localMax, value);
        }
      }

      const haloMargin = 0.012 + (1 - clampNumber(antiRing, 0, 1.3)) * 0.06 + (1 - edgeMagnitude) * 0.01;
      const lowerClamp = localMin - haloMargin * 0.35;
      const upperClamp = localMax + haloMargin;
      enhanced[index] = clampNumber(sharpened, lowerClamp, upperClamp);
    }
  }

  return enhanced;
};

const decomposeImage = (imageData: ImageData) => {
  const pixelCount = imageData.width * imageData.height;
  const luma = new Float32Array(pixelCount);
  const chromaBlue = new Float32Array(pixelCount);
  const chromaRed = new Float32Array(pixelCount);
  const alpha = new Float32Array(pixelCount);

  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    const r = srgbToLinear(imageData.data[offset] / 255);
    const g = srgbToLinear(imageData.data[offset + 1] / 255);
    const b = srgbToLinear(imageData.data[offset + 2] / 255);
    const y = getLuma(r, g, b);

    luma[index] = y;
    chromaRed[index] = r - y;
    chromaBlue[index] = b - y;
    alpha[index] = imageData.data[offset + 3] / 255;
  }

  return { luma, chromaBlue, chromaRed, alpha };
};

const composeImage = (
  outputWidth: number,
  outputHeight: number,
  luma: Float32Array,
  chromaBlue: Float32Array,
  chromaRed: Float32Array,
  alpha: Float32Array
) => {
  const output = new ImageData(outputWidth, outputHeight);

  for (let index = 0; index < luma.length; index += 1) {
    const y = luma[index];
    const red = y + chromaRed[index];
    const blue = y + chromaBlue[index];
    const green = reconstructGreen(y, red, blue);
    const offset = index * 4;

    output.data[offset] = Math.round(clampNumber(linearToSrgb(red), 0, 1) * 255);
    output.data[offset + 1] = Math.round(clampNumber(linearToSrgb(green), 0, 1) * 255);
    output.data[offset + 2] = Math.round(clampNumber(linearToSrgb(blue), 0, 1) * 255);
    output.data[offset + 3] = Math.round(clampNumber(alpha[index], 0, 1) * 255);
  }

  return output;
};

const upscaleImageDataDirect = (imageData: ImageData, settings: ResolvedUpscaleSettings, outputWidth: number, outputHeight: number) => {
  const channels = decomposeImage(imageData);
  const upscaledLuma = resizeLanczosSeparable(channels.luma, imageData.width, imageData.height, outputWidth, outputHeight, 3);
  const upscaledBlue = resizeBilinear(channels.chromaBlue, imageData.width, imageData.height, outputWidth, outputHeight);
  const upscaledRed = resizeBilinear(channels.chromaRed, imageData.width, imageData.height, outputWidth, outputHeight);
  const upscaledAlpha = resizeBilinear(channels.alpha, imageData.width, imageData.height, outputWidth, outputHeight);
  const enhancedLuma = enhanceLuma(upscaledLuma, outputWidth, outputHeight, settings);

  return composeImage(outputWidth, outputHeight, enhancedLuma, upscaledBlue, upscaledRed, upscaledAlpha);
};

const cropImageData = (imageData: ImageData, x: number, y: number, width: number, height: number) => {
  const output = new ImageData(width, height);

  for (let row = 0; row < height; row += 1) {
    const sourceStart = ((y + row) * imageData.width + x) * 4;
    const sourceEnd = sourceStart + width * 4;
    output.data.set(imageData.data.slice(sourceStart, sourceEnd), row * width * 4);
  }

  return output;
};

const writeTile = (
  destination: ImageData,
  tile: ImageData,
  destX: number,
  destY: number,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number
) => {
  for (let row = 0; row < cropHeight; row += 1) {
    const tileStart = ((cropY + row) * tile.width + cropX) * 4;
    const tileEnd = tileStart + cropWidth * 4;
    const destinationStart = ((destY + row) * destination.width + destX) * 4;
    destination.data.set(tile.data.slice(tileStart, tileEnd), destinationStart);
  }
};

const upscaleImageDataTiled = (imageData: ImageData, settings: ResolvedUpscaleSettings) => {
  const destination = new ImageData(settings.outputWidth, settings.outputHeight);
  const overlap = settings.tileOverlap;
  const tileSize = settings.tileSize;

  for (let tileY = 0; tileY < settings.outputHeight; tileY += tileSize) {
    for (let tileX = 0; tileX < settings.outputWidth; tileX += tileSize) {
      const coreWidth = Math.min(tileSize, settings.outputWidth - tileX);
      const coreHeight = Math.min(tileSize, settings.outputHeight - tileY);
      const expandedX = Math.max(0, tileX - overlap);
      const expandedY = Math.max(0, tileY - overlap);
      const expandedRight = Math.min(settings.outputWidth, tileX + coreWidth + overlap);
      const expandedBottom = Math.min(settings.outputHeight, tileY + coreHeight + overlap);
      const expandedWidth = expandedRight - expandedX;
      const expandedHeight = expandedBottom - expandedY;

      const sourceX = Math.max(0, Math.floor(expandedX / settings.actualScaleX));
      const sourceY = Math.max(0, Math.floor(expandedY / settings.actualScaleY));
      const sourceRight = Math.min(settings.sourceWidth, Math.ceil(expandedRight / settings.actualScaleX));
      const sourceBottom = Math.min(settings.sourceHeight, Math.ceil(expandedBottom / settings.actualScaleY));
      const sourceWidth = Math.max(1, sourceRight - sourceX);
      const sourceHeight = Math.max(1, sourceBottom - sourceY);
      const sourceTile = cropImageData(imageData, sourceX, sourceY, sourceWidth, sourceHeight);
      const upscaledTile = upscaleImageDataDirect(sourceTile, settings, expandedWidth, expandedHeight);

      writeTile(destination, upscaledTile, tileX, tileY, tileX - expandedX, tileY - expandedY, coreWidth, coreHeight);
    }
  }

  return destination;
};

export const resolveUpscaleForImage = (imageData: ImageData, settings: UpscaleSettings) => {
  return resolveUpscaleSettings(imageData.width, imageData.height, settings);
};

export const upscaleImageData = (imageData: ImageData, settings: UpscaleSettings | ResolvedUpscaleSettings) => {
  const resolved = 'outputWidth' in settings ? settings : resolveUpscaleForImage(imageData, settings);

  if (!resolved.enabled || resolved.scaleFactor <= 1) {
    return imageData;
  }

  if (resolved.outputWidth === imageData.width && resolved.outputHeight === imageData.height) {
    return imageData;
  }

  if (resolved.useTiling) {
    return upscaleImageDataTiled(imageData, resolved);
  }

  return upscaleImageDataDirect(imageData, resolved, resolved.outputWidth, resolved.outputHeight);
};
