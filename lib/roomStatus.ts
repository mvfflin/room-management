export type BookingItemStatus = "approved" | "pending_approval" | "rejected";

export type StatusBookingItem = {
  status: BookingItemStatus;
  bookingStart: string | Date;
  bookingEnd: string | Date;
};

export type StatusRoom = {
  isClosed?: boolean;
  bookings: StatusBookingItem[];
};

export type RoomStatusResult = {
  id: "maintenance" | "used" | "scheduled" | "requested" | "ready";
  label: string;
  bgClass: string;
  borderClass: string;
  dotClass: string;
  dotRingClass: string;
  textClass: string;
  solidBgClass: string;
};

export function getRoomStatus(room: StatusRoom): RoomStatusResult {
  if (room.isClosed) {
    return {
      id: "maintenance",
      label: "Maintenance",
      bgClass: "bg-white",
      borderClass: "border-slate-300",
      dotClass: "bg-slate-400",
      dotRingClass: "ring-slate-100",
      textClass: "text-slate-700",
      solidBgClass: "bg-slate-600",
    };
  }

  const now = new Date();

  const isUsed = room.bookings.some(
    (b) =>
      b.status === "approved" &&
      new Date(b.bookingStart) <= now &&
      new Date(b.bookingEnd) > now,
  );
  if (isUsed) {
    return {
      id: "used",
      label: "Sedang dipakai",
      bgClass: "bg-white",
      borderClass: "border-red-300",
      dotClass: "bg-red-500",
      dotRingClass: "ring-red-100",
      textClass: "text-red-700",
      solidBgClass: "bg-red-600",
    };
  }

  const isScheduled = room.bookings.some(
    (b) => b.status === "approved" && new Date(b.bookingStart) > now,
  );
  if (isScheduled) {
    return {
      id: "scheduled",
      label: "Sudah ada jadwal",
      bgClass: "bg-white",
      borderClass: "border-yellow-300",
      dotClass: "bg-yellow-500",
      dotRingClass: "ring-yellow-100",
      textClass: "text-yellow-700",
      solidBgClass: "bg-yellow-500",
    };
  }

  const isRequested = room.bookings.some((b) => b.status === "pending_approval");
  if (isRequested) {
    return {
      id: "requested",
      label: "Antrean reservasi",
      bgClass: "bg-white",
      borderClass: "border-orange-300",
      dotClass: "bg-orange-500",
      dotRingClass: "ring-orange-100",
      textClass: "text-orange-700",
      solidBgClass: "bg-orange-500",
    };
  }

  return {
    id: "ready",
    label: "Ready for reservation",
    bgClass: "bg-white",
    borderClass: "border-emerald-300",
    dotClass: "bg-emerald-500",
    dotRingClass: "ring-emerald-100",
    textClass: "text-emerald-700",
    solidBgClass: "bg-emerald-600",
  };
}
