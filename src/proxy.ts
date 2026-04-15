import { withAuth } from "next-auth/middleware";

// Use the same secret resolution as authOptions to prevent mismatches
const authSecret = process.env.NEXTAUTH_SECRET
  || (process.env.NODE_ENV === "development"
    ? "dev-only-insecure-key-do-not-use-in-production"
    : undefined);

if (!authSecret) {
  console.error("[Middleware] NEXTAUTH_SECRET is not set and no dev fallback is available.");
}

export default withAuth({
  secret: authSecret,
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: [
    "/favorites/:path*",
    "/notes/:path*",
    "/subscriptions/:path*",
    "/history/:path*",
    "/watch-later/:path*",
  ],
};
