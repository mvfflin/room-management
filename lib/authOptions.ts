import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { users } from "@/data/dummy";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Akun",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: (credentials) => {
        if (!credentials?.username || !credentials?.password) return null;
        const user = users.find(
          (u) =>
            u.username === credentials.username &&
            u.password === credentials.password,
        );
        if (!user) return null;
        return {
          id: user.username,
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
