"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type UserItem = {
  _id: string;
  username: string;
  role: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("siswa");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !role) return;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotification({ type: "error", message: data.message || "Gagal membuat user" });
        return;
      }

      setNotification({ type: "success", message: "User berhasil dibuat!" });
      setUsername("");
      setPassword("");
      setRole("siswa");
      fetchUsers();
    } catch (err) {
      setNotification({ type: "error", message: "Terjadi kesalahan sistem" });
    }
  };

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-zinc-900">Akses Ditolak</h1>
          <p className="mt-2 text-zinc-500">Anda tidak memiliki hak akses ke halaman ini.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-b border-indigo-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200/40 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight gradient-text animate-fade-in-up">
            Manajemen User
          </h1>
          <p className="mt-4 text-lg text-zinc-500 animate-fade-in-up stagger-1">
            Kelola akses dan tambahkan pengguna baru
          </p>
        </div>
      </div>

      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`notification notification--${notification.type} animate-fade-in-up`}>
            <span>{notification.type === "success" ? "✅" : "❌"}</span>
            <p>{notification.message}</p>
            <button type="button" onClick={() => setNotification(null)} className="ml-auto text-current opacity-60 hover:opacity-100 transition">✕</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Create User */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-200/60 shadow-2xl shadow-indigo-100/50 p-6">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Tambah User Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Masukkan username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Masukkan password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option value="siswa">Siswa</option>
                  <option value="ketua_ekskul">Ketua Ekskul</option>
                  <option value="guru">Guru</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-90 active:scale-95 mt-4"
              >
                Buat User
              </button>
            </form>
          </div>
        </div>

        {/* List Users */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-200/60 shadow-2xl shadow-indigo-100/50 overflow-hidden h-full">
            <div className="p-6 border-b border-zinc-200/60 bg-zinc-50/50">
              <h3 className="text-lg font-bold text-zinc-800">Daftar Pengguna</h3>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-indigo-600 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">Belum ada data pengguna.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 text-sm text-zinc-500 border-b border-zinc-200/60">
                      <th className="px-6 py-4 font-semibold">Username</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Tanggal Dibuat</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-zinc-700 divide-y divide-zinc-200/60">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-900">{user.username}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'guru' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'ketua_ekskul' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-500">
                          {new Date(user.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
