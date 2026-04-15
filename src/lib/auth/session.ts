import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { NextResponse } from "next/server";

/**
 * Authenticate the current request using NextAuth session.
 * Returns the session user object if authenticated, or null.
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: (session.user as any).id,
    email: session.user.email,
    name: session.user.name,
  };
}

/**
 * Require authentication — returns user data or a 401 response.
 * Use at the top of API route handlers.
 *
 * @example
 *   const user = await requireAuth();
 *   if (!user) return; // 401 already sent
 *   const userId = user.id;
 */
export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null; // Signals auth passed — caller should use getSessionUser()
}

/**
 * Guard: returns user data if authenticated, or null with a pre-built 401 response.
 * Preferred pattern for API routes.
 */
export async function authenticateRequest(): Promise<
  | { user: { id: string; email?: string | null; name?: string | null }; error: null }
  | { user: null; error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return {
    user: {
      id: (session.user as any).id,
      email: session.user.email,
      name: session.user.name,
    },
    error: null,
  };
}
