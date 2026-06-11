import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import Room from "@/models/Room";
import Booking from "@/models/Booking";

export async function GET() {
  try {
    await connectDB();
    const rooms = await Room.find({});
    const now = new Date();

    // Ambil semua booking aktif (belum expired dan belum rejected)
    const activeBookings = await Booking.find({
      bookingEnd: { $gt: now },
      status: { $ne: "rejected" },
    }).sort({ bookingStart: 1, queuePosition: 1 });

    // Gabungkan data room dengan info antrean
    const roomsWithQueue = rooms.map((room) => {
      const roomBookings = activeBookings.filter(
        (b) => b.roomId.toString() === room._id.toString(),
      );
      return {
        _id: room._id,
        name: room.name,
        maxQueue: room.maxQueue ?? 3,
        isClosed: room.isClosed || false,
        closedReason: room.closedReason || "",
        queueCount: roomBookings.length,
        bookings: roomBookings.map((b) => ({
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
    });

    return NextResponse.json(roomsWithQueue);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { message: "Gagal memuat data ruangan" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, maxQueue } = body;

    const exists = await Room.findOne({ name });
    if (exists) {
      return NextResponse.json(
        { message: "Ruangan dengan nama tersebut sudah ada" },
        { status: 409 },
      );
    }

    const room = await Room.create({
      name,
      maxQueue: maxQueue && maxQueue >= 1 ? maxQueue : 3,
    });
    return NextResponse.json(
      { _id: room._id, name: room.name, maxQueue: room.maxQueue, queueCount: 0, bookings: [] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan ruangan" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { message: "Nama ruangan wajib diisi" },
        { status: 400 },
      );
    }

    const room = await Room.findOne({ name });
    if (room) {
      // Hapus juga semua booking terkait
      await Booking.deleteMany({ roomId: room._id });
    }

    await Room.deleteOne({ name });
    return NextResponse.json(
      { message: "Ruangan berhasil dihapus" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { message: "Gagal menghapus ruangan" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/rooms?name=xxx
 * Update pengaturan ruangan (maxQueue)
 */
export async function PATCH(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, maxQueue } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Nama ruangan wajib diisi" },
        { status: 400 },
      );
    }

    if (maxQueue !== undefined && (typeof maxQueue !== "number" || maxQueue < 1)) {
      return NextResponse.json(
        { message: "Maksimal antrean harus minimal 1" },
        { status: 400 },
      );
    }

    const room = await Room.findOne({ name });
    if (!room) {
      return NextResponse.json(
        { message: "Ruangan tidak ditemukan" },
        { status: 404 },
      );
    }

    if (maxQueue !== undefined) {
      room.maxQueue = maxQueue;
    }

    await room.save();

    return NextResponse.json({
      _id: room._id,
      name: room.name,
      maxQueue: room.maxQueue,
    });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui pengaturan ruangan" },
      { status: 500 },
    );
  }
}
