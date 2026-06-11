import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/connectDB";
import Booking from "@/models/Booking";
import { redis } from "@/lib/redis";

/** Roles yang boleh approve/reject booking */
const APPROVER_ROLES = ["admin", "guru"];

/**
 * PUT /api/bookings/approve
 * Approve atau reject booking yang pending — hanya admin & guru
 */
export async function PUT(request: Request) {
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
    if (!userRole || !APPROVER_ROLES.includes(userRole)) {
      return NextResponse.json(
        { message: "Hanya Admin atau Guru yang dapat menyetujui/menolak booking." },
        { status: 403 },
      );
    }

    await connectDB();
    const body = await request.json();
    const { bookingId, action } = body;

    if (!bookingId || !action) {
      return NextResponse.json(
        { message: "bookingId dan action wajib diisi" },
        { status: 400 },
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { message: "Action harus 'approve' atau 'reject'" },
        { status: 400 },
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { message: "Booking tidak ditemukan" },
        { status: 404 },
      );
    }

    if (booking.status !== "pending_approval") {
      return NextResponse.json(
        { message: "Booking ini tidak memerlukan approval" },
        { status: 400 },
      );
    }

    // Jika action adalah approve, cek apakah ada booking lain yang sudah approved
    // dan overlap di waktu yang sama
    if (action === "approve") {
      const approvedOverlapping = await Booking.find({
        _id: { $ne: booking._id },
        roomId: booking.roomId,
        status: "approved",
        bookingEnd: { $gt: booking.bookingStart },
        bookingStart: { $lt: booking.bookingEnd },
      });

      if (approvedOverlapping.length > 0) {
        return NextResponse.json(
          {
            message:
              "Tidak dapat menyetujui — sudah ada booking lain yang disetujui di slot waktu yang sama.",
          },
          { status: 409 },
        );
      }
    }

    booking.status = action === "approve" ? "approved" : "rejected";
    booking.needsApproval = false;
    await booking.save();
    
    await redis.del("rooms_cache");

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error approving booking:", error);
    return NextResponse.json(
      { message: "Gagal memproses approval" },
      { status: 500 },
    );
  }
}
