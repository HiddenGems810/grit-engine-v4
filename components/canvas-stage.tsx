'use client';

import { ChangeEvent, FormEvent, RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Minimize, Upload } from 'lucide-react';
import type { PortraitGuide } from '@/lib/editor-config';
import { resolveFormatLaunchCta } from '@/lib/launch-cta';

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
  inspectorMode: 'off' | 'split' | 'loupe' | 'clipping' | 'texture';
  setInspectorMode: (mode: 'off' | 'split' | 'loupe' | 'clipping' | 'texture') => void;
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
  setSelectedFaceIndex,
  inspectorMode,
  setInspectorMode
}: CanvasStageProps) {
  const inspectorOptions = [
    { id: 'off', label: 'Off' },
    { id: 'split', label: 'Split' },
    { id: 'loupe', label: 'Loupe' },
    { id: 'clipping', label: 'Clip' },
    { id: 'texture', label: 'Detail' }
  ] as const;
  const accessCta = resolveFormatLaunchCta({
    paymentUrl: process.env.NEXT_PUBLIC_FORMAT_PAYMENT_URL,
    betaUrl: process.env.NEXT_PUBLIC_FORMAT_BETA_URL,
    supportEmail: process.env.NEXT_PUBLIC_FORMAT_SUPPORT_EMAIL
  });

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
        <div className="grid w-full max-w-6xl grid-cols-1 gap-5 m-auto xl:grid-cols-[1.1fr_0.9fr]">
          <section className="flex min-h-[420px] flex-col justify-between rounded-[8px] border border-[#3a3527] bg-[#151515] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.36)] md:p-8">
            <div>
              <div className="mb-4 inline-flex rounded-[3px] border border-[#4b3a1f] bg-[#1b1710] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e8a82d]">
                Local-first creator finishing engine
              </div>
              <h1 className="max-w-3xl text-[34px] font-semibold leading-[1.02] tracking-normal text-[#f4efe6] md:text-[54px]">
                Anti-AI-slop finishing for release-ready creator visuals.
              </h1>
              <p className="mt-5 max-w-2xl text-[14px] leading-6 text-[#b8b0a4] md:text-[15px]">
                FORMAT turns flat, overprocessed, AI-looking, or ordinary images into polished covers, posts, thumbnails, campaign visuals, and client-ready exports with premium browser-native effects.
              </p>
              <div className="mt-6 grid gap-3 text-[12px] text-[#d8d1c6] sm:grid-cols-2">
                {[
                  'Anti-AI Slop Repair',
                  'Disposable Flash Film',
                  'Premium preset recipes',
                  'Portrait-safe finishing',
                  'Film, print, paper, grain',
                  'Private in-browser export'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-[4px] border border-[#2f2f2f] bg-[#111]/70 px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e8a82d]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-[3px] border border-[#e8a82d] bg-[#e8a82d] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#ffba33] focus-within:ring-1 focus-within:ring-[#ffd277]">
                Start Editing
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} onInput={handleImageUpload} />
              </label>
              {accessCta ? (
                <a
                  href={accessCta.href}
                  target={accessCta.external ? '_blank' : undefined}
                  rel={accessCta.external ? 'noreferrer' : undefined}
                  className="inline-flex items-center justify-center rounded-[3px] border border-[#4a4a4a] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#f1eadf] transition-colors hover:border-[#e8a82d] hover:text-[#e8a82d] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
                >
                  {accessCta.label}
                </a>
              ) : (
                <div className="rounded-[3px] border border-[#4a3b24] bg-[#17130d] px-4 py-3 text-[11px] text-[#d6bb7e]">
                  Configure NEXT_PUBLIC_FORMAT_PAYMENT_URL or NEXT_PUBLIC_FORMAT_BETA_URL before taking paid access.
                </div>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-4">
          <div className="md:hidden w-full rounded-[6px] border border-[#3a3527] bg-[#151515] px-4 py-3 text-center text-[11px] leading-relaxed text-[#aaa49a]">
            Mobile import mode is optimized for quick review. Use a tablet or desktop viewport for the full FORMAT control surface.
          </div>
          <label className="border-2 border-dashed border-[#444] hover:border-[#666] hover:bg-[#202020] cursor-pointer transition-colors rounded-lg w-full min-h-[240px] flex flex-col items-center justify-center text-[#888] gap-4 px-6 focus-within:border-[#e8a82d]">
            <Upload className="w-10 h-10" />
            <div className="text-center">
              <p className="font-semibold text-[#ccc] mb-1">Upload Image to edit</p>
              <p className="text-[11px]">Supports JPG, PNG, WebP up to 8K resolution</p>
            </div>
            <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} onInput={handleImageUpload} />
          </label>
          <div id="pricing" className="rounded-[6px] border border-[#2f2f2f] bg-[#111]/70 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e8a82d]">Paid beta access</div>
            <div className="mt-2 text-[18px] font-semibold text-[#f4efe6]">Built for creators who need finished output, not another generic editor.</div>
            <div className="mt-3 grid gap-2 text-[12px] leading-5 text-[#a9a196]">
              <p>Private local workflow: normal editing and export stay in the browser.</p>
              <p>Procedural premium effects: no copied overlay packs or remote texture hotlinks.</p>
              <p>Truthful exports: dimensions, memory fallbacks, and render fingerprints are reported before delivery.</p>
            </div>
          </div>
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
          </section>
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
          <div className="absolute left-3 top-3 z-30 flex flex-wrap items-center gap-1 rounded-[4px] border border-[#3a3527] bg-[#111111]/92 px-2 py-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <span className="mr-1 text-[9px] uppercase tracking-[0.18em] text-[#d6a13a]">Inspector</span>
            {inspectorOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setInspectorMode(option.id)}
                className={`h-6 rounded-sm border px-2 text-[10px] uppercase tracking-[0.12em] focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${inspectorMode === option.id ? 'border-[#e8a82d] bg-[#e8a82d] text-black' : 'border-[#444] bg-[#151515] text-[#aaa] hover:text-white'}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {inspectorMode === 'split' && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <img src={imageSrc} alt="" className={`shadow-[0_0_80px_rgba(0,0,0,0.8)] ${zoomLevel === 'FIT' ? 'max-w-full max-h-[85vh] object-contain' : ''}`} style={{ clipPath: 'inset(0 50% 0 0)' }} />
              <div className="absolute inset-y-8 left-1/2 w-px bg-[#e8a82d]" />
              <div className="absolute bottom-4 left-4 rounded-[3px] border border-[#3a3527] bg-black/70 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-[#d6a13a]">Original / Finished Split</div>
            </div>
          )}

          {inspectorMode === 'loupe' && (
            <div className="pointer-events-none absolute right-4 top-16 z-20 h-28 w-28 rounded-full border border-[#e8a82d] bg-black/35 shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
              <div className="flex h-full w-full items-center justify-center rounded-full text-center text-[9px] uppercase tracking-[0.16em] text-[#f3efe6]">Zoom Loupe<br />Texture Check</div>
            </div>
          )}

          {inspectorMode === 'clipping' && (
            <div className="pointer-events-none absolute inset-0 z-20 border-2 border-red-500/70 mix-blend-screen">
              <div className="absolute right-4 bottom-4 rounded-[3px] border border-red-500/50 bg-black/70 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-red-300">Clipping Overlay</div>
            </div>
          )}

          {inspectorMode === 'texture' && (
            <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,transparent_0,transparent_54%,rgba(232,168,45,0.16)_55%,transparent_56%)]">
              <div className="absolute right-4 bottom-4 rounded-[3px] border border-[#3a3527] bg-black/70 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-[#d6a13a]">Texture / Detail Inspector</div>
            </div>
          )}

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
