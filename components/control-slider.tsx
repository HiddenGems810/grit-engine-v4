'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { normalizePreciseSliderValue, sliderInputTextToValue } from '@/lib/slider-values';

type ControlSliderProps = {
  label: string;
  ariaLabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  accentClass?: string;
  inputClassName?: string;
  rangeClassName?: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export function ControlSlider({
  label,
  ariaLabel,
  value,
  min,
  max,
  step = 1,
  onChange,
  accentClass = 'text-[#cfc6b7]',
  inputClassName = 'bg-[#101010] border border-[#444]',
  rangeClassName,
  description,
  icon,
  disabled = false
}: ControlSliderProps) {
  const generatedId = useId();
  const inputId = `control-slider-${generatedId}`;
  const accessibleLabel = ariaLabel ?? label;
  const [draftValue, setDraftValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const displayedValue = isEditing ? draftValue : String(value);
  const pendingValueRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const numericDraft = Number(draftValue);
  const rangeValue = isEditing && Number.isFinite(numericDraft)
    ? normalizePreciseSliderValue(numericDraft, { min, max, step })
    : value;

  useEffect(() => () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const flushScheduledChange = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (pendingValueRef.current !== null) {
      const nextValue = pendingValueRef.current;
      pendingValueRef.current = null;
      onChange(nextValue);
    }
  };

  const scheduleChange = (nextValue: number) => {
    pendingValueRef.current = nextValue;
    if (animationFrameRef.current !== null) return;

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      if (pendingValueRef.current === null) return;
      const pendingValue = pendingValueRef.current;
      pendingValueRef.current = null;
      onChange(pendingValue);
    });
  };

  const commitValue = (rawValue: string) => {
    flushScheduledChange();
    const nextValue = sliderInputTextToValue(rawValue, { min, max, step, fallback: value });
    setDraftValue(String(nextValue));
    setIsEditing(false);
    onChange(nextValue);
  };

  const handleDraftValue = (rawValue: string) => {
    setIsEditing(true);
    setDraftValue(rawValue);
    const trimmed = rawValue.trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') return;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return;
    onChange(normalizePreciseSliderValue(parsed, { min, max, step }));
  };

  const handleRangeValue = (rawValue: string) => {
    const nextValue = normalizePreciseSliderValue(Number(rawValue), { min, max, step });
    setIsEditing(true);
    setDraftValue(String(nextValue));
    scheduleChange(nextValue);
  };

  const commitRangeValue = () => {
    flushScheduledChange();
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex justify-between items-center ${accentClass}`}>
        <label htmlFor={inputId} className="text-[11px] font-medium flex items-center gap-1.5">{icon}{label}</label>
        <input
          id={inputId}
          aria-label={accessibleLabel}
          type="number"
          min={min}
          max={max}
          step={step}
          value={displayedValue}
          disabled={disabled}
          onFocus={() => {
            setIsEditing(true);
            setDraftValue(String(value));
          }}
          onInput={(event) => handleDraftValue(event.currentTarget.value)}
          onChange={(event) => handleDraftValue(event.currentTarget.value)}
          onBlur={(event) => commitValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
          className={`h-6 w-14 rounded-sm text-center font-mono text-[10px] text-white transition-colors focus:outline-none focus:border-[#e8a82d] disabled:cursor-not-allowed disabled:opacity-40 ${inputClassName}`}
        />
      </div>
      <input
        aria-label={accessibleLabel}
        type="range"
        min={min}
        max={max}
        step={step}
        value={rangeValue}
        disabled={disabled}
        onPointerDown={() => {
          setIsEditing(true);
          setDraftValue(String(value));
        }}
        onPointerUp={commitRangeValue}
        onTouchEnd={commitRangeValue}
        onKeyUp={commitRangeValue}
        onBlur={commitRangeValue}
        onInput={(event) => handleRangeValue(event.currentTarget.value)}
        onChange={(event) => handleRangeValue(event.currentTarget.value)}
        className={`w-full disabled:cursor-not-allowed disabled:opacity-40 ${rangeClassName ?? ''}`}
      />
      {description ? <p className="text-[9px] text-[#666] leading-tight mt-1">{description}</p> : null}
    </div>
  );
}
