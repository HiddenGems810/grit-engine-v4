'use client';

import { RefObject, useEffect, useRef, useState } from 'react';
import type { Face } from '@tensorflow-models/face-landmarks-detection';
import { PortraitGuide, PortraitModelState } from '@/lib/editor-config';
import { buildPortraitGuide } from '@/lib/engine/portrait-guide';

type PortraitDetector = {
  estimateFaces: (image: HTMLImageElement, options: { flipHorizontal: boolean }) => Promise<Face[]>;
  dispose: () => void;
};

type UsePortraitDetectorOptions = {
  enabled: boolean;
  imageSrc: string | null;
  imageReady: number;
  originalImageRef: RefObject<HTMLImageElement | null>;
  onDisplaySizeSync: () => void;
};

export const usePortraitDetector = ({
  enabled,
  imageSrc,
  imageReady,
  originalImageRef,
  onDisplaySizeSync
}: UsePortraitDetectorOptions) => {
  const [portraitGuides, setPortraitGuides] = useState<PortraitGuide[]>([]);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState(0);
  const [portraitModelState, setPortraitModelState] = useState<PortraitModelState>('idle');
  const [portraitModelRevision, setPortraitModelRevision] = useState(0);
  const [showFaceTargets, setShowFaceTargets] = useState(false);
  const [portraitSuppressed, setPortraitSuppressed] = useState(false);
  const portraitDetectorRef = useRef<PortraitDetector | null>(null);
  const portraitModelRequestedRef = useRef(false);
  const portraitGuidesRef = useRef<PortraitGuide[]>([]);

  useEffect(() => {
    portraitGuidesRef.current = portraitGuides;
  }, [portraitGuides]);

  useEffect(() => {
    let active = true;

    if (!enabled || !imageSrc || portraitDetectorRef.current || portraitModelRequestedRef.current || portraitSuppressed) {
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
      } catch (error) {
        if (active) {
          console.warn('Portrait detector unavailable.', error);
          setPortraitModelState('unavailable');
          portraitModelRequestedRef.current = false;
        }
      }
    };

    void loadPortraitModel();

    return () => {
      active = false;
    };
  }, [enabled, imageSrc, portraitSuppressed]);

  useEffect(() => {
    return () => {
      portraitDetectorRef.current?.dispose();
      portraitDetectorRef.current = null;
    };
  }, []);

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
        if (portraitGuidesRef.current.length === 0) {
          setPortraitModelState('analyzing');
        }

        const faces = await detector.estimateFaces(originalImageRef.current, { flipHorizontal: false });
        if (cancelled) return;

        const nextGuides = faces.map((face) => buildPortraitGuide(face)).filter(Boolean) as PortraitGuide[];

        if (nextGuides.length === 0) {
          setPortraitSuppressed(true);
          setPortraitGuides([]);
          setPortraitModelState('idle');
          return;
        }

        setPortraitGuides(nextGuides);
        setSelectedFaceIndex((current) => Math.min(current, Math.max(0, nextGuides.length - 1)));
        setPortraitModelState('ready');
        onDisplaySizeSync();
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
  }, [imageReady, onDisplaySizeSync, originalImageRef, portraitModelRevision, portraitSuppressed]);

  return {
    portraitGuides,
    portraitGuide: portraitGuides[selectedFaceIndex] ?? portraitGuides[0] ?? null,
    selectedFaceIndex,
    setSelectedFaceIndex,
    portraitModelState,
    showFaceTargets,
    setShowFaceTargets,
    portraitSuppressed,
    setPortraitSuppressed
  };
};
