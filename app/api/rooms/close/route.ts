import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/connectDB";
import Room from "@/models/Room";

/** Roles yang boleh close/open ruangan */
const ALLOWED_ROLES = ["admin", "guru"];

/**
 * PUT /api/rooms/close
 * Close atau open ruangan — hanya admin & guru
 * Body: { roomName: string, action: "close" | "open", reason?: string }
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
    if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { message: "Hanya Admin atau Guru yang dapat menutup/membuka ruangan." },
        { status: 403 },
      );
    }

    await connectDB();
    const body = await request.json();
    const { roomName, action, reason } = body;

    if (!roomName || !action) {
      return NextResponse.json(
        { message: "roomName dan action wajib diisi" },
        { status: 400 },
      );
    }

    if (action !== "close" && action !== "open") {
      return NextResponse.json(
        { message: "Action harus 'close' atau 'open'" },
        { status: 400 },
      );
    }

    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return NextResponse.json(
        { message: "Ruangan tidak ditemukan" },
        { status: 404 },
      );
    }

    if (action === "close") {
      room.isClosed = true;
      room.closedReason = reason || "Maintenance";
    } else {
      room.isClosed = false;
      room.closedReason = "";
    }

    await room.save();

    return NextResponse.json({
      _id: room._id,
      name: room.name,
      isClosed: room.isClosed,
      closedReason: room.closedReason,
    });
  } catch (error) {
    console.error("Error toggling room status:", error);
    return NextResponse.json(
      { message: "Gagal mengubah status ruangan" },
      { status: 500 },
    );
  }
}
