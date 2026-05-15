'use client';

import type { ReactNode } from 'react';

type ControlSliderProps = {
  label: string;
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
};

const toBoundedNumber = (rawValue: string, min: number, max: number) => {
  if (rawValue.trim() === '') return min;
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

export function ControlSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  accentClass = 'text-[#cfc6b7]',
  inputClassName = 'bg-[#101010] border border-[#444]',
  rangeClassName,
  description,
  icon
}: ControlSliderProps) {
  const inputId = `control-slider-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex justify-between items-center ${accentClass}`}>
        <label htmlFor={inputId} className="text-[11px] font-medium flex items-center gap-1.5">{icon}{label}</label>
        <input
          id={inputId}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(toBoundedNumber(event.target.value, min, max))}
          onBlur={(event) => onChange(toBoundedNumber(event.target.value, min, max))}
          className={`w-12 h-5 rounded-sm text-[10px] text-center font-mono text-white focus:outline-none focus:border-[#e8a82d] ${inputClassName}`}
        />
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(toBoundedNumber(event.target.value, min, max))}
        className={rangeClassName}
      />
      {description ? <p className="text-[9px] text-[#666] leading-tight mt-1">{description}</p> : null}
    </div>
  );
}
