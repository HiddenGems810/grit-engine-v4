/**
 * Grit Engine v4 — History Manager
 *
 * Manages undo/redo history as a linear stack of engine snapshots.
 * Extracted from page.tsx lines 610-672.
 *
 * This is a plain class (no React dependency) that can be used
 * from a Zustand store or any other state container.
 */

import type { EngineSnapshot, HistoryEntry } from '../editor-config';
import { PARAM_LABELS } from '../editor-config';

const MAX_HISTORY_SIZE = 24;

export class HistoryManager {
  private entries: HistoryEntry[] = [];
  private currentIndex = -1;
  private nextId = 0;
  private lastSnapshot: EngineSnapshot | null = null;

  /** Get the current entry stack (immutable copy). */
  getEntries(): readonly HistoryEntry[] {
    return this.entries;
  }

  /** Get the current history index. */
  getIndex(): number {
    return this.currentIndex;
  }

  /** Check if undo is available. */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /** Check if redo is available. */
  canRedo(): boolean {
    return this.currentIndex < this.entries.length - 1;
  }

  /** Commit a new history entry. Truncates any redo stack. */
  commit(snapshot: EngineSnapshot, label: string, detail: string): void {
    this.nextId += 1;
    const entry: HistoryEntry = {
      id: this.nextId,
      label,
      detail,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      snapshot
    };

    this.entries = [
      ...this.entries.slice(0, this.currentIndex + 1),
      entry
    ].slice(-MAX_HISTORY_SIZE);

    this.currentIndex = this.entries.length - 1;
    this.lastSnapshot = snapshot;
  }

  /** Jump to a specific history index. Returns the snapshot at that index, or null. */
  jumpTo(index: number): EngineSnapshot | null {
    const target = this.entries[index];
    if (!target) return null;
    this.currentIndex = index;
    this.lastSnapshot = target.snapshot;
    return target.snapshot;
  }

  /** Undo one step. Returns the snapshot to restore, or null. */
  undo(): EngineSnapshot | null {
    if (!this.canUndo()) return null;
    return this.jumpTo(this.currentIndex - 1);
  }

  /** Redo one step. Returns the snapshot to restore, or null. */
  redo(): EngineSnapshot | null {
    if (!this.canRedo()) return null;
    return this.jumpTo(this.currentIndex + 1);
  }

  /** Get the last committed snapshot. */
  getLastSnapshot(): EngineSnapshot | null {
    return this.lastSnapshot;
  }

  /**
   * Compare two snapshots and generate a human-readable summary.
   * Returns null if they are identical.
   */
  static summarizeChange(prev: EngineSnapshot, next: EngineSnapshot): { label: string; detail: string } | null {
    const changedKeys = (Object.keys(next) as Array<keyof EngineSnapshot>).filter(
      (key) => prev[key] !== next[key]
    );
    if (changedKeys.length === 0) return null;

    const primaryKey = changedKeys[0];
    const primaryLabel = PARAM_LABELS[primaryKey];
    const detail = changedKeys.length === 1
      ? primaryLabel
      : `${primaryLabel} + ${changedKeys.length - 1} more fields`;

    return {
      label: changedKeys.length === 1 ? 'Parameter adjusted' : 'Stack updated',
      detail
    };
  }
}
