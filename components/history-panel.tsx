'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { HistoryEntry } from '@/lib/editor-config';

type HistoryPanelProps = {
  entries: readonly HistoryEntry[];
  historyIndex: number;
  lastEditsOpen: boolean;
  historyOpen: boolean;
  toggleLastEdits: () => void;
  toggleHistory: () => void;
  jumpToHistory: (index: number) => void;
};

export function HistoryPanel({
  entries,
  historyIndex,
  lastEditsOpen,
  historyOpen,
  toggleLastEdits,
  toggleHistory,
  jumpToHistory
}: HistoryPanelProps) {
  return (
    <div className="flex flex-col border-t border-[#333] bg-[#1a1a1a]">
      <div className="px-4 py-3 flex justify-between items-center text-[#aaa] cursor-pointer hover:bg-[#222]" onClick={toggleLastEdits}>
        <span className="uppercase tracking-[0.16em] text-[10px] text-[#e0dbd1]">Last Edits</span>
        <span className="flex items-center gap-2">{Math.min(entries.length, 4)} {lastEditsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</span>
      </div>
      <AnimatePresence>
        {lastEditsOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div className="px-4 pb-3 flex flex-col gap-2 text-[11px]">
              {entries.slice(-4).reverse().map((entry, index) => (
                <button key={`${entry.id}-${index}`} type="button" onClick={() => jumpToHistory(entries.findIndex((item) => item.id === entry.id))} className="text-left rounded-[3px] border border-[#2f2f2f] bg-[#141414] px-3 py-2 hover:border-[#5a4823] hover:bg-[#181818] transition-colors focus:outline-none focus:ring-1 focus:ring-[#e8a82d]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#e2ddd3]">{entry.label}</span>
                    <span className="text-[#6f6a62] font-mono">{entry.timestamp}</span>
                  </div>
                  <div className="mt-1 text-[#8d877d] text-[10px] uppercase tracking-[0.12em]">{entry.detail}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-3 flex justify-between items-center text-[#aaa] cursor-pointer hover:bg-[#222]" onClick={toggleHistory}>
        <span className="uppercase tracking-[0.16em] text-[10px] text-[#e0dbd1]">History</span>
        <span className="flex items-center gap-2">{historyOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</span>
      </div>
      <AnimatePresence>
        {historyOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div className="px-4 pb-4 flex flex-col gap-2 text-[11px] max-h-[220px] overflow-y-auto">
              {entries.map((entry, index) => (
                <button key={`${entry.id}-${index}-timeline`} type="button" onClick={() => jumpToHistory(index)} className={`text-left rounded-[3px] border px-3 py-2 transition-colors focus:outline-none focus:ring-1 focus:ring-[#e8a82d] ${index === historyIndex ? 'border-[#a67824] bg-[#1f1a11]' : 'border-[#2f2f2f] bg-[#141414] hover:border-[#5a4823] hover:bg-[#181818]'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#e2ddd3]">{entry.label}</span>
                    <span className="text-[#6f6a62] font-mono">{entry.timestamp}</span>
                  </div>
                  <div className="mt-1 text-[#8d877d] text-[10px] uppercase tracking-[0.12em]">{entry.detail}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
