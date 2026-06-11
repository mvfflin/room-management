"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { RoomsGrid } from "@/components/RoomsGrid";
import BookingList from "@/components/BookingList";

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
  queueCount: number;
  bookings: BookingItem[];
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

  const handleApprove = async (bookingId: string) => {
    const res = await fetch("/api/bookings/approve", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, action: "approve" }),
    });
    if (res.ok) {
      await fetchRooms();
    } else {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      alert(data.message || "Gagal menyetujui booking");
    }
  };

  const handleReject = async (bookingId: string) => {
    const res = await fetch("/api/bookings/approve", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, action: "reject" }),
    });
    if (res.ok) {
      await fetchRooms();
    } else {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      alert(data.message || "Gagal menolak booking");
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const res = await fetch(`/api/bookings?id=${bookingId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchRooms();
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

  // Collect all bookings across rooms
  const allBookings = rooms.flatMap((r) => r.bookings);
  const pendingBookings = allBookings.filter(
    (b) => b.status === "pending_approval",
  );
  const activeBookings = allBookings.filter((b) => b.status === "approved");

  return (
    <main className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-orange-50 border-b border-rose-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-200/40 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight gradient-text animate-fade-in-up">
            Admin Rooms
          </h1>
          <p className="mt-4 text-lg text-zinc-500 animate-fade-in-up stagger-1">
            Kelola status Booking, Antrean, dan Approval
          </p>

          {/* Stats */}
          <div className="mt-8 inline-flex items-center gap-6 animate-fade-in stagger-2">
            <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-white/70 backdrop-blur-md border border-zinc-200/60 shadow-sm">
              <span className="text-2xl font-bold text-zinc-900">
                {rooms.length}
              </span>
              <span className="text-xs text-zinc-500 mt-1">Total Ruangan</span>
            </div>
            <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-white/70 backdrop-blur-md border border-amber-200/60 shadow-sm">
              <span className="text-2xl font-bold text-amber-600">
                {pendingBookings.length}
              </span>
              <span className="text-xs text-zinc-500 mt-1">Menunggu Approval</span>
            </div>
            <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-white/70 backdrop-blur-md border border-emerald-200/60 shadow-sm">
              <span className="text-2xl font-bold text-emerald-600">
                {activeBookings.length}
              </span>
              <span className="text-xs text-zinc-500 mt-1">Booking Aktif</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Pending Approvals Section */}
        {pendingBookings.length > 0 && (
          <div className="bg-amber-50/80 backdrop-blur-xl rounded-3xl border border-amber-200/60 shadow-2xl shadow-amber-100/50 overflow-hidden p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-xl font-bold text-zinc-900">
                Menunggu Persetujuan ({pendingBookings.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingBookings.map((booking) => {
                const room = rooms.find((r) =>
                  r.bookings.some((b) => b._id === booking._id),
                );
                return (
                  <div
                    key={booking._id}
                    className="rounded-2xl border border-amber-200 bg-white p-5 card-hover"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-zinc-900">
                        {room?.name}
                      </span>
                      <span className="booking-status booking-status--pending">
                        Menunggu
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600">{booking.bookedFor}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                      <span>👤 {booking.bookedBy}</span>
                      <span>
                        🕐{" "}
                        {new Date(booking.bookingStart)
                          .getHours()
                          .toString()
                          .padStart(2, "0")}
                        .
                        {new Date(booking.bookingStart)
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}{" "}
                        -{" "}
                        {new Date(booking.bookingEnd)
                          .getHours()
                          .toString()
                          .padStart(2, "0")}
                        .
                        {new Date(booking.bookingEnd)
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(booking._id)}
                        className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                      >
                        ✓ Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(booking._id)}
                        className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
                      >
                        ✕ Tolak
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Rooms Grid */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-200/60 shadow-2xl shadow-rose-100/50 overflow-hidden">
          <RoomsGrid
            rooms={rooms}
            loading={loading}
            showBookButton={false}
          />

          {/* Booked rooms with cancel actions */}
          {activeBookings.length > 0 && (
            <div className="px-8 pb-8">
              <p className="text-sm text-zinc-500 mb-3 font-medium">
                Booking Aktif — Kelola antrean per ruangan:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms
                  .filter((r) => r.bookings.length > 0)
                  .map((room) => (
                    <div
                      key={room._id || room.name}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5"
                    >
                      <h4 className="font-semibold text-zinc-900 mb-3">
                        {room.name}
                      </h4>
                      <BookingList
                        bookings={room.bookings}
                        showActions={true}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onCancel={handleCancelBooking}
                      />
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
