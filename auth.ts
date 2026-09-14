import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/prisma";

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            credentials: { email: {}, password: {} },
            authorize: async (credentials) => {
                const email = credentials?.email as string;
                const password = credentials?.password as string;
                if (!email || !password) return null;

                const conseiller = await prisma.conseiller.findUnique({
                    where: { email: email.toLowerCase().trim() },
                });
                if (!conseiller) return null;

                const valid = await bcrypt.compare(password, conseiller.passwordHash);
                if (!valid) return null;

                return {
                    id: conseiller.id,
                    name: conseiller.nom,
                    email: conseiller.email,
                };
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        jwt({ token, user }) {
            if (user) token.id = user.id;
            return token;
        },
        session({ session, token }) {
            if (token.id) session.user.id = token.id as string;
            return session;
        },
    },
});