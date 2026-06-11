"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getRoomStatus } from "@/lib/roomStatus";

export function HomeRoomsGrid() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("/api/rooms");
        if (!res.ok) return;
        const data = await res.json();
        setRooms(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 w-full max-w-5xl mx-auto px-4 animate-fade-in-up stagger-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {rooms.map((room) => {
          const status = getRoomStatus(room);
          return (
            <Link
              key={room._id}
              href={`/rooms/${room._id}`}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg active:scale-95 ${status.bgClass} ${status.borderClass}`}
            >
              <span className={`text-sm md:text-base font-bold text-center mb-1 ${status.textClass}`}>
                {room.name}
              </span>
              <span className={`text-[10px] md:text-xs uppercase font-semibold tracking-wider ${status.textClass} opacity-80 text-center`}>
                {status.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
