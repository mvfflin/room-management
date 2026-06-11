"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { RoomsGrid } from "@/components/RoomsGrid";

const BOOKING_ALLOWED_ROLES = ["admin", "guru", "ketua_ekskul"];
const AUTO_APPROVE_ROLES = ["admin", "guru"];

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

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session, status: sessionStatus } = useSession();
  const userRole = (session?.user as any)?.role as string | undefined;
  const canBook = !!userRole && BOOKING_ALLOWED_ROLES.includes(userRole);
  const isAutoApproved = !!userRole && AUTO_APPROVE_ROLES.includes(userRole);
  const isAdminOrGuru = !!userRole && AUTO_APPROVE_ROLES.includes(userRole);

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

    // Refresh setiap 30 detik untuk melihat perubahan
    const interval = setInterval(fetchRooms, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleBook = async (
    roomName: string,
    bookedFor: string,
    startTime: string,
    endTime: string,
    bookingDate: string,
  ) => {
    const username =
      (session?.user as any)?.username || session?.user?.name || "anonymous";

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomName,
        bookedFor,
        bookedBy: username,
        bookingStart: startTime,
        bookingEnd: endTime,
        bookingDate,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      setNotification({
        type: "error",
        message: data.message || "Gagal memesan ruangan",
      });
      return;
    }

    const booking = await res.json();

    if (booking.status === "pending_approval") {
      setNotification({
        type: "warning",
        message:
          "Pemesanan berhasil diajukan! Menunggu persetujuan dari Admin/Guru.",
      });
    } else {
      setNotification({
        type: "success",
        message:
          booking.queuePosition > 1
            ? `Berhasil masuk antrean ke-${booking.queuePosition} untuk ${roomName}!`
            : `Ruangan ${roomName} berhasil dipesan!`,
      });
    }

    // Refresh data
    await fetchRooms();
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

  const handleUpdateRoom = async (roomName: string, maxQueue: number, newName?: string) => {
    const res = await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: roomName, maxQueue, newName }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setNotification({
        type: "error",
        message: data.message || "Gagal memperbarui pengaturan ruangan",
      });
      return;
    }

    setNotification({
      type: "success",
      message: `Pengaturan ruangan "${newName || roomName}" berhasil diperbarui.`,
    });

    await fetchRooms();
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

          {/* Legend */}
          <div className="mt-6 inline-flex items-center gap-6 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-md border border-zinc-200/60 shadow-sm animate-fade-in stagger-3 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-zinc-600">Sedang Dipakai</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs text-zinc-600">Sudah Ada Jadwal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-zinc-600">Antrean Reservasi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-zinc-600">Tersedia</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-xs text-zinc-600">Maintenance</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Info untuk user yang tidak bisa booking */}
        {sessionStatus !== "loading" && !canBook && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 backdrop-blur-sm px-5 py-4 flex items-start gap-3 animate-fade-in">
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Pemesanan ruangan terbatas
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                Hanya Ketua Ekskul, Guru, atau Admin yang dapat melakukan pemesanan ruangan.
                {!session && " Silakan login terlebih dahulu."}
              </p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6 relative max-w-md animate-fade-in stagger-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-zinc-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
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
            placeholder="Cari ruangan berdasarkan nama..."
            className="block w-full pl-10 pr-3 py-2.5 border border-indigo-200 rounded-2xl leading-5 bg-white/80 backdrop-blur-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
          />
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-200/60 shadow-2xl shadow-indigo-100/50 overflow-hidden">
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
            onBook={canBook ? handleBook : undefined}
            showBookButton={canBook}
            isAdminOrGuru={isAdminOrGuru}
            onToggleClose={isAdminOrGuru ? handleToggleClose : undefined}
            onUpdateRoom={isAdminOrGuru ? handleUpdateRoom : undefined}
          />
        </div>
      </div>
    </main>
  );
}
