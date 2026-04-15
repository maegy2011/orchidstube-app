"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function useUser() {
  const { data: session, status } = useSession();
  const [fallbackId, setFallbackId] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "loading" && !session) {
      try {
        let id = localStorage.getItem("app_user_id");
        if (!id) {
          id = generateId();
          localStorage.setItem("app_user_id", id);
        }
        setFallbackId(id);
      } catch {}
    }
  }, [status, session]);

  const userId = session?.user ? (session.user as any).id : fallbackId;

  return {
    userId,
    isAuthenticated: !!session?.user,
    user: session?.user,
    session,
    status,
  };
}
