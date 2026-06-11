"use client";

import { useState, useEffect } from "react";
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
  roomName: string;
};

type Room = {
  _id?: string;
  name: string;
  queueCount: number;
  bookings: BookingItem[];
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, "0")}.${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function ApprovalsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const { data: session } = useSession();

  const isAdminOrGuru =
    (session?.user as any)?.role === "admin" ||
    (session?.user as any)?.role === "guru";

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

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleAction = async (bookingId: string, action: "approve" | "reject") => {
    const res = await fetch("/api/bookings/approve", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, action }),
    });
    if (res.ok) {
      await fetchRooms();
    } else {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      alert(data.message || "Gagal memproses");
    }
  };

  if (!isAdminOrGuru) {
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

  // Collect all bookings with room name attached
  const allBookings: BookingItem[] = rooms.flatMap((r) =>
    r.bookings.map((b) => ({ ...b, roomName: r.name })),
  );

  const pendingBookings = allBookings.filter(
    (b) => b.status === "pending_approval",
  );
  const approvedBookings = allBookings.filter(
    (b) => b.status === "approved",
  );

  const filteredBookings =
    filter === "all"
      ? allBookings
      : filter === "pending"
        ? pendingBookings
        : approvedBookings;

  const roomNames = [...new Set(rooms.map((r) => r.name))];
  const [roomFilter, setRoomFilter] = useState<string>("all");

  const displayBookings =
    roomFilter === "all"
      ? filteredBookings
      : filteredBookings.filter((b) => b.roomName === roomFilter);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-yellow-50 border-b border-amber-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight gradient-text animate-fade-in-up">
            Approval Center
          </h1>
          <p className="mt-4 text-lg text-zinc-500 animate-fade-in-up stagger-1">
            Kelola persetujuan pemesanan ruangan
          </p>

          {/* Stats */}
          <div className="mt-8 inline-flex items-center gap-4 animate-fade-in stagger-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`flex flex-col items-center px-5 py-3 rounded-2xl border shadow-sm transition-all ${
                filter === "all"
                  ? "bg-white border-indigo-300 shadow-indigo-100"
                  : "bg-white/70 backdrop-blur-md border-zinc-200/60 hover:border-zinc-300"
              }`}
            >
              <span className="text-2xl font-bold text-zinc-900">
                {allBookings.length}
              </span>
              <span className="text-xs text-zinc-500 mt-1">Semua</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`flex flex-col items-center px-5 py-3 rounded-2xl border shadow-sm transition-all ${
                filter === "pending"
                  ? "bg-amber-50 border-amber-300 shadow-amber-100"
                  : "bg-white/70 backdrop-blur-md border-zinc-200/60 hover:border-zinc-300"
              }`}
            >
              <span className="text-2xl font-bold text-amber-600">
                {pendingBookings.length}
              </span>
              <span className="text-xs text-zinc-500 mt-1">Menunggu</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("approved")}
              className={`flex flex-col items-center px-5 py-3 rounded-2xl border shadow-sm transition-all ${
                filter === "approved"
                  ? "bg-emerald-50 border-emerald-300 shadow-emerald-100"
                  : "bg-white/70 backdrop-blur-md border-zinc-200/60 hover:border-zinc-300"
              }`}
            >
              <span className="text-2xl font-bold text-emerald-600">
                {approvedBookings.length}
              </span>
              <span className="text-xs text-zinc-500 mt-1">Disetujui</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Room filter */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-zinc-600">
            Filter Ruangan:
          </span>
          <button
            type="button"
            onClick={() => setRoomFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              roomFilter === "all"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Semua
          </button>
          {roomNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setRoomFilter(name)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                roomFilter === name
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-amber-600 animate-spin" />
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-200/60 shadow-xl p-16 text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-zinc-500">
              Tidak ada booking yang sesuai filter.
            </p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-200/60 shadow-2xl shadow-amber-100/50 overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {displayBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="p-5 flex items-center gap-4 hover:bg-zinc-50/50 transition-colors"
                >
                  {/* Status indicator */}
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      booking.status === "pending_approval"
                        ? "bg-amber-500 animate-pulse"
                        : booking.status === "approved"
                          ? "bg-emerald-500"
                          : "bg-red-500"
                    }`}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-zinc-900">
                        {booking.roomName}
                      </span>
                      <span
                        className={`booking-status ${
                          booking.status === "pending_approval"
                            ? "booking-status--pending"
                            : booking.status === "approved"
                              ? "booking-status--approved"
                              : "booking-status--rejected"
                        }`}
                      >
                        {booking.status === "pending_approval"
                          ? "Menunggu"
                          : booking.status === "approved"
                            ? "Disetujui"
                            : "Ditolak"}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Antrean #{booking.queuePosition}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 truncate mt-0.5">
                      {booking.bookedFor}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                      <span>👤 {booking.bookedBy}</span>
                      <span>
                        🕐 {formatTime(booking.bookingStart)} -{" "}
                        {formatTime(booking.bookingEnd)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {booking.status === "pending_approval" && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAction(booking._id, "approve")}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                      >
                        ✓ Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(booking._id, "reject")}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
                      >
                        ✕ Tolak
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
