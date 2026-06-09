import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Silakan definisikan variabel lingkungan MONGODB_URI di dalam file .env.local",
  );
}

/**
 * Global digunakan di sini untuk menjaga koneksi tetap stabil
 * saat proses hot-reloading di development mode Next.js.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Jika koneksi sudah ada, gunakan koneksi yang lama
  if (cached.conn) {
    return cached.conn;
  }

  // Jika belum ada proses koneksi, buat promise baru
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      dbName: "room-management",
    };

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongooseInstance) => {
        console.log("MongoDB Berhasil Terhubung! ✅");
        return mongooseInstance;
      })
      .catch((error) => {
        console.error("Gagal terhubung ke MongoDB: ❌", error);
        cached.promise = null; // Reset promise jika gagal agar bisa dicoba lagi
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
