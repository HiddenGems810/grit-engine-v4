import { clampSliderValue } from '../editor-config';
import type { PortraitGuide, PortraitPoint } from '../editor-config';

export function applyColorPipeline(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  scaledPortraitGuide: PortraitGuide | null,
  options: {
    colorKnockout: string;
    effectiveTeethWhitening: number;
    effectiveMakeupStrength: number;
    effectiveEyeBrightening: number;
    midtones: number;
    highlights: number;
    activeLUT: string;
    effectiveBeautyBoost: number;
    effectiveAgeShift: number;
    chromaOffset: number;
  },
  masks: {
    faceMaskAlpha: Uint8ClampedArray | null;
    faceInnerMaskAlpha: Uint8ClampedArray | null;
    skinMaskAlpha: Uint8ClampedArray | null;
    mouthMaskAlpha: Uint8ClampedArray | null;
    portraitBlendMaskAlpha: Uint8ClampedArray | null;
    eyeMaskAlpha: Uint8ClampedArray | null;
    faceInnerMaskCanvas: HTMLCanvasElement | null;
  }
) {
  const {
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
  } = options;

  const {
    faceMaskAlpha,
    faceInnerMaskAlpha,
    skinMaskAlpha,
    mouthMaskAlpha,
    portraitBlendMaskAlpha,
    eyeMaskAlpha,
    faceInnerMaskCanvas
  } = masks;

  if (colorKnockout !== 'none' || effectiveTeethWhitening > 0 || effectiveMakeupStrength > 0 || effectiveEyeBrightening > 0 || midtones !== 0 || highlights !== 0 || activeLUT !== 'none' || effectiveBeautyBoost > 0 || effectiveAgeShift !== 0) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate levels/curves variables
    // Pre-calculate gamma correction for midtones (-100 to 100) -> (gamma 0.5 to 1.5)
    const gamma = midtones < 0 ? 1 + (Math.abs(midtones) / 200) : 1 - (midtones / 200);
    const invGamma = 1 / gamma;
    // White point adjustment
    const whitePoint = 255 - (highlights * 1.2); 
    const whiteScale = 255 / Math.max(1, whitePoint);
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i], g = data[i+1], b = data[i+2];
      
      // --- LEVELS (Curves) ---
      if (midtones !== 0 || highlights !== 0) {
         r = Math.pow(r / 255, invGamma) * 255 * whiteScale;
         g = Math.pow(g / 255, invGamma) * 255 * whiteScale;
         b = Math.pow(b / 255, invGamma) * 255 * whiteScale;
         r = Math.min(255, Math.max(0, r));
         g = Math.min(255, Math.max(0, g));
         b = Math.min(255, Math.max(0, b));
         data[i] = r; data[i+1] = g; data[i+2] = b;
      }
      
      // --- LUT Specification (Subtle grading to avoid artifacts) ---
      if (activeLUT !== 'none') {
        const lumaBase = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        let nr = r, ng = g, nb = b;
        let satAdjust = 1;
        let contrastAdjust = 1;
        let lift = 0;
        if (activeLUT === 'clarendon') {
          nr = r * 1.02; ng = g * 1.03; nb = b * 1.06;
          satAdjust = 1.08; contrastAdjust = 1.06;
        } else if (activeLUT === 'gingham') {
          nr = r * 1.03 + 6; ng = g * 1.01 + 5; nb = b * 0.96 + 3;
          satAdjust = 0.94; lift = 6;
        } else if (activeLUT === 'juno') {
          nr = r * 1.05 + 4; ng = g * 1.03 + 2; nb = b * 0.96;
          satAdjust = 1.06;
        } else if (activeLUT === 'lark') {
          nr = r * 0.97; ng = g * 1.04 + 2; nb = b * 1.05 + 4;
          satAdjust = 1.02; lift = 2;
        } else if (activeLUT === 'portra-soft') {
          nr = r * 1.04 + 5; ng = g * 1.02 + 3; nb = b * 0.97 + 1;
          satAdjust = 0.97; lift = 5;
        } else if (activeLUT === 'editorial-cool') {
          nr = r * 0.98; ng = g * 1.01 + 1; nb = b * 1.05 + 4;
          satAdjust = 0.95; contrastAdjust = 1.04;
        } else if (activeLUT === 'copper-print') {
          nr = r * 1.05 + 6; ng = g * 0.99 + 2; nb = b * 0.93;
          satAdjust = 1.02; contrastAdjust = 1.05;
        } else if (activeLUT === 'teal-film') {
          nr = r * 0.96; ng = g * 1.04 + 1; nb = b * 1.04 + 3;
          contrastAdjust = 1.06;
        } else if (activeLUT === 'clean-luxe') {
          nr = r * 1.02 + 4; ng = g * 1.02 + 4; nb = b * 1.01 + 2;
          lift = 4;
        } else if (activeLUT === 'mocha-editorial') {
          nr = r * 1.03 + 4; ng = g * 0.99 + 1; nb = b * 0.94;
          satAdjust = 0.98; contrastAdjust = 1.05;
        }

        nr = ((nr - 128) * contrastAdjust) + 128 + lift;
        ng = ((ng - 128) * contrastAdjust) + 128 + lift;
        nb = ((nb - 128) * contrastAdjust) + 128 + lift;

        nr = lumaBase + (nr - lumaBase) * satAdjust;
        ng = lumaBase + (ng - lumaBase) * satAdjust;
        nb = lumaBase + (nb - lumaBase) * satAdjust;

        r = Math.min(255, Math.max(0, nr));
        g = Math.min(255, Math.max(0, ng));
        b = Math.min(255, Math.max(0, nb));
        data[i] = r; data[i+1] = g; data[i+2] = b;
      }

      // --- HSL CALCULATION ---
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      let l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 127.5 ? d / (510 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
      }

      const maskOffset = i + 3;
      const faceMaskStrength = faceMaskAlpha ? faceMaskAlpha[maskOffset] / 255 : 0;
      const faceInnerMaskStrength = faceInnerMaskAlpha ? faceInnerMaskAlpha[maskOffset] / 255 : 0;
      const skinMaskStrength = skinMaskAlpha ? skinMaskAlpha[maskOffset] / 255 : 0;
      const mouthMaskStrength = mouthMaskAlpha ? mouthMaskAlpha[maskOffset] / 255 : 0;
      const portraitBlendStrength = portraitBlendMaskAlpha ? portraitBlendMaskAlpha[maskOffset] / 255 : 0;
      const portraitStrength = Math.max(portraitBlendStrength * 0.7, faceInnerMaskStrength);

      const eyeMaskStrength = eyeMaskAlpha ? eyeMaskAlpha[maskOffset] / 255 : 0;

      // Teeth Whitening (Direct bitmap mask + surgical neutralization)
      if (effectiveTeethWhitening > 0 && mouthMaskStrength > 0.01) {
        const enamelLikeTone = h >= 0.01 && h <= 0.28 && s >= 0.01 && s <= 0.52 && l >= 35 && l <= 250;
        if (enamelLikeTone) {
          const sliderFactor = Math.pow(clampSliderValue(effectiveTeethWhitening) / 24, 0.75) * 0.95;
          const warmthBias = Math.max(0, Math.min(1, (r - b) / 42));
          const headroom = Math.max(0, Math.min(1, (252 - l) / 80));
          const localFactor = sliderFactor * mouthMaskStrength * (0.55 + warmthBias * 0.45) * headroom;

          if (localFactor > 0.002) {
            const neutral = 0.299 * r + 0.587 * g + 0.114 * b;
            const desatMix = localFactor * 0.88; 
            const lift = (18 + warmthBias * 22) * localFactor; 
            const cooledBlueShift = (warmthBias * 6.5 + 2) * localFactor; 
            
            const softenedR = r + (neutral - r) * desatMix;
            const softenedG = g + (neutral - g) * desatMix;
            const softenedB = b + (neutral - b) * desatMix;
            
            const targetR = Math.min(253, softenedR + lift - localFactor * 1.5);
            const targetG = Math.min(254, softenedG + lift + 1.8);
            const targetB = Math.min(255, softenedB + lift + cooledBlueShift);
            
            const blend = Math.min(0.72, localFactor * 1.15);

            r = r + (targetR - r) * blend;
            g = g + (targetG - g) * blend;
            b = b + (targetB - b) * blend;
            data[i] = r; data[i+1] = g; data[i+2] = b;
          }
        }
      }

      // Eye Brightening — Surgical grade, artifact-free
      if (effectiveEyeBrightening > 0 && eyeMaskStrength > 0.01) {
        // Boosted slider factor for "wow" effect at lower levels
        const sliderFactor = Math.pow(clampSliderValue(effectiveEyeBrightening) / 32, 0.68) * 1.15;
        // Strict containment: We use the bitmap mask directly with a sharper falloff (Power 3.0)
        // No procedural ellipses to avoid skin halos.
        const retouchMask = Math.pow(eyeMaskStrength, 3.0); 
        const channelSpread = max - min;
        
        // Surgical candidate detection: Sclera vs Iris vs Catchlight
        // Narrower saturation and brightness bands to avoid skin/lid contamination
        const scleraCandidate = s < 0.12 && l > 45 && l < 248 && channelSpread < 90;
        const catchlightCandidate = s < 0.20 && l > 175 && channelSpread < 80;
        const irisCandidate = !scleraCandidate && !catchlightCandidate && eyeMaskStrength > 0.35 && l > 20 && l < 165 && s > 0.12;

        if (scleraCandidate || catchlightCandidate || irisCandidate) {
          const headroom = Math.max(0, Math.min(1, (254 - l) / 60));
          // Lash & Pupil Protection: zero out effect in deep blacks (l < 32)
          const lashProtection = Math.max(0, Math.min(1, (l - 32) / 38));
          const localFactor = sliderFactor * retouchMask * (0.28 + headroom * 0.72) * lashProtection;

          if (localFactor > 0.001) {
            if (irisCandidate) {
              // Iris pass: Surgical luminosity lift + micro-contrast
              const irisLift = localFactor * 22;
              const irisContrast = 1.0 + localFactor * 0.42;
              const irisBlend = Math.min(0.60, localFactor * 0.95);
              
              let cr = ((r - 128) * irisContrast) + 128;
              let cg = ((g - 128) * irisContrast) + 128;
              let cb = ((b - 128) * irisContrast) + 128;
              
              const lumaWeight = l / 255;
              cr += irisLift * lumaWeight;
              cg += irisLift * lumaWeight;
              cb += irisLift * lumaWeight;
              
              data[i] = Math.min(255, Math.max(0, r + (cr - r) * irisBlend));
              data[i + 1] = Math.min(255, Math.max(0, g + (cg - g) * irisBlend));
              data[i + 2] = Math.min(255, Math.max(0, b + (cb - b) * irisBlend));
            } else {
              // Sclera + Catchlight (Dramatic clarity)
              const neutral = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              const desatMix = Math.min(0.85, localFactor * (catchlightCandidate ? 0.30 : 1.15));
              const baseLift = (catchlightCandidate ? 20 : 34) * localFactor;
              
              const softenedR = r + (neutral - r) * desatMix;
              const softenedG = g + (neutral - g) * desatMix;
              const softenedB = b + (neutral - b) * desatMix;
              
              const coolingShift = localFactor * 3.5;
              const targetR = Math.min(254, softenedR + baseLift * 0.85 - coolingShift);
              const targetG = Math.min(254, softenedG + baseLift * 1.0);
              const targetB = Math.min(255, softenedB + baseLift * 1.25 + coolingShift);
              
              const blend = Math.min(catchlightCandidate ? 0.60 : 0.80, localFactor * (catchlightCandidate ? 1.1 : 1.35));

              data[i] = r + (targetR - r) * blend;
              data[i + 1] = g + (targetG - g) * blend;
              data[i + 2] = b + (targetB - b) * blend;
            }
          }
        }
      }

      // Makeup Strength (Targets lips and blush - reds/pinks)
      if (effectiveMakeupStrength > 0 && portraitStrength > 0.02) {
         const factor = Math.pow(clampSliderValue(effectiveMakeupStrength) / 22, 0.72);
         const lipCandidate = mouthMaskStrength > 0.06 && (h > 0.91 || h < 0.08) && s > 0.16 && l > 36 && l < 220;
         const cheekCandidate = skinMaskStrength > 0.10 && faceInnerMaskStrength > 0.18 && h < 0.12 && s > 0.08 && l > 58 && l < 210;
         const eyeMakeupCandidate = eyeMaskStrength > 0.08 && s > 0.08 && l > 18 && l < 170 && chromaOffset === 0;
         if (lipCandidate) {
            const blend = Math.min(0.55, factor * mouthMaskStrength * 0.82);
            data[i] = Math.min(255, data[i] + 24 * blend);
            data[i + 1] = Math.max(0, data[i + 1] - 10 * blend);
            data[i + 2] = Math.max(0, data[i + 2] - 4 * blend);
         } else if (cheekCandidate) {
            const cheekBlend = Math.min(0.18, factor * skinMaskStrength * 0.16);
            data[i] = Math.min(255, data[i] + 14 * cheekBlend);
            data[i + 1] = Math.max(0, data[i + 1] - 3 * cheekBlend);
            data[i + 2] = Math.max(0, data[i + 2] + 4 * cheekBlend);
         } else if (eyeMakeupCandidate) {
            const neutral = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const blend = Math.min(0.22, factor * eyeMaskStrength * 0.28);
            data[i] += (data[i] - neutral) * blend;
            data[i + 1] += (data[i + 1] - neutral) * blend;
            data[i + 2] += (data[i + 2] - neutral) * blend;
         }
      }

      if (skinMaskStrength > 0.02 && effectiveBeautyBoost > 0) {
        const factor = effectiveBeautyBoost / 46;
        const boostLuma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        if (s < 0.42 && boostLuma > 55 && boostLuma < 235) {
          const tonalCenter = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const toneBlend = Math.min(0.08, factor * skinMaskStrength * 0.08);
          const presentationLift = factor * skinMaskStrength * 1.6;
          data[i] = Math.min(255, data[i] + (tonalCenter - data[i]) * toneBlend + presentationLift * 0.9);
          data[i + 1] = Math.min(255, data[i + 1] + (tonalCenter - data[i + 1]) * toneBlend + presentationLift);
          data[i + 2] = Math.min(255, data[i + 2] + (tonalCenter - data[i + 2]) * toneBlend + presentationLift * 0.82);
        }
      }

      if (portraitStrength > 0.02 && effectiveAgeShift !== 0) {
        const ageFactor = effectiveAgeShift / 20;
        if (ageFactor < 0) {
          const young = Math.abs(ageFactor);
          const blend = Math.min(0.16, young * portraitStrength * 0.18);
          const neutral = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] += (neutral - data[i]) * blend * 0.46 + young * portraitStrength * 1.3;
          data[i + 1] += (neutral - data[i + 1]) * blend * 0.46 + young * portraitStrength * 1.1;
          data[i + 2] += (neutral - data[i + 2]) * blend * 0.46 + young * portraitStrength * 0.82;
        } else {
          const matureContrast = 1 + ageFactor * 0.075;
          data[i] = Math.min(255, Math.max(0, data[i] + ((((data[i] - 128) * matureContrast) + 128 - ageFactor * 2.2) - data[i]) * portraitStrength));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + ((((data[i + 1] - 128) * matureContrast) + 128 - ageFactor * 2.4) - data[i + 1]) * portraitStrength));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + ((((data[i + 2] - 128) * matureContrast) + 128 - ageFactor * 2.4) - data[i + 2]) * portraitStrength));
        }
      }
      
      // Original Color Knockout code
      if (colorKnockout !== 'none') {
        let keep = false;
        if (colorKnockout === 'red' && (h > 0.90 || h < 0.05)) keep = true;
        else if (colorKnockout === 'green' && (h > 0.20 && h < 0.45)) keep = true;
        else if (colorKnockout === 'blue' && (h > 0.50 && h < 0.75)) keep = true;
        else if (colorKnockout === 'warm' && (h > 0.85 || h < 0.15)) keep = true;

        if (!keep) {
          const luma = 0.2126 * data[i] + 0.7152 * data[i+1] + 0.0722 * data[i+2];
          data[i] = luma;
          data[i+1] = luma;
          data[i+2] = luma;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  if (scaledPortraitGuide && effectiveAgeShift > 0) {
    const matureCanvas = document.createElement('canvas');
    matureCanvas.width = canvas.width;
    matureCanvas.height = canvas.height;
    const matureCtx = matureCanvas.getContext('2d')!;
    const maturity = effectiveAgeShift / 20;
    matureCtx.drawImage(canvas, 0, 0);
    matureCtx.globalCompositeOperation = 'multiply';
    matureCtx.strokeStyle = `rgba(84, 68, 52, ${(maturity * 0.07).toFixed(3)})`;
    matureCtx.lineWidth = 1.15;
    const wrinkleAnchors = [
      { x: scaledPortraitGuide.leftEye.x - scaledPortraitGuide.bounds.width * 0.08, y: scaledPortraitGuide.leftEye.y },
      { x: scaledPortraitGuide.rightEye.x + scaledPortraitGuide.bounds.width * 0.02, y: scaledPortraitGuide.rightEye.y },
      { x: scaledPortraitGuide.mouthLeft.x, y: scaledPortraitGuide.mouthLeft.y + scaledPortraitGuide.bounds.height * 0.08 },
      { x: scaledPortraitGuide.mouthRight.x, y: scaledPortraitGuide.mouthRight.y + scaledPortraitGuide.bounds.height * 0.08 },
      { x: scaledPortraitGuide.nose.x - scaledPortraitGuide.bounds.width * 0.06, y: scaledPortraitGuide.nose.y + scaledPortraitGuide.bounds.height * 0.12 },
      { x: scaledPortraitGuide.nose.x + scaledPortraitGuide.bounds.width * 0.02, y: scaledPortraitGuide.nose.y + scaledPortraitGuide.bounds.height * 0.12 }
    ];
    for (let i = 0; i < wrinkleAnchors.length; i += 1) {
      const startX = wrinkleAnchors[i].x;
      const startY = wrinkleAnchors[i].y;
      matureCtx.beginPath();
      matureCtx.moveTo(startX, startY);
      matureCtx.quadraticCurveTo(startX + scaledPortraitGuide.bounds.width * 0.06, startY + scaledPortraitGuide.bounds.height * 0.025, startX + scaledPortraitGuide.bounds.width * 0.12, startY + scaledPortraitGuide.bounds.height * 0.01);
      matureCtx.stroke();
    }
    if (faceInnerMaskCanvas) {
      matureCtx.globalCompositeOperation = 'destination-in';
      matureCtx.drawImage(faceInnerMaskCanvas, 0, 0);
      matureCtx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = maturity * 0.22;
    ctx.drawImage(matureCanvas, 0, 0);
    ctx.globalAlpha = 1;
  }
}
