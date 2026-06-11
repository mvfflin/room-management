"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type TimePickerProps = {
  value: string; // HH:MM
  onChange: (value: string) => void;
  min?: string; // HH:MM
  placeholder?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export default function TimePicker({
  value,
  onChange,
  min,
  placeholder = "Pilih waktu",
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourColRef = useRef<HTMLDivElement>(null);
  const minuteColRef = useRef<HTMLDivElement>(null);

  const [selectedHour, setSelectedHour] = useState<number>(-1);
  const [selectedMinute, setSelectedMinute] = useState<number>(-1);

  // Sync state from value prop
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      setSelectedHour(h);
      setSelectedMinute(m);
    } else {
      setSelectedHour(-1);
      setSelectedMinute(-1);
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Scroll to selected items on open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        if (hourColRef.current && selectedHour >= 0) {
          const el = hourColRef.current.querySelector(
            `[data-hour="${selectedHour}"]`,
          );
          if (el) {
            el.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        }
        if (minuteColRef.current && selectedMinute >= 0) {
          const el = minuteColRef.current.querySelector(
            `[data-minute="${selectedMinute}"]`,
          );
          if (el) {
            el.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        }
      });
    }
  }, [isOpen, selectedHour, selectedMinute]);

  const minHour = min ? parseInt(min.split(":")[0]) : -1;
  const minMinute = min ? parseInt(min.split(":")[1]) : -1;

  const isHourDisabled = useCallback(
    (h: number) => {
      if (minHour < 0) return false;
      return h < minHour;
    },
    [minHour],
  );

  const isMinuteDisabled = useCallback(
    (m: number) => {
      if (minHour < 0) return false;
      if (selectedHour < 0) return false;
      if (selectedHour < minHour) return true;
      if (selectedHour === minHour) return m < minMinute;
      return false;
    },
    [minHour, minMinute, selectedHour],
  );

  const emitChange = useCallback(
    (h: number, m: number) => {
      onChange(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      );
    },
    [onChange],
  );

  const handleHourSelect = useCallback(
    (h: number) => {
      if (isHourDisabled(h)) return;
      setSelectedHour(h);
      let m = selectedMinute >= 0 ? selectedMinute : 0;
      // Adjust minute if it becomes invalid
      if (minHour >= 0 && h === minHour && m < minMinute) {
        // Find nearest valid 5-min interval
        m = Math.ceil(minMinute / 5) * 5;
        if (m >= 60) m = 55;
      }
      setSelectedMinute(m);
      emitChange(h, m);
    },
    [isHourDisabled, selectedMinute, minHour, minMinute, emitChange],
  );

  const handleMinuteSelect = useCallback(
    (m: number) => {
      if (isMinuteDisabled(m)) return;
      setSelectedMinute(m);
      const h = selectedHour >= 0 ? selectedHour : 0;
      emitChange(h, m);
    },
    [isMinuteDisabled, selectedHour, emitChange],
  );

  // Quick presets
  const presets = [
    { label: "Pagi", time: "08:00" },
    { label: "Siang", time: "12:00" },
    { label: "Sore", time: "15:00" },
  ];

  const applyPreset = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    if (minHour >= 0 && (h < minHour || (h === minHour && m < minMinute)))
      return;
    setSelectedHour(h);
    setSelectedMinute(m);
    onChange(time);
    setIsOpen(false);
  };

  // Display
  const displayValue =
    selectedHour >= 0 && selectedMinute >= 0
      ? `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`
      : "";

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          tp-trigger group w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-left
          shadow-sm outline-none transition-all duration-200
          ${
            isOpen
              ? "border-emerald-400 ring-2 ring-emerald-100 shadow-emerald-100/50"
              : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
          }
          ${!value ? "text-zinc-400" : "text-zinc-800"}
        `}
      >
        <span className="flex items-center gap-2.5">
          <span
            className={`
            flex items-center justify-center w-7 h-7 rounded-lg transition-colors
            ${isOpen ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-500"}
          `}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
          <span className="font-medium">{displayValue || placeholder}</span>
          <svg
            className={`w-4 h-4 ml-auto text-zinc-300 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="tp-dropdown absolute z-50 bottom-full mb-2 left-0 w-[220px] rounded-2xl border border-zinc-200/80 bg-white/98 backdrop-blur-2xl shadow-2xl shadow-zinc-300/40 overflow-hidden">
          {/* Quick Presets */}
          <div className="flex gap-1.5 p-3 pb-2 border-b border-zinc-100">
            {presets.map((p) => {
              const [ph, pm] = p.time.split(":").map(Number);
              const disabled =
                minHour >= 0 &&
                (ph < minHour || (ph === minHour && pm < minMinute));
              return (
                <button
                  key={p.label}
                  type="button"
                  disabled={disabled}
                  onClick={() => applyPreset(p.time)}
                  className={`
                    flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                    ${
                      disabled
                        ? "text-zinc-200 cursor-not-allowed bg-zinc-50"
                        : displayValue === p.time
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                          : "bg-zinc-100 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95"
                    }
                  `}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Hour & Minute Columns */}
          <div className="flex h-[220px]">
            {/* Hours Column */}
            <div
              ref={hourColRef}
              className="flex-1 overflow-y-auto tp-scroll border-r border-zinc-100"
            >
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm text-[9px] font-bold text-zinc-400 uppercase tracking-[0.15em] text-center py-2 border-b border-zinc-50">
                Jam
              </div>
              <div className="py-1">
                {HOURS.map((h) => {
                  const disabled = isHourDisabled(h);
                  const selected = selectedHour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      data-hour={h}
                      disabled={disabled}
                      onClick={() => handleHourSelect(h)}
                      className={`
                        tp-item w-full py-2 text-[13px] text-center transition-all duration-150
                        ${disabled ? "text-zinc-200 cursor-not-allowed" : "cursor-pointer"}
                        ${!disabled && !selected ? "text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700" : ""}
                        ${selected ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-sm" : ""}
                      `}
                    >
                      {String(h).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Column */}
            <div
              ref={minuteColRef}
              className="flex-1 overflow-y-auto tp-scroll"
            >
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm text-[9px] font-bold text-zinc-400 uppercase tracking-[0.15em] text-center py-2 border-b border-zinc-50">
                Menit
              </div>
              <div className="py-1">
                {MINUTES.map((m) => {
                  const disabled = isMinuteDisabled(m);
                  const selected = selectedMinute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      data-minute={m}
                      disabled={disabled}
                      onClick={() => handleMinuteSelect(m)}
                      className={`
                        tp-item w-full py-2 text-[13px] text-center transition-all duration-150
                        ${disabled ? "text-zinc-200 cursor-not-allowed" : "cursor-pointer"}
                        ${!disabled && !selected ? "text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700" : ""}
                        ${selected ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-sm" : ""}
                      `}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          {displayValue && (
            <div className="border-t border-zinc-100 px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">
                Waktu dipilih
              </span>
              <span className="text-sm font-bold text-emerald-600 tabular-nums">
                {displayValue}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
