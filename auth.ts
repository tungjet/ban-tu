import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        await connectDB();
        const user = await User.findOne({
          email: String(creds.email).toLowerCase().trim(),
        }).lean();
        if (!user) return null;
        const valid = await bcrypt.compare(String(creds.password), user.passwordHash);
        if (!valid) return null;
        if (user.status === "banned") return null;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.fullName ?? undefined,
          role: user.role as "admin" | "collaborator" | "customer",
          status: user.status as "pending" | "active" | "banned",
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/dang-nhap" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.status = (user as any).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
      }
      return session;
    },
  },
});
