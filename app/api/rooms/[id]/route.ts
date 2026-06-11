import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import Room from "@/models/Room";
import Booking from "@/models/Booking";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const room = await Room.findById((await params).id);

    if (!room) {
      return NextResponse.json(
        { message: "Ruangan tidak ditemukan" },
        { status: 404 }
      );
    }

    const now = new Date();

    // Ambil semua booking aktif untuk ruangan ini
    const activeBookings = await Booking.find({
      roomId: room._id,
      bookingEnd: { $gt: now },
      status: { $ne: "rejected" },
    }).sort({ bookingStart: 1, queuePosition: 1 });

    const roomDetails = {
      _id: room._id,
      name: room.name,
      maxQueue: room.maxQueue ?? 3,
      isClosed: room.isClosed || false,
      closedReason: room.closedReason || "",
      queueCount: activeBookings.length,
      bookings: activeBookings.map((b) => ({
        _id: b._id,
        bookedFor: b.bookedFor,
        bookedBy: b.bookedBy,
        bookingStart: b.bookingStart,
        bookingEnd: b.bookingEnd,
        queuePosition: b.queuePosition,
        status: b.status,
        needsApproval: b.needsApproval,
      })),
    };

    return NextResponse.json(roomDetails);
  } catch (error) {
    console.error("Error fetching room details:", error);
    return NextResponse.json(
      { message: "Gagal memuat data ruangan" },
      { status: 500 }
    );
  }
}
