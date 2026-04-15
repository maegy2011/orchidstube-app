"use client";

import { create } from "zustand";

// ═══════════════════════════════════════════════════════
// Global Sidebar Store
// ═══════════════════════════════════════════════════════
// Persists sidebar open/close state across page navigations.
// Each page no longer needs its own local sidebarOpen state.
// ═══════════════════════════════════════════════════════

interface SidebarState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((prev) => ({ isOpen: !prev.isOpen })),
}));
