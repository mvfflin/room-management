import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import Room from "@/models/Room";

async function releaseExpiredBookings() {
  const now = new Date();
  await Room.updateMany(
    { booked: true, bookingEnd: { $lt: now } },
    { booked: false, bookedFor: "", bookingStart: null, bookingEnd: null },
  );
}

export async function GET() {
  try {
    await connectDB();
    await releaseExpiredBookings();
    const rooms = await Room.find({});
    return NextResponse.json(rooms);
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
    const { name } = body;

    const exists = await Room.findOne({ name });
    if (exists) {
      return NextResponse.json(
        { message: "Ruangan dengan nama tersebut sudah ada" },
        { status: 409 },
      );
    }

    const room = await Room.create({ name, booked: false });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan ruangan" },
      { status: 500 },
    );
  }
}

function parseTodayTime(time: string) {
  if (!time) return undefined;
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, booked, bookedFor, bookingStart, bookingEnd } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Nama ruangan wajib diisi" },
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

    if (booked === true && bookingStart && bookingEnd) {
      room.booked = true;
      room.bookedFor = bookedFor ?? room.bookedFor;
      room.bookingStart = parseTodayTime(bookingStart);
      room.bookingEnd = parseTodayTime(bookingEnd);
    } else if (booked === false) {
      room.booked = false;
      room.bookedFor = bookedFor ?? "";
      room.bookingStart = null;
      room.bookingEnd = null;
    } else {
      room.booked = booked ?? room.booked;
      room.bookedFor = bookedFor ?? room.bookedFor;
    }

    await room.save();
    return NextResponse.json(room);
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui ruangan" },
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
