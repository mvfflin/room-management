"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

export default function CreateRoomsPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isAdmin = (session?.user as any)?.role === "admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: "error", text: "Nama ruangan tidak boleh kosong" });
      return;
    }

    setLoading(true);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res
        .json()
        .catch(() => ({ message: "Gagal menambahkan ruangan" }));
      setMessage({
        type: "error",
        text: data.message || "Gagal menambahkan ruangan",
      });
      return;
    }

    setMessage({
      type: "success",
      text: `Ruangan "${name.trim()}" berhasil ditambahkan`,
    });
    setName("");
  };

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-zinc-900">Akses Ditolak</h1>
          <p className="mt-2 text-zinc-500">
            Anda tidak memiliki hak akses ke halaman ini.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight text-center">
            Tambah Ruangan Baru
          </h1>
          <p className="mt-3 text-center text-zinc-500">
            Masukkan nama ruangan untuk ditambahkan ke sistem.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 bg-white rounded-2xl border border-zinc-200 shadow-xl p-8"
          >
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-zinc-800"
                >
                  Nama Ruangan
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kelas X-B"
                  className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 transition-all"
                />
              </div>

              {message && (
                <p
                  className={`text-sm rounded-lg px-3 py-2 ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-rose-50 text-rose-700 border border-rose-100"
                  }`}
                >
                  {message.text}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-zinc-900 py-3 px-4 text-sm font-semibold text-white shadow-md hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Menyimpan..." : "Tambah Ruangan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
