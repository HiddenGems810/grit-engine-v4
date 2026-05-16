import { describe, expect, it } from 'vitest';
import { createNeutralSnapshot } from '@/lib/editor-config';
import { HistoryManager } from '@/lib/engine/history';

describe('HistoryManager', () => {
  it('truncates redo entries when committing after undo', () => {
    const history = new HistoryManager();
    const first = createNeutralSnapshot();
    const second = { ...first, grain: 12 };
    const third = { ...first, grain: 24 };
    const replacement = { ...first, grain: 36 };

    history.commit(first, 'start', 'initial');
    history.commit(second, 'change', 'grain');
    history.commit(third, 'change', 'grain again');

    expect(history.undo()).toEqual(second);
    history.commit(replacement, 'change', 'replacement');

    expect(history.getEntries()).toHaveLength(3);
    expect(history.canRedo()).toBe(false);
    expect(history.getEntries()[2]?.snapshot).toEqual(replacement);
  });

  it('keeps only the maximum history window', () => {
    const history = new HistoryManager();

    for (let index = 0; index < 30; index += 1) {
      history.commit({ ...createNeutralSnapshot(), grain: index }, 'change', String(index));
    }

    expect(history.getEntries()).toHaveLength(24);
    expect(history.getIndex()).toBe(23);
    expect(history.getEntries()[0]?.snapshot.grain).toBe(6);
  });
});
