'use client';

import { RefObject } from 'react';
import { ArrowUpRight, FileDown, Image as ImageIcon, Minimize, Minus, Plus } from 'lucide-react';
import type { HistoryEntry, MenuKey } from '@/lib/editor-config';

type TopMenuProps = {
  menuRef: RefObject<HTMLDivElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  activeMenu: MenuKey;
  setActiveMenu: (updater: MenuKey | ((current: MenuKey) => MenuKey)) => void;
  setHelpOpen: (value: boolean) => void;
  imageSrc: string | null;
  exportImage: (format: 'png' | 'jpeg') => void;
  openSavePresetDialog: () => void;
  exportCustomPresets: () => void;
  importPresetInputRef: RefObject<HTMLInputElement | null>;
  handleRemoveImage: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  resetSpecificationStack: () => void;
  setLeftPanels: (updater: (current: { specifications: boolean; presets: boolean; lastEdits: boolean; history: boolean }) => { specifications: boolean; presets: boolean; lastEdits: boolean; history: boolean }) => void;
  historyIndex: number;
  historyEntries: readonly HistoryEntry[];
  compareLocked: boolean;
  setCompareLocked: (value: boolean) => void;
  showOriginal: boolean;
  setShowOriginal: (value: boolean) => void;
  isFocusMode: boolean;
  setIsFocusMode: (updater: boolean | ((current: boolean) => boolean)) => void;
  zoomLevel: 'FIT' | '1:1';
  setZoomLevel: (value: 'FIT' | '1:1') => void;
  zoomPercent: number;
  setZoomPercent: (value: number | ((current: number) => number)) => void;
};

