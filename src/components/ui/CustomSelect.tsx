'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Lock } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  dotColor?: string;
  badgeClass?: string;
  icon?: React.ReactNode;
  subLabel?: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  isDark?: boolean;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuAlign?: 'left' | 'right';
  minMenuWidth?: string;
  renderValue?: (selected: CustomSelectOption | undefined) => React.ReactNode;
}

export function CustomSelect({
  value,
  options,
  onChange,
  disabled = false,
  isDark = true,
  placeholder = 'Chọn...',
  className = '',
  buttonClassName = '',
  menuAlign = 'left',
  minMenuWidth = 'min-w-[180px]',
  renderValue,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={`inline-flex items-center justify-between gap-1.5 rounded-lg border text-xs font-medium transition-all focus:outline-none ${
          disabled ? 'opacity-70 cursor-default' : 'cursor-pointer'
        } ${
          buttonClassName ||
          (isDark
            ? 'px-2.5 py-1.5 bg-[#22272B] border-[#38414A] text-[#DEE4EA] hover:border-[#579DFF]'
            : 'px-2.5 py-1.5 bg-white border-gray-300 text-gray-800 hover:border-blue-400')
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {renderValue ? (
            renderValue(selected)
          ) : selected ? (
            <>
              {selected.dotColor && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: selected.dotColor }}
                />
              )}
              {selected.icon && <span className="shrink-0">{selected.icon}</span>}
              <span className="truncate">{selected.label}</span>
            </>
          ) : (
            <span className="opacity-60">{placeholder}</span>
          )}
        </span>
        {!disabled && (
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 opacity-70 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {open && !disabled && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 mt-1.5 ${minMenuWidth} max-h-64 overflow-y-auto rounded-xl border p-1.5 shadow-2xl ${
            menuAlign === 'right' ? 'right-0' : 'left-0'
          } ${
            isDark
              ? 'bg-[#282E33] border-[#38414A] text-[#DEE4EA] shadow-black/60'
              : 'bg-white border-gray-200 text-gray-800 shadow-gray-300/60'
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${
                  opt.disabled
                    ? 'opacity-45 cursor-not-allowed'
                    : isSelected
                    ? isDark
                      ? 'bg-[#0C66E4]/25 text-[#85B8FF] font-semibold cursor-pointer'
                      : 'bg-blue-50 text-blue-700 font-semibold cursor-pointer'
                    : isDark
                    ? 'hover:bg-[#323940] text-[#DEE4EA] cursor-pointer'
                    : 'hover:bg-gray-100 text-gray-800 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {opt.dotColor && (
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: opt.dotColor }}
                    />
                  )}
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  {opt.badgeClass ? (
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${opt.badgeClass}`}>
                      {opt.label}
                    </span>
                  ) : (
                    <div className="min-w-0">
                      <div className="truncate">{opt.label}</div>
                      {opt.subLabel && (
                        <div className="text-[10px] opacity-60 truncate">{opt.subLabel}</div>
                      )}
                    </div>
                  )}
                </div>

                {opt.disabled ? (
                  <Lock className="w-3 h-3 opacity-60 shrink-0" />
                ) : isSelected ? (
                  <Check className="w-3.5 h-3.5 text-[#579DFF] shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
