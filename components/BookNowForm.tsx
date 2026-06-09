"use client";

import { useState } from "react";

type BookNowFormProps = {
  roomName: string;
  onBook: (
    roomName: string,
    bookedFor: string,
    startTime?: string,
    endTime?: string
  ) => void;
  onCancel: () => void;
};

export default function BookNowForm({
  roomName,
  onBook,
  onCancel,
}: BookNowFormProps) {
  const [bookedFor, setBookedFor] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookedFor.trim()) return;
    onBook(roomName, bookedFor.trim(), startTime || undefined, endTime || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 w-full space-y-3">
      <div>
        <label className="block text-xs font-medium text-zinc-600 mb-1">
          Keterangan
        </label>
        <input
          type="text"
          placeholder="Contoh: Keperluan Ekskul"
          value={bookedFor}
          onChange={(e) => setBookedFor(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">
            Jam Mulai
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">
            Jam Selesai
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            min={startTime || undefined}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!bookedFor.trim()}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pesan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
