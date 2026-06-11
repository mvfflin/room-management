"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BookingList from "@/components/BookingList";
import BookForm from "@/components/BookForm";

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

type RoomDetails = {
  _id: string;
  name: string;
  maxQueue: number;
  isClosed: boolean;
  closedReason: string;
  queueCount: number;
  bookings: BookingItem[];
};

import { getRoomStatus } from "@/lib/roomStatus";

export default function RoomDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();

  const userRole = (session?.user as any)?.role;
  const canBook = userRole === "admin" || userRole === "guru" || userRole === "ketua_ekskul";

  const fetchRoomDetails = async () => {
    try {
      const res = await fetch(`/api/rooms/${resolvedParams.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Ruangan tidak ditemukan.");
        } else {
          setError("Gagal memuat detail ruangan.");
        }
        return;
      }
      const data = await res.json();
      setRoom(data);
    } catch (err) {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetails();
    const interval = setInterval(fetchRoomDetails, 30000);
    return () => clearInterval(interval);
  }, [resolvedParams.id]);

  const handleBook = async (
    roomName: string,
    bookedFor: string,
    startTime: string,
    endTime: string,
    bookingDate: string,
  ) => {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomName,
        bookedFor,
        startTime,
        endTime,
        bookingDate,
      }),
    });
    if (res.ok) {
      alert("Booking berhasil ditambahkan!");
      fetchRoomDetails();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "Gagal melakukan booking");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-indigo-600 animate-spin" />
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
        <h1 className="text-3xl font-bold text-zinc-900 mb-4">Oops!</h1>
        <p className="text-zinc-600 mb-8">{error || "Terjadi kesalahan."}</p>
        <Link
          href="/rooms"
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 active:scale-95"
        >
          Kembali ke Daftar Ruangan
        </Link>
      </main>
    );
  }

  const isFull = room.queueCount >= room.maxQueue;
  const status = getRoomStatus(room);

  return (
    <main className="min-h-screen mt-[-20px] bg-zinc-50">
      <div className={`${status.solidBgClass} pb-32 pt-24 transition-colors duration-500`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => { history.back() }}
            className="inline-flex items-center text-white/80 hover:text-white transition-colors mb-6 text-sm font-medium cursor-pointer"
          >
            ← Kembali ke daftar ruangan
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                {room.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {room.isClosed ? (
                  <span className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-sm font-medium text-slate-200 backdrop-blur-sm border border-slate-600">
                    🔒 Ditutup ({room.closedReason || "Maintenance"})
                  </span>
                ) : (
                  <>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium backdrop-blur-sm border ${room.queueCount === 0
                        ? "bg-emerald-500/20 text-emerald-100 border-emerald-500/30"
                        : isFull
                          ? "bg-rose-500/20 text-rose-100 border-rose-500/30"
                          : "bg-amber-500/20 text-amber-100 border-amber-500/30"
                        }`}
                    >
                      {room.queueCount === 0
                        ? "✅ Tersedia"
                        : isFull
                          ? "⛔ Antrean Penuh"
                          : "⚠️ Sudah Di Reservasi"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm border border-white/30">
                      Antrean: {room.queueCount} / {room.maxQueue}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-20 space-y-6">

        {/* Card Booking */}
        {!room.isClosed && !isFull && canBook && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-zinc-200/60 p-6 md:p-8 animate-fade-in-up">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              Booking Ruangan Ini
            </h2>
            <div className="text-center justify-center items-center w-full">
              <BookForm room={room} onBook={handleBook} />
            </div>
          </div>
        )}

        {/* Card Schedule */}
        <div className="bg-white rounded-3xl shadow-xl border border-zinc-200/60 p-6 md:p-8 animate-fade-in-up stagger-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-zinc-900">
              Daftar Antrean & Jadwal
            </h2>
            <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-zinc-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari agenda..."
                className="block w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
              />
            </div>
          </div>

          {room.bookings.length > 0 ? (
            <div className="space-y-4">
              <BookingList
                bookings={room.bookings.filter((b) =>
                  b.bookedFor.toLowerCase().includes(searchQuery.toLowerCase())
                )}
              />
            </div>
          ) : (
            <div className="py-12 text-center bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
              <span className="text-4xl mb-3 block">📭</span>
              <h3 className="text-lg font-semibold text-zinc-800">
                Belum ada antrean
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Jadwal ruangan ini masih kosong.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
