"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { RoomsGrid } from "@/components/RoomsGrid";

type Room = {
  _id?: string;
  name: string;
  booked: boolean;
  bookedFor?: string;
  bookingStart?: string;
  bookingEnd?: string;
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const isAdmin = (session?.user as any)?.role === "admin";

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rooms");
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as Room[];
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCancelBook = async (roomName: string) => {
    const res = await fetch(`/api/rooms`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: roomName,
        booked: false,
        bookedFor: "",
        bookingStart: null,
        bookingEnd: null,
      }),
    });

    if (res.ok) {
      setRooms((prev) =>
        prev.map((room) =>
          room.name === roomName
            ? {
                ...room,
                booked: false,
                bookedFor: "",
                bookingStart: undefined,
                bookingEnd: undefined,
              }
            : room,
        ),
      );
    } else {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      alert(data.message || "Gagal membatalkan booking");
    }
  };

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-zinc-900">Akses Ditolak</h1>
          <p className="mt-2 text-zinc-500">
            Anda tidak memiliki hak akses ke halaman ini.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-orange-50 border-b border-rose-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-200/40 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight gradient-text animate-fade-in-up">
            Admin Rooms
          </h1>
          <p className="mt-4 text-lg text-zinc-500 animate-fade-in-up stagger-1">
            Kelola status Booking dan hapus ruangan
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-200/60 shadow-2xl shadow-rose-100/50 overflow-hidden">
          <RoomsGrid
            rooms={rooms}
            loading={loading}
            onBook={async () => {}}
            showBookButton={false}
          />

          {rooms.some((r) => r.booked) && (
            <div className="px-8 pb-8">
              <p className="text-sm text-zinc-500 mb-3 font-medium">
                Ruangan yang sedang dibooking:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {rooms
                  .filter((r) => r.booked)
                  .map((room) => (
                    <div
                      key={room._id || room.name}
                      className="animate-slide-in-scale rounded-xl border border-rose-200 bg-rose-50/50 p-4 flex flex-col items-center text-center card-hover"
                    >
                      <h4 className="font-semibold text-zinc-900">
                        {room.name}
                      </h4>
                      {room.bookedFor && (
                        <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                          {room.bookedFor}
                        </p>
                      )}
                      {room.bookingStart && room.bookingEnd && (
                        <p className="mt-1 text-[11px] text-zinc-500">
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
                      <button
                        type="button"
                        onClick={() => handleCancelBook(room.name)}
                        className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