export function TopMenu({
  menuRef,
  fileInputRef,
  activeMenu,
  setActiveMenu,
  setHelpOpen,
  imageSrc,
  exportImage,
  openSavePresetDialog,
  exportCustomPresets,
  importPresetInputRef,
  handleRemoveImage,
  handleUndo,
  handleRedo,
  resetSpecificationStack,
  setLeftPanels,
  historyIndex,
  historyEntries,
  compareLocked,
  setCompareLocked,
  showOriginal,
  setShowOriginal,
  isFocusMode,
  setIsFocusMode,
  zoomLevel,
  setZoomLevel,
  zoomPercent,
  setZoomPercent
}: TopMenuProps) {
  const clampZoom = (value: number) => Math.min(300, Math.max(25, Math.round(value / 5) * 5));
  const adjustZoom = (delta: number) => {
    setZoomLevel('1:1');
    setZoomPercent((current) => clampZoom(current + delta));
  };

  return (
    <header className="h-[36px] bg-[#141414] border-b border-[#333] flex items-center px-4 shrink-0">
      <div className="flex items-center gap-1 text-[#aaa] relative" ref={menuRef}>
        {(['file', 'edit', 'help'] as const).map((menu) => (
          <div key={menu} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={activeMenu === menu}
              onClick={() => {
                if (menu === 'help') {
                  setHelpOpen(true);
                }
                setActiveMenu((current) => current === menu ? null : menu);
              }}
              className={`cursor-pointer px-2 py-1 rounded-sm uppercase tracking-[0.16em] text-[10px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${activeMenu === menu ? 'text-white bg-[#232323]' : 'hover:text-white hover:bg-[#1c1c1c]'}`}
            >
              {menu}
            </button>

            {activeMenu === menu && menu === 'file' && (
              <div role="menu" className="absolute top-[calc(100%+6px)] left-0 min-w-[210px] rounded-[4px] border border-[#3a3527] bg-[#111111] p-1 shadow-[0_18px_40px_rgba(0,0,0,0.45)] z-30">
                <button type="button" role="menuitem" onClick={() => fileInputRef.current?.click()} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Import Image</button>
                <button type="button" role="menuitem" onClick={() => exportImage('png')} disabled={!imageSrc} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Render PNG Output</button>
                <button type="button" role="menuitem" onClick={() => exportImage('jpeg')} disabled={!imageSrc} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Render JPG Output</button>
                <button type="button" role="menuitem" onClick={openSavePresetDialog} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Save Specification Preset</button>
                <button type="button" role="menuitem" onClick={() => importPresetInputRef.current?.click()} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Import Preset Bundle</button>
                <button type="button" role="menuitem" onClick={exportCustomPresets} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Export Preset Bundle</button>
                <button type="button" role="menuitem" onClick={handleRemoveImage} disabled={!imageSrc} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Clear Working Image</button>
              </div>
            )}

            {activeMenu === menu && menu === 'edit' && (
              <div role="menu" className="absolute top-[calc(100%+6px)] left-0 min-w-[210px] rounded-[4px] border border-[#3a3527] bg-[#111111] p-1 shadow-[0_18px_40px_rgba(0,0,0,0.45)] z-30">
                <button type="button" role="menuitem" onClick={handleUndo} disabled={historyIndex <= 0} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Undo Last Edit</button>
                <button type="button" role="menuitem" onClick={handleRedo} disabled={historyIndex >= historyEntries.length - 1} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Redo Edit</button>
                <button type="button" role="menuitem" onClick={resetSpecificationStack} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Reset Specification Stack</button>
                <button type="button" role="menuitem" onClick={() => setLeftPanels((prev) => ({ ...prev, history: true, lastEdits: true }))} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Open Revision Panels</button>
              </div>
            )}

            {activeMenu === menu && menu === 'help' && (
              <div role="menu" className="absolute top-[calc(100%+6px)] left-0 min-w-[210px] rounded-[4px] border border-[#3a3527] bg-[#111111] p-1 shadow-[0_18px_40px_rgba(0,0,0,0.45)] z-30">
                <button type="button" role="menuitem" onClick={() => setHelpOpen(true)} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Open FORMAT Guide</button>
                <button type="button" role="menuitem" onClick={() => setLeftPanels((prev) => ({ ...prev, history: true }))} className="w-full text-left px-3 py-2 text-[11px] text-[#d7d1c5] hover:bg-[#1d1d1d] rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">Show Revision History</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:flex flex-1 justify-center items-center gap-10">
        <div className="flex items-center gap-2">
          <span
            className={`cursor-pointer transition-colors ${compareLocked ? 'text-white font-semibold' : 'text-[#888] hover:text-[#ccc]'}`}
            onClick={() => setCompareLocked(!compareLocked)}
            title="Toggle Compare Lock"
          >
            Compare
          </span>
          <button
            type="button"
            aria-label="Toggle compare lock"
            className={`w-6 h-6 rounded-sm text-black flex items-center justify-center transition-colors focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${showOriginal || compareLocked ? 'bg-red-500' : 'bg-[#e8a82d] hover:bg-[#ffba33]'}`}
            onClick={() => setCompareLocked(!compareLocked)}
            onMouseDown={() => !compareLocked && setShowOriginal(true)}
            onMouseUp={() => !compareLocked && setShowOriginal(false)}
            onMouseLeave={() => !compareLocked && setShowOriginal(false)}
            title="Click to lock, hold to view"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label={isFocusMode ? 'Exit canvas focus mode' : 'Enter canvas focus mode'}
            onClick={() => setIsFocusMode((current) => !current)}
            disabled={!imageSrc}
            className="w-6 h-6 rounded-sm border border-[#444] text-[#888] flex items-center justify-center hover:bg-[#333] disabled:opacity-40 disabled:hover:bg-transparent focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
            title={isFocusMode ? 'Exit canvas focus mode' : 'Enter canvas focus mode'}
          >
            {isFocusMode ? <Minimize className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#888]">Zoom</span>
          <button
            type="button"
            onClick={() => setZoomLevel('FIT')}
            className={`px-2 h-5 text-[11px] font-semibold rounded-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${zoomLevel === 'FIT' ? 'bg-[#e8a82d] text-black' : 'border border-[#444] text-[#888] hover:bg-[#333]'}`}
          >
            FIT
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => adjustZoom(-25)}
            disabled={!imageSrc}
            className="h-5 w-5 rounded-sm border border-[#444] text-[#888] hover:bg-[#333] disabled:opacity-40 disabled:hover:bg-transparent focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
          >
            <Minus className="mx-auto h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => { setZoomLevel('1:1'); setZoomPercent(100); }}
            className={`px-2 h-5 min-w-[44px] text-[11px] font-semibold rounded-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${zoomLevel === '1:1' && zoomPercent === 100 ? 'bg-[#e8a82d] text-black' : 'border border-[#444] text-[#888] hover:bg-[#333]'}`}
          >
            {zoomLevel === 'FIT' ? '100%' : `${zoomPercent}%`}
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => adjustZoom(25)}
            disabled={!imageSrc}
            className="h-5 w-5 rounded-sm border border-[#444] text-[#888] hover:bg-[#333] disabled:opacity-40 disabled:hover:bg-transparent focus:outline-none focus:ring-1 focus:ring-[#e8a82d]"
          >
            <Plus className="mx-auto h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {imageSrc && (
          <>
            <button type="button" onClick={() => exportImage('png')} className="flex items-center gap-1.5 px-3 py-1 bg-[#141414] border border-[#444] rounded text-[11px] text-[#aaa] hover:text-white hover:border-[#666] transition-colors uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">
              <FileDown className="w-3.5 h-3.5" />
              PNG
            </button>
            <button type="button" onClick={() => exportImage('jpeg')} className="flex items-center gap-1.5 px-3 py-1 bg-[#141414] border border-[#e8a82d]/50 rounded text-[11px] text-[#e8a82d] hover:text-black hover:bg-[#e8a82d] transition-colors uppercase tracking-wider mr-2 focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">
              <FileDown className="w-3.5 h-3.5" />
              JPG
            </button>
            <button type="button" onClick={handleRemoveImage} className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded text-[11px] text-red-400 hover:bg-red-500 hover:text-white transition-colors mr-4 focus:outline-none focus:ring-1 focus:ring-red-400">
              Clear
            </button>
          </>
        )}
        <div className="ml-2 pl-3 border-l border-[#3a3527] flex items-center gap-2 leading-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Logos/8x/logo-submark.png"
            alt=""
            aria-hidden="true"
            className="h-6 w-6 object-contain"
          />
          <div className="flex flex-col items-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logos/8x/wordmark-no-submark.png"
              alt="FORMAT by TAGDesigns"
              className="h-[16px] w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
