import { describe, expect, it, vi } from 'vitest';
import {
  buildBrowserRenderBenchmarkPlan,
  buildDisposableFlashBenchmarkPlan,
  summarizeBrowserBenchmarkResults
} from './browser-render-benchmarks';

class TestImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

vi.stubGlobal('ImageData', TestImageData);

describe('browser render benchmark helpers', () => {
  it('builds a browser benchmark plan for main-thread and worker backends', () => {
    const plan = buildBrowserRenderBenchmarkPlan([{ label: 'tiny', width: 16, height: 16 }]);

    expect(plan.some((item) => item.backend === 'typescript')).toBe(true);
    expect(plan.some((item) => item.backend === 'worker')).toBe(true);
    expect(plan.some((item) => item.kernelId === 'film-emulsion')).toBe(true);
  });

  it('summarizes before and after timings without crashing on empty input', () => {
    expect(summarizeBrowserBenchmarkResults([])).toEqual({
      fastestBackendByKernel: {},
      workerWins: 0,
      typescriptWins: 0
    });
  });

  it('builds the disposable flash browser benchmark matrix', () => {
    const plan = buildDisposableFlashBenchmarkPlan([{ label: '1024px preview', width: 1024, height: 1024 }]);

    expect(plan).toEqual([
      { caseId: 'disposable-flash-only', size: { label: '1024px preview', width: 1024, height: 1024 } },
      { caseId: 'disposable-flash-material-finish', size: { label: '1024px preview', width: 1024, height: 1024 } },
      { caseId: 'disposable-flash-anti-ai-repair', size: { label: '1024px preview', width: 1024, height: 1024 } },
      { caseId: 'disposable-flash-premium-preset', size: { label: '1024px preview', width: 1024, height: 1024 } }
    ]);
  });
});
