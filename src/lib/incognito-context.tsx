"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const INCOGNITO_STORAGE_KEY = "orchids-incognito";

interface IncognitoContextType {
  /** Whether incognito mode is currently active */
  isIncognito: boolean;
  /** Toggle incognito mode on/off */
  setIncognito: (value: boolean) => void;
  /** Toggle incognito mode (shortcut) */
  toggleIncognito: () => void;
}

const IncognitoContext = createContext<IncognitoContextType | undefined>(undefined);

export function IncognitoProvider({ children }: { children: ReactNode }) {
  const [isIncognito, setIsIncognito] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(INCOGNITO_STORAGE_KEY);
      if (stored === "true") {
        setIsIncognito(true);
      }
    } catch {}
    setMounted(true);
  }, []);

  const setIncognito = useCallback((value: boolean) => {
    setIsIncognito(value);
    try {
      if (value) {
        localStorage.setItem(INCOGNITO_STORAGE_KEY, "true");
      } else {
        localStorage.removeItem(INCOGNITO_STORAGE_KEY);
      }
    } catch {}
  }, []);

  const toggleIncognito = useCallback(() => {
    setIncognito(!isIncognito);
  }, [isIncognito, setIncognito]);

  // Don't render children until mounted (avoid hydration mismatch)
  if (!mounted) {
    return null;
  }

  return (
    <IncognitoContext.Provider value={{ isIncognito, setIncognito, toggleIncognito }}>
      {children}
    </IncognitoContext.Provider>
  );
}

/**
 * Hook to access incognito mode state.
 * Returns true if incognito mode is active.
 */
export function useIncognito(): IncognitoContextType {
  const context = useContext(IncognitoContext);
  if (context === undefined) {
    // Safe fallback if used outside provider
    return { isIncognito: false, setIncognito: () => {}, toggleIncognito: () => {} };
  }
  return context;
}
