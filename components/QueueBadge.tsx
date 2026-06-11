"use client";

type QueueBadgeProps = {
  queueCount: number;
  maxQueue?: number;
  isClosed?: boolean;
};

export default function QueueBadge({
  queueCount,
  maxQueue = 3,
  isClosed = false,
}: QueueBadgeProps) {
  if (isClosed) {
    return (
      <div className="queue-badge queue-badge--closed">
        <span className="queue-dot queue-dot--slate" />
        <span>🔒 Ditutup</span>
      </div>
    );
  }

  if (queueCount === 0) {
    return (
      <div className="queue-badge queue-badge--available">
        <span className="queue-dot queue-dot--green" />
        <span>Tersedia</span>
      </div>
    );
  }

  if (queueCount >= maxQueue) {
    return (
      <div className="queue-badge queue-badge--full">
        <span className="queue-dot queue-dot--red" />
        <span>
          {queueCount}/{maxQueue} Penuh
        </span>
      </div>
    );
  }

  return (
    <div className="queue-badge queue-badge--queued">
      <span className="queue-dot queue-dot--yellow" />
      <span>
        {queueCount}/{maxQueue} Antrean
      </span>
    </div>
  );
}
