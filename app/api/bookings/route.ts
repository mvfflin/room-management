import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/connectDB";
import Booking from "@/models/Booking";
import Room from "@/models/Room";
import { redis } from "@/lib/redis";

/** Roles yang diizinkan membuat booking */
const BOOKING_ALLOWED_ROLES = ["admin", "guru", "ketua_ekskul"];

/** Roles yang langsung approved tanpa perlu approval */
const AUTO_APPROVE_ROLES = ["admin", "guru"];

/**
 * GET /api/bookings?roomName=xxx
 * Ambil semua booking aktif (opsional filter by roomName)
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get("roomName");

    const now = new Date();
    const filter: Record<string, unknown> = {
      bookingEnd: { $gt: now },
      status: { $ne: "rejected" },
    };

    if (roomName) {
      filter.roomName = roomName;
    }

    const bookings = await Booking.find(filter).sort({
      bookingStart: 1,
      queuePosition: 1,
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { message: "Gagal memuat data pemesanan" },
      { status: 500 },
    );
  }
}

function parseDateTime(dateStr: string, time: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return date;
}

/**
 * POST /api/bookings
 * Buat pemesanan baru — hanya untuk role admin, guru, ketua_ekskul.
 * Admin & guru langsung approved; ketua_ekskul perlu approval.
 */
export async function POST(request: Request) {
  try {
    // Cek session & role via JWT token
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json(
        { message: "Anda harus login terlebih dahulu" },
        { status: 401 },
      );
    }

    const userRole = token.role as string | undefined;
    if (!userRole || !BOOKING_ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        {
          message:
            "Hanya Ketua Ekskul, Guru, atau Admin yang dapat melakukan pemesanan ruangan.",
        },
        { status: 403 },
      );
    }

    await connectDB();
    const body = await request.json();
    const { roomName, bookedFor, bookedBy, bookingStart, bookingEnd, bookingDate } = body;

    // Validasi input
    if (!roomName || !bookedFor || !bookedBy || !bookingStart || !bookingEnd || !bookingDate) {
      return NextResponse.json(
        {
          message:
            "Semua field wajib diisi (roomName, bookedFor, bookedBy, bookingStart, bookingEnd, bookingDate)",
        },
        { status: 400 },
      );
    }

    if (token.name !== bookedBy) {
      return NextResponse.json(
        {
          message: "Nama pemesan harus sesuai dengan nama pengguna yang login.",
        },
        { status: 403 },
      );
    }

    const start = parseDateTime(bookingDate, bookingStart);
    const end = parseDateTime(bookingDate, bookingEnd);

    if (end <= start) {
      return NextResponse.json(
        { message: "Jam selesai harus lebih besar dari jam mulai" },
        { status: 400 },
      );
    }

    // Cek apakah tanggal booking sudah lewat
    const now = new Date();
    if (end <= now) {
      return NextResponse.json(
        { message: "Tidak dapat membuat booking untuk waktu yang sudah lewat" },
        { status: 400 },
      );
    }

    // Cari room
    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return NextResponse.json(
        { message: "Ruangan tidak ditemukan" },
        { status: 404 },
      );
    }

    // Cek apakah ruangan sedang ditutup
    if (room.isClosed) {
      return NextResponse.json(
        {
          message: `Ruangan "${roomName}" sedang ditutup${room.closedReason ? ` (${room.closedReason})` : ""}. Tidak dapat melakukan pemesanan.`,
        },
        { status: 403 },
      );
    }

    // Cari booking yang sudah APPROVED dan overlap pada slot waktu yang sama
    const approvedOverlapping = await Booking.find({
      roomId: room._id,
      status: "approved",
      bookingEnd: { $gt: start },
      bookingStart: { $lt: end },
    });

    // Jika sudah ada booking yang disetujui di waktu yang sama, tolak
    if (approvedOverlapping.length > 0) {
      return NextResponse.json(
        {
          message:
            "Slot waktu ini sudah memiliki booking yang disetujui. Silakan pilih waktu atau tanggal lain.",
        },
        { status: 409 },
      );
    }

    // Cari semua booking (termasuk pending) yang overlap
    const overlappingBookings = await Booking.find({
      roomId: room._id,
      status: { $ne: "rejected" },
      bookingEnd: { $gt: start },
      bookingStart: { $lt: end },
    }).sort({ bookingStart: 1, queuePosition: 1 });

    // Cek batas maksimal antrean (sesuai pengaturan ruangan)
    const maxQueue = room.maxQueue ?? 3;
    if (overlappingBookings.length >= maxQueue) {
      return NextResponse.json(
        {
          message:
            `Slot waktu ini sudah penuh (maksimal ${maxQueue} antrean). Silakan pilih waktu lain.`,
        },
        { status: 409 },
      );
    }

    // Tentukan posisi antrean
    const queuePosition = overlappingBookings.length + 1;

    // Tentukan status berdasarkan role:
    // Admin & Guru → langsung approved
    // Ketua Ekskul → pending_approval (perlu approval dari admin/guru)
    const isAutoApproved = AUTO_APPROVE_ROLES.includes(userRole);
    const status = isAutoApproved ? "approved" : "pending_approval";
    const needsApproval = !isAutoApproved;

    // Buat booking baru
    const booking = await Booking.create({
      roomId: room._id,
      roomName,
      bookedFor,
      bookedBy,
      bookingStart: start,
      bookingEnd: end,
      queuePosition,
      status,
      needsApproval,
    });

    await redis.del("rooms_cache");

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { message: "Gagal membuat pemesanan" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/bookings?id=xxx
 * Hapus/batalkan booking
 */
export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID booking wajib diisi" },
        { status: 400 },
      );
    }

    await Booking.findByIdAndDelete(id);
    await redis.del("rooms_cache");

    return NextResponse.json(
      { message: "Booking berhasil dibatalkan" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { message: "Gagal membatalkan booking" },
      { status: 500 },
    );
  }
}
