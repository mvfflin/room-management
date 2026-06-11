"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
  isClosed?: boolean;
  closedReason?: string;
  queueCount: number;
  bookings: BookingItem[];
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();

  const isAdmin = (session?.user as any)?.role === "admin";
  const isAdminOrGuru =
    (session?.user as any)?.role === "admin" ||
    (session?.user as any)?.role === "guru";

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

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  const handleToggleClose = async (
    roomName: string,
    action: "close" | "open",
    reason?: string,
  ) => {
    const res = await fetch("/api/rooms/close", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, action, reason }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      setNotification({
        type: "error",
        message: data.message || "Gagal mengubah status ruangan",
      });
      return;
    }

    setNotification({
      type: "success",
      message:
        action === "close"
          ? `Ruangan "${roomName}" berhasil ditutup.`
          : `Ruangan "${roomName}" berhasil dibuka kembali.`,
    });

    await fetchRooms();
  };

  const handleUpdateMaxQueue = async (roomName: string, maxQueue: number) => {
    const res = await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: roomName, maxQueue }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setNotification({
        type: "error",
        message: data.message || "Gagal memperbarui maksimal antrean",
      });
      return;
    }

    setNotification({
      type: "success",
      message: `Maksimal antrean ruangan "${roomName}" berhasil diubah menjadi ${maxQueue}.`,
    });

    await fetchRooms();
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

  // Collect all bookings across rooms
  const allBookings = rooms.flatMap((r) => r.bookings);
  const pendingBookings = allBookings.filter(
    (b) => b.status === "pending_approval",
  );
  const activeBookings = allBookings.filter((b) => b.status === "approved");
  const closedRooms = rooms.filter((r) => r.isClosed);

  return (
    <main className="min-h-screen h-full h-max">
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
          <div className="mt-8 inline-flex items-center gap-6 animate-fade-in stagger-2 flex-wrap justify-center">
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
            <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-300/60 shadow-sm">
              <span className="text-2xl font-bold text-slate-600">
                {closedRooms.length}
              </span>
              <span className="text-xs text-zinc-500 mt-1">Ruangan Ditutup</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`notification notification--${notification.type} animate-fade-in-up`}
          >
            <span>
              {notification.type === "success"
                ? "✅"
                : notification.type === "warning"
                  ? "⚠️"
                  : "❌"}
            </span>
            <p>{notification.message}</p>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="ml-auto text-current opacity-60 hover:opacity-100 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
                        📅{" "}
                        {new Date(booking.bookingStart).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        {" · "}🕐{" "}
                        {new Date(booking.bookingStart).getHours().toString().padStart(2, "0")}
                        .
                        {new Date(booking.bookingStart).getMinutes().toString().padStart(2, "0")}
                        {" "}-{" "}
                        {new Date(booking.bookingEnd).getHours().toString().padStart(2, "0")}
                        .
                        {new Date(booking.bookingEnd).getMinutes().toString().padStart(2, "0")}
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

        {/* Search Bar & All Rooms Grid */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-200/60 shadow-2xl shadow-rose-100/50 overflow-hidden">
          <div className="p-6 border-b border-zinc-200/60 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-zinc-800">Daftar Ruangan</h3>
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-zinc-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ruangan..."
                className="block w-full pl-10 pr-3 py-2 border border-zinc-200 rounded-xl leading-5 bg-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-all"
              />
            </div>
          </div>
          <RoomsGrid
            rooms={rooms.filter((room) => {
              const query = searchQuery.toLowerCase();
              const matchName = room.name.toLowerCase().includes(query);
              const matchBooking = room.bookings.some((b) =>
                b.bookedFor.toLowerCase().includes(query)
              );
              return matchName || matchBooking;
            })}
            loading={loading}
            showBookButton={false}
            isAdminOrGuru={isAdminOrGuru}
            onToggleClose={handleToggleClose}
            onUpdateMaxQueue={handleUpdateMaxQueue}
          />

          {/* Booked rooms with cancel actions */}
          {/* {activeBookings.length > 0 && (
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
                        bookings={room.bookings.slice(0, 3)}
                        showActions={true}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onCancel={handleCancelBooking}
                      />
                      {room.bookings.length > 3 && room._id && (
                        <Link
                          href={`/admin/rooms/${room._id}`}
                          className="mt-3 block text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50/50 py-2 rounded-lg"
                        >
                          Kelola {room.bookings.length - 3} antrean lainnya di detail ruangan &rarr;
                        </Link>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )} */}
        </div>
      </div>
    </main>
  );
}
