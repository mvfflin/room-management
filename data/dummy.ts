export const initialRooms = [
  {
    name: "Kelas X-A",
    booked: false,
  },
  {
    name: "Kelas XI-A",
    booked: true,
    bookedFor: "Keperluan Ekskul Tari",
  },
  {
    name: "Ruang Rapat 1",
    booked: false,
  },
  {
    name: "Lab Komputer",
    booked: true,
    bookedFor: "Ujian Semester",
  },
  {
    name: "AULA",
    booked: false,
  },
  {
    name: "Perpustakaan",
    booked: true,
    bookedFor: "Rapat Guru",
  },
];

export const users = [
  {
    username: "admin",
    password: "admin",
    name: "Admin",
    role: "admin",
  },
  {
    username: "guru",
    password: "guru",
    name: "Guru",
    role: "admin",
  },
  {
    username: "user",
    password: "user",
    name: "User",
    role: "user",
  },
];
