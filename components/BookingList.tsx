"use client";

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

type BookingListProps = {
  bookings: BookingItem[];
  showActions?: boolean;
  onApprove?: (bookingId: string) => void;
  onReject?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, "0")}.${d.getMinutes().toString().padStart(2, "0")}`;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    approved: {
      label: "Disetujui",
      className: "booking-status--approved",
    },
    pending_approval: {
      label: "Menunggu",
      className: "booking-status--pending",
    },
    rejected: {
      label: "Ditolak",
      className: "booking-status--rejected",
    },
  };

  const c = config[status] || config.approved;

  return <span className={`booking-status ${c.className}`}>{c.label}</span>;
}

export default function BookingList({
  bookings,
  showActions = false,
  onApprove,
  onReject,
  onCancel,
}: BookingListProps) {
  if (!bookings.length) return null;

  return (
    <div className="booking-list">
      {bookings.map((booking, idx) => (
        <div key={booking._id} className="booking-item">
          <div className="booking-item__header">
            <span className="booking-item__position">#{booking.queuePosition}</span>
            <StatusBadge status={booking.status} />
          </div>
          <p className="booking-item__purpose">{booking.bookedFor}</p>
          <div className="booking-item__meta">
            <span className="booking-item__user">👤 {booking.bookedBy}</span>
            <span className="booking-item__time">
              🕐 {formatTime(booking.bookingStart)} - {formatTime(booking.bookingEnd)}
            </span>
          </div>
          {showActions && (
            <div className="booking-item__actions">
              {booking.status === "pending_approval" && onApprove && onReject && (
                <>
                  <button
                    type="button"
                    onClick={() => onApprove(booking._id)}
                    className="btn-approve"
                  >
                    ✓ Setujui
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(booking._id)}
                    className="btn-reject"
                  >
                    ✕ Tolak
                  </button>
                </>
              )}
              {onCancel && booking.status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => onCancel(booking._id)}
                  className="btn-cancel"
                >
                  Batalkan
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
