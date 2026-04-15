"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider
      refetchInterval={5 * 60 * 1000}        // Sync session every 5 min
      refetchOnWindowFocus={true}            // Sync when tab regains focus
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
