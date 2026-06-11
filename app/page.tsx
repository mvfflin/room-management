import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-200/40 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-200/30 via-transparent to-transparent" />

      <div className="relative">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center space-y-6">
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-indigo-100 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-600">
                Sistem Manajemen Ruangan
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight gradient-text animate-fade-in-up">
              Room Management
            </h1>

            <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-500 leading-relaxed animate-fade-in-up stagger-1">
              Platform booking ruangan yang modern, cepat, dan terorganisir.
              Kelola ketersediaan ruangan dengan mudah untuk mendukung kegiatan
              belajar, mengajar, dan berdiskusi.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-2">
              <Link
                href="/rooms"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:opacity-90 active:scale-95"
              >
                Lihat Ruangan
              </Link>
              {/* <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-md border border-zinc-200 px-8 py-3.5 text-sm font-semibold text-zinc-700 shadow-lg transition hover:bg-white active:scale-95"
              >
                Masuk
              </Link> */}
            </div>
          </div>
        </section>

        {/* <section className="border-t border-indigo-100/60 bg-white/50 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900">
                Mengapa memilih kami?
              </h2>
              <p className="mt-3 text-zinc-500">
                Kemudahan dan efisiensi dalam satu platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Real-time Status",
                  description:
                    "Pantau ketersediaan ruangan secara langsung tanpa perlu konfirmasi manual.",
                  icon: "⚡",
                },
                {
                  title: "Mudah Digunakan",
                  description:
                    "Antarmuka intuitif yang ramah pengguna untuk proses booking yang cepat.",
                  icon: "🎯",
                },
                {
                  title: "Terstruktur",
                  description:
                    "Data tersimpan rapi dan mudah diakses kapan saja oleh admin dan user.",
                  icon: "📊",
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className={`animate-slide-in-scale stagger-${index + 1} group relative rounded-2xl bg-white/80 backdrop-blur-xl border border-zinc-200/60 p-7 shadow-xl card-hover`}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-bold text-zinc-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        <footer className="border-t border-zinc-200/60 bg-white/70 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-zinc-400">
            <p>
              © {new Date().getFullYear()} Room Management. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
