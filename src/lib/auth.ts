import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { and, desc, eq, ne } from "drizzle-orm";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "./db/client";
import * as schema from "./db/schema";
import { isEmailPasswordAuthEnabled } from "./email-password-auth";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: isEmailPasswordAuthEnabled(),
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  session: {
    // Stay signed in for 30 days, counted from the last visit. The expiry is pushed forward at most once a day.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    session: {
      create: {
        // One device at a time: a new sign-in removes all of the user's other sessions.
        // Each session is checked against the database on every request, so the old device is
        // signed out on its next request. The newest session (createdAt, then id) is the one kept,
        // so sign-ins at the same moment all agree on one winner.
        after: async (newSession) => {
          const [newest] = await db
            .select({ id: schema.session.id })
            .from(schema.session)
            .where(eq(schema.session.userId, newSession.userId))
            .orderBy(desc(schema.session.createdAt), desc(schema.session.id))
            .limit(1);
          if (!newest) return;

          await db
            .delete(schema.session)
            .where(and(
              eq(schema.session.userId, newSession.userId),
              ne(schema.session.id, newest.id),
            ));
        },
      },
    },
  },
  plugins: [
    tanstackStartCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
