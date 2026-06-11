"use client";

import { useState } from "react";
import Link from "next/link";
import QueueBadge from "./QueueBadge";
import BookingList from "./BookingList";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";
import BookForm from "./BookForm";
import { useSession } from "next-auth/react";

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
  onUpdateRoom?: (
    roomName: string,
    maxQueue: number,
    newName?: string,
  ) => void | Promise<void>;
};

import { getRoomStatus } from "@/lib/roomStatus";

export function RoomsGrid({
  rooms,
  loading = false,
  onBook,
  showBookButton = true,
  isAdminOrGuru = false,
  onToggleClose,
  onUpdateRoom,
}: GridProps) {
  const { data: session } = useSession();
  let isAdmin: boolean;
  if (session) {
    isAdmin = (session?.user as any).role === "admin" || (session?.user as any).role === "guru"
  }

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
        const status = getRoomStatus(room);
        const isFull = room.queueCount >= roomMaxQueue;
        const isClosed = room.isClosed || false;

        return (
          <div
            key={room._id || room.name}
            className={`animate-slide-in-scale stagger-${Math.min(index + 1, 8)}`}
          >
            <div
              className={`relative rounded-2xl border-2 ${status.borderClass} ${status.bgClass} p-5 card-hover ${isClosed ? "room-closed-card" : ""}`}
            >
              {/* Status dot */}
              <div
                className={`absolute -top-3 -left-3 w-5 h-5 rounded-full shadow-lg ring-4 ${status.dotClass} ${status.dotRingClass} ${!isClosed && room.queueCount > 0 ? "animate-pulse-soft" : ""}`}
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
                    <BookingList bookings={room.bookings.slice(0, 3)} />
                    {room.bookings.length > 3 && room._id && (
                      <Link
                        href={isAdmin ? `/admin/rooms/${room._id}` : `/rooms/${room._id}`}
                        className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                      >
                        Lihat {room.bookings.length - 3} antrean lainnya...
                      </Link>
                    )}
                  </div>
                )}

                <p className={`mt-4 text-xs font-medium uppercase tracking-wider ${status.textClass}`}>
                  {status.label}
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
                  <div className="mt-4 w-full flex flex-col gap-2">
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
                    {onUpdateRoom && (
                      <RoomSettingsForm
                        roomName={room.name}
                        currentMaxQueue={roomMaxQueue}
                        onUpdate={onUpdateRoom}
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

/* ========== Room Settings Form ========== */

type RoomSettingsFormProps = {
  roomName: string;
  currentMaxQueue: number;
  onUpdate: (roomName: string, maxQueue: number, newName?: string) => void | Promise<void>;
};

function RoomSettingsForm({ roomName, currentMaxQueue, onUpdate }: RoomSettingsFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [maxQueue, setMaxQueue] = useState(currentMaxQueue.toString());
  const [newName, setNewName] = useState(roomName);

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="w-full rounded-xl border-2 border-dashed border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-500 transition hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 flex items-center justify-center gap-2"
      >
        <span>⚙️</span> Pengaturan
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const max = parseInt(maxQueue, 10);
        if (isNaN(max) || max < 1) return;
        onUpdate(roomName, max, newName.trim());
        setShowForm(false);
      }}
      className="w-full rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 space-y-3"
    >
      <div>
        <label className="block text-xs font-semibold text-indigo-800 mb-1.5 text-left">
          Nama Ruangan
        </label>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 mb-3"
          required
        />
        <label className="block text-xs font-semibold text-indigo-800 mb-1.5 text-left">
          Maksimal Antrean
        </label>
        <input
          type="number"
          min="1"
          value={maxQueue}
          onChange={(e) => setMaxQueue(e.target.value)}
          className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
        >
          Simpan
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setMaxQueue(currentMaxQueue.toString());
            setNewName(roomName);
          }}
          className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 active:scale-95"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
