"use client";

import { useState } from "react";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";

type BookingItem = {
  _id: string;
  bookedFor: string;
  bookedBy: string;
  bookingStart: string;
  bookingEnd: string;
  queuePosition: number;
  status: "approved" | "pending_approval" | "rejected";
  needsApproval: boolean;
};

type Room = {
  _id?: string;
  name: string;
  maxQueue?: number;
  isClosed?: boolean;
  closedReason?: string;
  queueCount: number;
  bookings: BookingItem[];
};

type BookFormProps = {
  room: Room;
  onBook?: (
    roomName: string,
    bookedFor: string,
    startTime: string,
    endTime: string,
    bookingDate: string,
  ) => void | Promise<void>;
};

export default function BookForm({ room, onBook }: BookFormProps) {
  const [bookingRoom, setBookingRoom] = useState<string | null>(null);
  const [bookedFor, setBookedFor] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  if (!onBook) return null;

  const hasQueue = room.queueCount > 0;

  // Min date = today
  const minDate = new Date().toISOString().split("T")[0];

  if (bookingRoom !== room.name) {
    return (
      <button
        type="button"
        onClick={() => setBookingRoom(room.name)}
        className={`w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-95 ${
          hasQueue
            ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30"
            : "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30"
        }`}
      >
        {hasQueue ? "Masuk Antrean" : "Book Now"}
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!bookedFor.trim() || !startTime || !endTime || !bookingDate) return;
        onBook(room.name, bookedFor.trim(), startTime, endTime, bookingDate);
        setBookedFor("");
        setStartTime("");
        setEndTime("");
        setBookingDate(minDate);
        setBookingRoom(null);
      }}
      className="w-full space-y-2"
    >
      {hasQueue && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
          ⚠️ Ruangan sudah ada {room.queueCount} antrean. Pemesanan Anda akan
          masuk antrian.
        </div>
      )}
      <input
        value={bookedFor}
        onChange={(e) => setBookedFor(e.target.value)}
        placeholder="Keperluan booking..."
        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
        required
      />
      <div>
        <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
          Tanggal
        </label>
        <DatePicker
          value={bookingDate}
          onChange={(val) => setBookingDate(val)}
          min={minDate}
          placeholder="Pilih tanggal booking"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
            Jam Mulai
          </label>
          <TimePicker
            value={startTime}
            onChange={(val) => setStartTime(val)}
            placeholder="Mulai"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
            Jam Selesai
          </label>
          <TimePicker
            value={endTime}
            onChange={(val) => setEndTime(val)}
            min={startTime || undefined}
            placeholder="Selesai"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={!bookedFor.trim() || !startTime || !endTime || !bookingDate}
          className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {hasQueue ? "Masuk Antrean" : "✓ Pesan Sekarang"}
        </button>
        <button
          type="button"
          onClick={() => {
            setBookingRoom(null);
            setBookedFor("");
            setStartTime("");
            setEndTime("");
            setBookingDate(minDate);
          }}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50 active:scale-95"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
