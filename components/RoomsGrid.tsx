"use client";

import { useState } from "react";
import QueueBadge from "./QueueBadge";
import BookingList from "./BookingList";
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

type GridProps = {
  rooms: Room[];
  loading?: boolean;
  onBook?: (
    roomName: string,
    bookedFor: string,
    startTime: string,
    endTime: string,
    bookingDate: string,
  ) => void | Promise<void>;
  showBookButton?: boolean;
  isAdminOrGuru?: boolean;
  onToggleClose?: (
    roomName: string,
    action: "close" | "open",
    reason?: string,
  ) => void | Promise<void>;
};

function getCardStyle(queueCount: number, maxQueue: number, isClosed?: boolean) {
  if (isClosed) {
    return {
      border: "border-slate-300",
      bg: "bg-slate-50/50",
      dot: "bg-slate-400",
      dotRing: "ring-slate-100",
    };
  }
  if (queueCount === 0) {
    return {
      border: "border-emerald-200",
      bg: "bg-emerald-50/30",
      dot: "bg-emerald-500",
      dotRing: "ring-emerald-100",
    };
  }
  if (queueCount >= maxQueue) {
    return {
      border: "border-red-300",
      bg: "bg-red-50/30",
      dot: "bg-red-500",
      dotRing: "ring-red-100",
    };
  }
  return {
    border: "border-amber-300",
    bg: "bg-amber-50/30",
    dot: "bg-amber-500",
    dotRing: "ring-amber-100",
  };
}

export function RoomsGrid({
  rooms,
  loading = false,
  onBook,
  showBookButton = true,
  isAdminOrGuru = false,
  onToggleClose,
}: GridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!rooms.length) {
    return (
      <div className="py-16 text-center text-zinc-500">
        Belum ada ruangan tersedia.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8">
      {rooms.map((room, index) => {
        const roomMaxQueue = room.maxQueue ?? 3;
        const style = getCardStyle(room.queueCount, roomMaxQueue, room.isClosed);
        const isFull = room.queueCount >= roomMaxQueue;
        const isClosed = room.isClosed || false;

        return (
          <div
            key={room._id || room.name}
            className={`animate-slide-in-scale stagger-${Math.min(index + 1, 8)}`}
          >
            <div
              className={`relative rounded-2xl border-2 ${style.border} ${style.bg} bg-white p-5 card-hover ${isClosed ? "room-closed-card" : ""}`}
            >
              {/* Status dot */}
              <div
                className={`absolute -top-3 -left-3 w-5 h-5 rounded-full shadow-lg ring-4 ${style.dot} ${style.dotRing} ${!isClosed && room.queueCount > 0 ? "animate-pulse-soft" : ""}`}
              />

              <div className="flex flex-col items-center text-center">
                {/* Queue badge */}
                <QueueBadge queueCount={room.queueCount} maxQueue={roomMaxQueue} isClosed={isClosed} />

                <h3 className={`mt-4 text-lg font-bold ${isClosed ? "text-zinc-400" : "text-zinc-900"}`}>
                  {room.name}
                </h3>

                {/* Closed reason */}
                {isClosed && room.closedReason && (
                  <p className="mt-2 text-xs text-slate-500 bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200">
                    📋 {room.closedReason}
                  </p>
                )}

                {/* Active bookings list — hide when closed */}
                {!isClosed && room.bookings.length > 0 && (
                  <div className="mt-3 w-full">
                    <BookingList bookings={room.bookings} />
                  </div>
                )}

                <p className="mt-4 text-xs text-zinc-400 font-medium uppercase tracking-wider">
                  {isClosed
                    ? "Ditutup — Maintenance"
                    : room.queueCount === 0
                      ? "Siap pakai"
                      : isFull
                        ? "Antrean penuh"
                        : "Ada antrean"}
                </p>

                {/* Book button — show if not full, not closed, and allowed */}
                {!isClosed && !isFull && showBookButton && (
                  <div className="mt-5 w-full space-y-2">
                    <BookForm room={room} onBook={onBook} />
                  </div>
                )}

                {!isClosed && isFull && showBookButton && (
                  <div className="mt-5 w-full">
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl bg-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-400 cursor-not-allowed"
                    >
                      Antrean Penuh
                    </button>
                  </div>
                )}

                {/* Close/Open toggle — only for admin/guru */}
                {isAdminOrGuru && onToggleClose && (
                  <div className="mt-4 w-full">
                    {isClosed ? (
                      <button
                        type="button"
                        onClick={() => onToggleClose(room.name, "open")}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:opacity-90 active:scale-95"
                      >
                        🔓 Buka Ruangan
                      </button>
                    ) : (
                      <CloseRoomForm
                        roomName={room.name}
                        onClose={onToggleClose}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========== Close Room Form ========== */

type CloseRoomFormProps = {
  roomName: string;
  onClose: (
    roomName: string,
    action: "close" | "open",
    reason?: string,
  ) => void | Promise<void>;
};

function CloseRoomForm({ roomName, onClose }: CloseRoomFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="w-full rounded-xl border-2 border-dashed border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50 active:scale-95"
      >
        🔒 Tutup Ruangan
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onClose(roomName, "close", reason.trim() || "Maintenance");
        setReason("");
        setShowForm(false);
      }}
      className="w-full space-y-2"
    >
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Alasan penutupan..."
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-slate-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-95"
        >
          🔒 Tutup
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setReason("");
          }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

/* ========== Book Form (existing) ========== */

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

function BookForm({ room, onBook }: BookFormProps) {
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
