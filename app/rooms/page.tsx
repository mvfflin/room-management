"use client";

import { useState, useEffect, useRef } from "react";
import BookNowForm from "@/components/BookNowForm";

type Room = {
  _id?: string;
  name: string;
  booked: boolean;
  bookedFor?: string;
  bookingStart?: string;
  bookingEnd?: string;
};

const statusConfig = {
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

function getTodayDate(time?: string) {
  if (!time) return undefined;
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingRoom, setBookingRoom] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms");
      if (!res.ok) return;
      const data = (await res.json()) as Room[];
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const releaseExpired = () => {
    setRooms((prev) =>
      prev.map((room) => {
        if (!room.booked || !room.bookingEnd) return room;
        const end = getTodayDate(room.bookingEnd);
        if (!end) return room;
        const now = new Date();
        if (now >= end) {
          return {
            ...room,
            booked: false,
            bookedFor: "",
            bookingStart: undefined,
            bookingEnd: undefined,
          };
        }
        return room;
      }),
    );
  };

  useEffect(() => {
    fetchRooms();

    timerRef.current = window.setInterval(() => {
      releaseExpired();
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleBook = async (
    roomName: string,
    bookedFor: string,
    startTime?: string,
    endTime?: string,
  ) => {
    const room = rooms.find((r) => r.name === roomName);
    if (!room) return;

    const start = getTodayDate(startTime);
    const end = getTodayDate(endTime);

    if (start && end && end <= start) {
      alert("Jam selesai harus lebih besar dari jam mulai");
      return;
    }

    const res = await fetch("/api/rooms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: roomName,
        booked: true,
        bookedFor,
        bookingStart: startTime,
        bookingEnd: endTime,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      alert(data.message || "Gagal memesan ruangan");
      return;
    }

    const updatedRoom = (await res.json()) as Room;
    setRooms((prev) =>
      prev.map((room) => (room.name === roomName ? updatedRoom : room)),
    );
    setBookingRoom(null);
  };

  return (
    <main className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-b border-indigo-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/50 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight gradient-text animate-fade-in-up">
            Daftar Ruangan
          </h1>
          <p className="mt-4 text-lg text-zinc-500 animate-fade-in-up stagger-1">
            Pilih ruangan yang tersedia sesuai kebutuhan Anda
          </p>
          <p className="mt-2 text-sm text-zinc-400 animate-fade-in stagger-2">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-200/60 shadow-2xl shadow-indigo-100/50 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Memuat data...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8">
              {rooms.map((room, index) => {
                const isAvailable = !room.booked;
                const status = isAvailable
                  ? statusConfig.available
                  : statusConfig.booked;

                return (
                  <div
                    key={room.name}
                    className={`relative rounded-xl border-2 ${status.border} ${status.bg} p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                  >
                    <div className="absolute -top-3 -left-3">
                      <div
                        className={`w-5 h-5 rounded-full ${status.dot} ring-4 ${status.dotRing} shadow-sm`}
                      />
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${status.badge}`}
                      >
                        {status.label}
                      </div>

                      <h2 className="mt-4 text-lg font-bold text-zinc-900">
                        {room.name}
                      </h2>

                      {room.bookedFor && (
                        <p className="mt-2 text-sm text-zinc-500">
                          {room.bookedFor}
                        </p>
                      )}

                      {room.booked && room.bookingStart && room.bookingEnd && (
                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(room.bookingStart).getHours()}.
                          {new Date(room.bookingStart)
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}{" "}
                          - {new Date(room.bookingEnd).getHours()}.
                          {new Date(room.bookingEnd)
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}
                        </p>
                      )}

                      <div className="mt-5 text-xs text-zinc-400 font-medium uppercase tracking-wider">
                        {isAvailable ? "Siap pakai" : "Sedang dipakai"}
                      </div>

                      {isAvailable && (
                        <div className="mt-4 w-full">
                          {bookingRoom === room.name ? (
                            <BookNowForm
                              roomName={room.name}
                              onBook={handleBook}
                              onCancel={() => setBookingRoom(null)}
                            />
                          ) : (
                            <button
                              onClick={() => setBookingRoom(room.name)}
                              className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                            >
                              Book Now
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
