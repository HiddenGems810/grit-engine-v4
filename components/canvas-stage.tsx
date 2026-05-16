'use client';

import { ChangeEvent, FormEvent, RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Minimize, Upload } from 'lucide-react';
import type { PortraitGuide } from '@/lib/editor-config';

type CanvasStageProps = {
  imageSrc: string | null;
  zoomLevel: 'FIT' | '1:1';
  setZoomLevel: (value: 'FIT' | '1:1') => void;
  isFocusMode: boolean;
  setIsFocusMode: (value: boolean) => void;
  canvasStageRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  handleImageUpload: (event: ChangeEvent<HTMLInputElement> | FormEvent<HTMLInputElement>) => void;
  workspaceNotice: string | null;
  capabilityNotices: string[];
  showOriginal: boolean;
  compareLocked: boolean;
  showFaceTargets: boolean;
  portraitGuides: PortraitGuide[];
  sourceImageSize: { width: number; height: number };
  canvasDisplaySize: { width: number; height: number };
  selectedFaceIndex: number;
  setSelectedFaceIndex: (index: number) => void;
};

export function CanvasStage({
  imageSrc,
  zoomLevel,
  setZoomLevel,
  isFocusMode,
  setIsFocusMode,
  canvasStageRef,
  canvasRef,
  handleImageUpload,
  workspaceNotice,
  capabilityNotices,
  showOriginal,
  compareLocked,
  showFaceTargets,
  portraitGuides,
  sourceImageSize,
  canvasDisplaySize,
  selectedFaceIndex,
  setSelectedFaceIndex
}: CanvasStageProps) {
  return (
    <main className={`min-w-0 flex-1 flex bg-[#181818] relative ${zoomLevel === 'FIT' ? 'items-center justify-center overflow-hidden' : 'items-start justify-start overflow-auto'} ${isFocusMode ? 'p-3' : 'p-4 md:p-8'}`}>
      {isFocusMode && imageSrc && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded-[4px] border border-[#3a3527] bg-[#111111]/92 px-2 py-2 shadow-[0_16px_36px_rgba(0,0,0,0.4)] backdrop-blur-sm">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#d6a13a]">Canvas Focus</span>
          <button type="button" onClick={() => setZoomLevel('FIT')} className={`px-2 h-6 text-[10px] rounded-sm border transition-colors focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${zoomLevel === 'FIT' ? 'bg-[#e8a82d] border-[#e8a82d] text-black' : 'border-[#444] text-[#aaa] hover:bg-[#1f1f1f]'}`}>FIT</button>
          <button type="button" onClick={() => setZoomLevel('1:1')} className={`px-2 h-6 text-[10px] rounded-sm border transition-colors focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${zoomLevel === '1:1' ? 'bg-[#e8a82d] border-[#e8a82d] text-black' : 'border-[#444] text-[#aaa] hover:bg-[#1f1f1f]'}`}>1:1</button>
          <button type="button" aria-label="Exit canvas focus mode" onClick={() => setIsFocusMode(false)} className="h-6 w-6 rounded-sm border border-[#444] text-[#aaa] hover:bg-[#1f1f1f] flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"><Minimize className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {!imageSrc ? (
        <div className="flex w-full max-w-lg flex-col items-center gap-4 m-auto">
          <div className="md:hidden w-full rounded-[6px] border border-[#3a3527] bg-[#151515] px-4 py-3 text-center text-[11px] leading-relaxed text-[#aaa49a]">
            Mobile import mode is optimized for quick review. Use a tablet or desktop viewport for the full FORMAT control surface.
          </div>
          <label className="border-2 border-dashed border-[#444] hover:border-[#666] hover:bg-[#202020] cursor-pointer transition-colors rounded-lg w-full min-h-[240px] sm:aspect-video flex flex-col items-center justify-center text-[#888] gap-4 px-6 focus-within:border-[#e8a82d]">
            <Upload className="w-10 h-10" />
            <div className="text-center">
              <p className="font-semibold text-[#ccc] mb-1">Upload Image to edit</p>
              <p className="text-[11px]">Supports JPG, PNG, WebP up to 8K resolution</p>
            </div>
            <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} onInput={handleImageUpload} />
          </label>
          {workspaceNotice && (
            <div className="w-full rounded-[4px] border border-[#4d3b1d] bg-[#17130d] px-3 py-2 text-center text-[11px] text-[#d7b978]">
              {workspaceNotice}
            </div>
          )}
          {capabilityNotices.map((notice) => (
            <div key={notice} className="w-full rounded-[4px] border border-[#4d3b1d] bg-[#17130d] px-3 py-2 text-center text-[11px] text-[#d7b978]">
              {notice}
            </div>
          ))}
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
                alt=""
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
                      type="button"
                      key={`face-box-${index}`}
                      onClick={() => setSelectedFaceIndex(index)}
                      className="absolute border-0 bg-transparent transition-colors focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
                      style={{ left: 0, top: 0, width: canvasDisplaySize.width, height: canvasDisplaySize.height, pointerEvents: 'auto' }}
                      title={`Target Face ${index + 1}`}
                    >
                      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${canvasDisplaySize.width} ${canvasDisplaySize.height}`} fill="none">
                        <polygon points={ovalPath} fill={selectedFaceIndex === index ? 'rgba(232,168,45,0.12)' : 'rgba(255,255,255,0.04)'} stroke={selectedFaceIndex === index ? '#e8a82d' : 'rgba(255,255,255,0.42)'} strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                      <span className={`absolute rounded-[3px] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] ${selectedFaceIndex === index ? 'bg-[#e8a82d] text-black' : 'bg-black/70 text-white'}`} style={{ left: guide.bounds.x * scaleX, top: Math.max(0, guide.bounds.y * scaleY - 20) }}>
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
  );
}
