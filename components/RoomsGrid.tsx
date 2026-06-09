"use client";

import { useState } from "react";

type Room = {
  _id?: string;
  name: string;
  booked: boolean;
  bookedFor?: string;
  bookingStart?: string;
  bookingEnd?: string;
};

type StatusConfig = {
  available: {
    label: string;
    bg: string;
    border: string;
    dot: string;
    dotRing: string;
    text: string;
    badge: string;
  };
  booked: {
    label: string;
    bg: string;
    border: string;
    dot: string;
    dotRing: string;
    text: string;
    badge: string;
  };
};

const statusConfig: StatusConfig = {
  available: {
    label: "Tersedia",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    dotRing: "ring-emerald-100",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
  },
  booked: {
    label: "Dibooking",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
    dotRing: "ring-rose-100",
    text: "text-rose-700",
    badge: "bg-rose-100 text-rose-700",
  },
};

type GridProps = {
  rooms: Room[];
  loading?: boolean;
  onBook?: (
    roomName: string,
    bookedFor: string,
    startTime?: string,
    endTime?: string
  ) => void | Promise<void>;
  showBookButton?: boolean;
};

export function RoomsGrid({
  rooms,
  loading = false,
  onBook,
  showBookButton = true,
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
        const isAvailable = !room.booked;
        const status = isAvailable
          ? statusConfig.available
          : statusConfig.booked;

        return (
          <div
            key={room._id || room.name}
            className={`animate-slide-in-scale stagger-${Math.min(index + 1, 8)}`}
          >
            <div
              className={`relative rounded-2xl border bg-white p-5 card-hover ${
                isAvailable ? "border-emerald-200" : "border-rose-200"
              }`}
            >
              <div
                className={`absolute -top-3 -left-3 w-5 h-5 rounded-full shadow-lg ring-4 ${
                  isAvailable
                    ? "bg-emerald-500 ring-emerald-100"
                    : "bg-rose-500 ring-rose-100"
                }`}
              />

              <div className="flex flex-col items-center text-center">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                    isAvailable
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {status.label}
                </div>

                <h3 className="mt-4 text-lg font-bold text-zinc-900">
                  {room.name}
                </h3>

                {room.bookedFor && (
                  <p className="mt-2 text-sm text-zinc-500 line-clamp-2">
                    {room.bookedFor}
                  </p>
                )}

                {room.booked && room.bookingStart && room.bookingEnd && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {room.bookingStart.slice(0, 5)} -{" "}
                    {room.bookingEnd.slice(0, 5)}
                  </p>
                )}

                <p className="mt-4 text-xs text-zinc-400 font-medium uppercase tracking-wider">
                  {isAvailable ? "Siap pakai" : "Sedang dipakai"}
                </p>

                {isAvailable && showBookButton && (
                  <div className="mt-5 w-full space-y-2">
                    <BookForm room={room} onBook={onBook} />
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

type BookFormProps = {
  room: Room;
  onBook?: (
    roomName: string,
    bookedFor: string,
    startTime?: string,
    endTime?: string
  ) => void | Promise<void>;
};

function BookForm({ room, onBook }: BookFormProps) {
  const [bookingRoom, setBookingRoom] = useState<string | null>(null);
  const [bookedFor, setBookedFor] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  if (!onBook) return null;

  if (bookingRoom !== room.name) {
    return (
      <button
        type="button"
        onClick={() => setBookingRoom(room.name)}
        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:opacity-90 active:scale-95"
      >
        Book Now
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!bookedFor.trim()) return;
        onBook(room.name, bookedFor.trim(), startTime || undefined, endTime || undefined);
        setBookedFor("");
        setStartTime("");
        setEndTime("");
        setBookingRoom(null);
      }}
      className="w-full space-y-2"
    >
      <input
        value={bookedFor}
        onChange={(e) => setBookedFor(e.target.value)}
        placeholder="Keperluan booking..."
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          min={startTime || undefined}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
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
          onClick={() => {
            setBookingRoom(null);
            setBookedFor("");
            setStartTime("");
            setEndTime("");
          }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
