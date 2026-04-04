import type { Adapter } from "next-auth/adapters";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";

function generateId(): string {
  return crypto.randomUUID();
}

export const DrizzleAdapter: Adapter = {
  async createUser(data: any) {
    const id = generateId();
    const now = new Date();
    await db.insert(users).values({
      id,
      name: data.name,
      email: data.email,
      emailVerified: data.emailVerified?.toISOString() ?? null,
      image: data.image,
      password: null,
      createdAt: now,
    });
    return {
      id,
      name: data.name ?? null,
      email: data.email!,
      emailVerified: data.emailVerified ?? null,
      image: data.image ?? null,
    } as any;
  },

  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
      image: user.image,
    } as any;
  },

  async getUserByEmail(email) {
    if (!email) return null;
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
      image: user.image,
    } as any;
  },

  async getUserByAccount({ providerAccountId, provider }) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.providerAccountId, providerAccountId),
          eq(accounts.provider, provider)
        )
      )
      .limit(1);

    if (!account) return null;

    const [user] = await db.select().from(users).where(eq(users.id, account.userId)).limit(1);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
      image: user.image,
    } as any;
  },

  async updateUser(data) {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified instanceof Date ? data.emailVerified.toISOString() : data.emailVerified;
    if (data.image !== undefined) updateData.image = data.image;

    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.id, data.id!));
    }

    const [user] = await db.select().from(users).where(eq(users.id, data.id!)).limit(1);
    if (!user) throw new Error("User not found");
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
      image: user.image,
    } as any;
  },

  async deleteUser(id) {
    await db.delete(users).where(eq(users.id, id));
  },

  async linkAccount(account: any) {
    await db.insert(accounts).values({
      id: generateId(),
      userId: account.userId,
      type: account.type,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      refresh_token: account.refresh_token ?? null,
      access_token: account.access_token ?? null,
      expires_at: account.expires_at ?? null,
      token_type: account.token_type ?? null,
      scope: account.scope ?? null,
      id_token: account.id_token ?? null,
      session_state: account.session_state ?? null,
    });
  },

  async unlinkAccount({ providerAccountId, provider }: any) {
    await db
      .delete(accounts)
      .where(
        and(
          eq(accounts.providerAccountId, providerAccountId),
          eq(accounts.provider, provider)
        )
      );
  },

  async createSession(session) {
    await db.insert(sessions).values({
      id: generateId(),
      sessionToken: session.sessionToken,
      userId: session.userId,
      expires: session.expires,
    });
    return session;
  },

  async getSessionAndUser(sessionToken) {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionToken, sessionToken))
      .limit(1);

    if (!session) return null;

    if (session.expires && new Date(session.expires) < new Date()) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
      return null;
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user) return null;

    return {
      session: {
        id: session.id,
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
        image: user.image,
      } as any,
    };
  },

  async updateSession({ sessionToken, ...data }) {
    const updateData: Record<string, any> = {};
    if (data.expires !== undefined) updateData.expires = data.expires;
    if (data.userId !== undefined) updateData.userId = data.userId;

    if (Object.keys(updateData).length > 0) {
      await db.update(sessions).set(updateData).where(eq(sessions.sessionToken, sessionToken));
    }

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionToken, sessionToken))
      .limit(1);
    return session
      ? { id: session.id, sessionToken: session.sessionToken, userId: session.userId, expires: session.expires }
      : null;
  },

  async deleteSession(sessionToken) {
    await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
  },

  async createVerificationToken(verificationToken) {
    await db.insert(verificationTokens).values({
      identifier: verificationToken.identifier,
      token: verificationToken.token,
      expires: verificationToken.expires,
    });
    return verificationToken;
  },

  async useVerificationToken({ identifier, token }) {
    const [vt] = await db
      .select()
      .from(verificationTokens)
      .where(and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token)))
      .limit(1);

    if (!vt) return null;

    await db
      .delete(verificationTokens)
      .where(and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token)));

    return {
      identifier: vt.identifier,
      token: vt.token,
      expires: vt.expires,
    };
  },
};
