/**
 * Grit Engine v4 — Portrait Guide Builder
 *
 * Pure functions for constructing PortraitGuide geometry from
 * face-landmarks-detection results. No TensorFlow dependency here —
 * this module only processes already-detected face data.
 *
 * Extracted from page.tsx lines 440-497.
 */

import type { Face } from '@tensorflow-models/face-landmarks-detection';
import type { PortraitGuide, PortraitPoint } from '../editor-config';
import { FACE_OVAL_INDICES, LEFT_BROW_CONTOUR_INDICES, RIGHT_BROW_CONTOUR_INDICES, LEFT_EYE_CONTOUR_INDICES, RIGHT_EYE_CONTOUR_INDICES } from '../editor-config';

/**
 * Build a PortraitGuide from a single detected face.
 * Returns null if the face has no keypoints.
 */
export const buildPortraitGuide = (face: Face | undefined): PortraitGuide | null => {
  if (!face?.keypoints?.length) return null;

  const pointAt = (index: number, fallback?: PortraitPoint): PortraitPoint => {
    const point = face.keypoints[index];
    if (!point) return fallback ?? { x: 0, y: 0 };
    return { x: point.x, y: point.y };
  };

  const pointsAt = (indices: number[]) => indices.map((index) => pointAt(index));

  const xValues = face.keypoints.map((point) => point.x);
  const yValues = face.keypoints.map((point) => point.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const leftEye = pointAt(33);
  const rightEye = pointAt(263);
  const faceOval = pointsAt(FACE_OVAL_INDICES);
  const leftBrowContour = pointsAt(LEFT_BROW_CONTOUR_INDICES);
  const rightBrowContour = pointsAt(RIGHT_BROW_CONTOUR_INDICES);
  const leftEyeContour = pointsAt(LEFT_EYE_CONTOUR_INDICES);
  const rightEyeContour = pointsAt(RIGHT_EYE_CONTOUR_INDICES);
  const mouthLeft = pointAt(61);
  const mouthRight = pointAt(291);
  const mouthCenter = pointAt(13, { x: (mouthLeft.x + mouthRight.x) / 2, y: (mouthLeft.y + mouthRight.y) / 2 });
  const mouthTop = pointAt(13, mouthCenter);
  const mouthBottom = pointAt(14, mouthCenter);
  const nose = pointAt(1, { x: (leftEye.x + rightEye.x) / 2, y: (minY + maxY) / 2 });
  const chin = pointAt(152, { x: nose.x, y: maxY });
  const forehead = pointAt(10, { x: nose.x, y: minY });

  return {
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    },
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    faceOval,
    leftBrowContour,
    rightBrowContour,
    leftEyeContour,
    rightEyeContour,
    leftEye,
    rightEye,
    nose,
    mouthLeft,
    mouthRight,
    mouthCenter,
    mouthTop,
    mouthBottom,
    chin,
    forehead
  };
};

/**
 * Scale a PortraitGuide to match canvas dimensions.
 * Used when the render canvas is a different resolution than the source image.
 */
export const scalePortraitGuide = (guide: PortraitGuide, scaleX: number, scaleY: number): PortraitGuide => {
  const scalePoint = (p: PortraitPoint): PortraitPoint => ({ x: p.x * scaleX, y: p.y * scaleY });
  const scalePoints = (pts: PortraitPoint[]): PortraitPoint[] => pts.map(scalePoint);

  return {
    bounds: {
      x: guide.bounds.x * scaleX,
      y: guide.bounds.y * scaleY,
      width: guide.bounds.width * scaleX,
      height: guide.bounds.height * scaleY
    },
    center: scalePoint(guide.center),
    faceOval: scalePoints(guide.faceOval),
    leftBrowContour: scalePoints(guide.leftBrowContour),
    rightBrowContour: scalePoints(guide.rightBrowContour),
    leftEyeContour: scalePoints(guide.leftEyeContour),
    rightEyeContour: scalePoints(guide.rightEyeContour),
    leftEye: scalePoint(guide.leftEye),
    rightEye: scalePoint(guide.rightEye),
    nose: scalePoint(guide.nose),
    mouthLeft: scalePoint(guide.mouthLeft),
    mouthRight: scalePoint(guide.mouthRight),
    mouthCenter: scalePoint(guide.mouthCenter),
    mouthTop: scalePoint(guide.mouthTop),
    mouthBottom: scalePoint(guide.mouthBottom),
    chin: scalePoint(guide.chin),
    forehead: scalePoint(guide.forehead)
  };
};
