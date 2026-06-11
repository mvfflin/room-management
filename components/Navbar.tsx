"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = role === "admin";
  const isAdminOrGuru = role === "admin" || role === "guru";

  // Fetch pending approval count for admin badge
  useEffect(() => {
    if (!isAdminOrGuru) return;

    const fetchPending = async () => {
      try {
        const res = await fetch("/api/rooms");
        if (!res.ok) return;
        const rooms = await res.json();
        const count = rooms.reduce(
          (acc: number, r: any) =>
            acc +
            (r.bookings?.filter(
              (b: any) => b.status === "pending_approval",
            ).length || 0),
          0,
        );
        setPendingCount(count);
      } catch {
        // ignore
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [isAdminOrGuru]);

  return (
    <nav className="bg-[#1e1f22] text-gray-200 border-b border-gray-800 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo / Brand */}
          <div className="shrink-0">
            <Link
              href="/"
              className="text-xl md:text-2xl font-bold tracking-wide text-white"
            >
              Room Management
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="nav-link relative px-4 py-2 text-gray-300 hover:text-white transition-colors duration-300"
            >
              Home
            </Link>
            <Link
              href="/rooms"
              className="nav-link relative px-4 py-2 text-gray-300 hover:text-white transition-colors duration-300"
            >
              Rooms
            </Link>

            {isAdminOrGuru && (
              <>
                <Link
                  href="/admin/createrooms"
                  className="nav-link relative px-4 py-2 text-gray-300 hover:text-white transition-colors duration-300"
                >
                  Buat Ruangan
                </Link>
                <Link
                  href="/admin/rooms"
                  className="nav-link relative px-4 py-2 text-gray-300 hover:text-white transition-colors duration-300"
                >
                  Admin Rooms
                </Link>
                <Link
                  href="/admin/approvals"
                  className="nav-link relative px-4 py-2 text-gray-300 hover:text-white transition-colors duration-300"
                >
                  <span className="flex items-center gap-1.5">
                    Approval
                    {pendingCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-[10px] font-bold text-white animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </span>
                </Link>
              </>
            )}

            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse ml-2" />
            ) : session ? (
              <div className="relative ml-2 group">
                <button
                  type="button"
                  className="flex items-center gap-2 px-1 py-1 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-gray-700">
                    {(session.user as any)?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                </button>

                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#2a2b2e] border border-gray-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                  <div className="p-3 border-b border-gray-700">
                    <p className="text-sm font-semibold text-white">
                      {(session.user as any)?.username || session.user?.name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {(session.user as any)?.role || "User"}
                    </p>
                  </div>
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 bg-white text-[#1e1f22] hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="md:hidden bg-[#1a1b1e] border-b border-gray-800"
          id="mobile-menu"
        >
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            <Link
              href="/"
              className="block text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/rooms"
              className="block text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Rooms
            </Link>

            {isAdminOrGuru && (
              <>
                <Link
                  href="/admin/createrooms"
                  className="block text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Buat Ruangan
                </Link>
                <Link
                  href="/admin/rooms"
                  className="block text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Admin Rooms
                </Link>
                <Link
                  href="/admin/approvals"
                  className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Approval
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            <div className="pt-2 px-3">
              {status === "loading" ? (
                <div className="w-full h-10 rounded-lg bg-gray-700 animate-pulse" />
              ) : session ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300 px-1">
                    {(session.user as any)?.username}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="block w-full text-center bg-gray-800 text-white hover:bg-gray-700 px-4 py-2 rounded-lg text-base font-semibold transition-all"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block text-center bg-white text-[#1e1f22] hover:bg-gray-200 px-4 py-2 rounded-lg text-base font-semibold transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
