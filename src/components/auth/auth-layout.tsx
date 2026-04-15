"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Menu, LogIn, UserPlus } from "lucide-react";
import { OrchidIcon } from "@/components/ui/orchid-icon";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isSignIn = pathname === "/auth/signin";
  const isAuthPage = pathname === "/auth/signin" || pathname === "/auth/signup";
  const isResetFlow = pathname === "/auth/forgot-password" || pathname === "/auth/reset-password";
  const { t, direction } = useI18n();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={direction}>
      {/* ─── Auth Masthead ─── */}
      <header className="sticky top-0 z-[8000] flex items-center justify-between h-[56px] px-4 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-xl border-b border-border/50 select-none">
        {/* Left: Back + Menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-full hover:bg-muted/80 transition-all active:scale-95"
            aria-label={t("back_to_home")}
          >
            <ArrowLeft
              size={20}
              className="text-foreground rtl:rotate-180"
            />
          </button>
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-full hover:bg-muted/80 transition-all active:scale-95"
            aria-label={t("settingsNav")}
          >
            <Menu size={20} className="text-foreground" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center group px-1">
            <div className="relative flex items-center justify-center w-10 h-10">
              <OrchidIcon className="relative w-10 h-10 text-red-600 transition-all drop-shadow-lg group-hover:scale-105" />
            </div>
            <span className="text-lg font-bold tracking-tight ms-0 hidden sm:inline-block text-foreground">
              {t("appName")}
            </span>
          </Link>
        </div>

        {/* Right: Auth Toggle (hidden on forgot/reset pages) */}
        {isAuthPage && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted/60 rounded-full p-1 gap-0.5">
              <Link
                href="/auth/signin"
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  isSignIn
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">{t("signIn")}</span>
              </Link>
              <Link
                href="/auth/signup"
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  !isSignIn
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UserPlus size={14} />
                <span className="hidden sm:inline">{t("signUp")}</span>
              </Link>
            </div>
          </div>
        )}
        {isResetFlow && (
          <Link
            href="/auth/signin"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <LogIn size={14} />
            <span className="hidden sm:inline">{t("signIn")}</span>
          </Link>
        )}
      </header>

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px]"
        >
          {/* Card Container */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-lg overflow-hidden">
            {/* Card Header - Colored accent */}
            <div className="px-6 pt-8 pb-6 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div className="mx-auto w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center mb-4">
                  <OrchidIcon className="w-12 h-12 text-red-600" />
                </div>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-2xl font-bold tracking-tight text-foreground"
              >
                {title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-sm text-muted-foreground mt-1.5"
              >
                {description}
              </motion.p>
            </div>

            {/* Card Body - Form content */}
            <div className="px-6 pb-6">{children}</div>
          </div>
        </motion.div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-[440px] mx-auto px-6 py-5">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground/70">
            <span>{t("byContinuingAgree")}</span>
            <button
              className="hover:text-foreground underline underline-offset-2 transition-colors"
              onClick={() => {}}
            >
              {t("termsOfService")}
            </button>
            <span>&</span>
            <button
              className="hover:text-foreground underline underline-offset-2 transition-colors"
              onClick={() => {}}
            >
              {t("privacyPolicy")}
            </button>
          </div>
          <div className="flex items-center justify-center mt-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home size={12} />
              <span>{t("back_to_home")}</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
