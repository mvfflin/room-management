"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type DatePickerProps = {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  min?: string; // YYYY-MM-DD
  placeholder?: string;
};

const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

type CellData = {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isDisabled: boolean;
};

export default function DatePicker({
  value,
  onChange,
  min,
  placeholder = "Pilih tanggal",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // When value changes, sync view
  useEffect(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      setViewDate(new Date(y, m - 1, 1));
    }
  }, [value]);

  const minDate = min ? new Date(min + "T00:00:00") : null;
  const selectedDate = value ? new Date(value + "T00:00:00") : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CellData[] = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    const date = new Date(y, m, d);
    date.setHours(0, 0, 0, 0);
    cells.push({
      day: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      isDisabled: minDate ? date < minDate : false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    cells.push({
      day: d,
      month,
      year,
      isCurrentMonth: true,
      isDisabled: minDate ? date < minDate : false,
    });
  }

  // Next month leading days (fill to 6 rows)
  const totalRows = Math.ceil(cells.length / 7);
  const targetCells = totalRows * 7;
  const remaining = targetCells - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({
      day: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      isDisabled: false,
    });
  }

  const handleSelect = useCallback(
    (cell: CellData) => {
      if (cell.isDisabled) return;
      const dateStr = `${cell.year}-${String(cell.month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
      onChange(dateStr);
      setIsOpen(false);
    },
    [onChange],
  );

  const prevMonth = () => {
    setSlideDir("right");
    setViewDate(new Date(year, month - 1, 1));
    setTimeout(() => setSlideDir(null), 200);
  };

  const nextMonth = () => {
    setSlideDir("left");
    setViewDate(new Date(year, month + 1, 1));
    setTimeout(() => setSlideDir(null), 200);
  };

  const isSelected = (cell: CellData) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === cell.year &&
      selectedDate.getMonth() === cell.month &&
      selectedDate.getDate() === cell.day
    );
  };

  const isTodayCell = (cell: CellData) => {
    return (
      today.getFullYear() === cell.year &&
      today.getMonth() === cell.month &&
      today.getDate() === cell.day
    );
  };

  const goToToday = () => {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    onChange(todayStr);
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setIsOpen(false);
  };

  // Check if prev button should be disabled
  const canGoPrev = (() => {
    if (!minDate) return true;
    const prevMonthStart = new Date(year, month - 1, 1);
    const minMonthStart = new Date(
      minDate.getFullYear(),
      minDate.getMonth(),
      1,
    );
    return prevMonthStart >= minMonthStart;
  })();

  // Format display value
  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          dp-trigger group w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-left
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>
          <span className="truncate font-medium">
            {displayValue || placeholder}
          </span>
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

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="dp-dropdown absolute z-50 bottom-full mb-2 left-0 w-[300px] rounded-2xl border border-zinc-200/80 bg-white/98 backdrop-blur-2xl shadow-2xl shadow-zinc-300/40 p-4">
          {/* Month/Year Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              className={`
                p-2 rounded-xl transition-all duration-200
                ${canGoPrev ? "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 active:scale-90" : "text-zinc-200 cursor-not-allowed"}
              `}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="text-sm font-bold text-zinc-800 tracking-wide">
              {MONTHS[month]} {year}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-zinc-100 transition-all duration-200 text-zinc-500 hover:text-zinc-800 active:scale-90"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_SHORT.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-1.5"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            className={`grid grid-cols-7 gap-[3px] ${slideDir === "left" ? "dp-slide-left" : slideDir === "right" ? "dp-slide-right" : ""}`}
          >
            {cells.map((cell, i) => {
              const selected = isSelected(cell);
              const todayMark = isTodayCell(cell);
              return (
                <button
                  key={`${cell.year}-${cell.month}-${cell.day}-${i}`}
                  type="button"
                  disabled={cell.isDisabled}
                  onClick={() => handleSelect(cell)}
                  className={`
                    dp-day relative flex items-center justify-center
                    h-9 w-full rounded-xl text-[13px] font-medium
                    transition-all duration-150
                    ${!cell.isCurrentMonth ? "text-zinc-300" : ""}
                    ${cell.isDisabled ? "text-zinc-200 cursor-not-allowed" : "cursor-pointer"}
                    ${!selected && !cell.isDisabled && cell.isCurrentMonth ? "text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 active:scale-90" : ""}
                    ${selected ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-300/40 font-bold scale-105" : ""}
                    ${todayMark && !selected ? "text-emerald-600 font-bold" : ""}
                  `}
                >
                  {cell.day}
                  {todayMark && !selected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer: Today shortcut */}
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all"
            >
              ← Hari ini
            </button>
            {selectedDate && (
              <span className="text-[10px] text-zinc-400 font-medium">
                {selectedDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
