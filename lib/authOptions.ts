import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { users as dummyUsers } from "@/data/dummy";
import connectDB from "@/lib/connectDB";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Akun",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) return null;

        await connectDB();

        // Auto-seeding logic
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          console.log("Seeding dummy users into DB...");
          for (const u of dummyUsers) {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            await User.create({
              username: u.username,
              password: hashedPassword,
              role: u.role === "user" ? "siswa" : u.role
            });
          }
        }

        const user = await User.findOne({ username: credentials.username });
        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) return null;

        return {
          id: user._id.toString(),
          name: user.username,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        (session.user as any).username = token.username;
        (session.user as any).role = token.role;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        (token as any).username = (user as any).username;
        (token as any).role = (user as any).role;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
};
