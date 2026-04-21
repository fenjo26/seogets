import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// Ensure admin user exists in database
async function ensureAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return null;

  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
      },
    });
  }
  return admin;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    // ─── 1. Local Master Account ──────────────────────────────────────────
    CredentialsProvider({
      name: "Local Account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) return null;

        // Simple plaintext check (the password is stored in .env, not DB)
        if (credentials.email !== adminEmail) return null;

        // Support both plain password and bcrypt hash in ADMIN_PASSWORD
        const isValid =
          credentials.password === adminPassword ||
          (adminPassword.startsWith("$2") &&
            (await bcrypt.compare(credentials.password, adminPassword)));

        if (!isValid) return null;

        const admin = await ensureAdminUser();
        if (!admin) return null;

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          image: admin.image,
        };
      },
    }),

    // ─── 2. Google (for linking additional GSC accounts) ──────────────────
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
          authorization: {
            params: {
              scope:
                "openid email profile https://www.googleapis.com/auth/webmasters.readonly",
              prompt: "consent",
              access_type: "offline",
              response_type: "code",
            },
          },
        })]
      : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // When a Google account is linked, always tie it to the admin user
      if (account?.provider === "google") {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) return false;

        const admin = await ensureAdminUser();
        if (!admin) return false;

        // Link Google account to admin user if not already linked
        const existing = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!existing) {
          await prisma.account.create({
            data: {
              userId: admin.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });
        } else if (account.access_token) {
          // Refresh tokens
          await prisma.account.update({
            where: { id: existing.id },
            data: {
              access_token: account.access_token,
              refresh_token: account.refresh_token ?? existing.refresh_token,
              expires_at: account.expires_at,
            },
          });
        }

        // Force sign-in as admin, not as the Google user
        user.id = admin.id;
        user.email = admin.email!;
        user.name = admin.name;
      }
      return true;
    },

    async session({ session, token }) {
      if (session?.user && token?.sub) {
        // @ts-ignore
        session.user.id = token.sub;
      }
      return session;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
};
