"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, Settings, Loader2, LogIn, EyeOff, Eye } from "lucide-react";
import { IncognitoMaskIcon } from "@/components/icons/incognito-mask";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { useIncognito } from "@/lib/incognito-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  const { isIncognito, toggleIncognito } = useIncognito();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch {
      setIsSigningOut(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition-all shadow-md shadow-red-600/20"
      >
        <LogIn size={16} />
        <span className="hidden sm:inline">{t('signIn')}</span>
      </Link>
    );
  }

  const userInitial = session.user.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted/80 transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="User menu"
        >
          {session.user.image ? (
            <div className="relative">
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-background shadow-md"
              />
              {isIncognito && (
                <div className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center ring-2 ring-background shadow-md">
                  <IncognitoMaskIcon className="w-3.5 h-3.5 text-white" style={{ '--mask-bg': '#d97706' } as React.CSSProperties} />
                </div>
              )}
            </div>
          ) : (
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-background shadow-md relative",
              isIncognito
                ? "bg-gradient-to-br from-amber-500 to-amber-700"
                : "bg-gradient-to-br from-red-500 to-red-700"
            )}>
              {userInitial}
              {isIncognito && (
                <div className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center ring-2 ring-background shadow-md">
                  <IncognitoMaskIcon className="w-3.5 h-3.5 text-amber-900" style={{ '--mask-bg': '#b45309' } as React.CSSProperties} />
                </div>
              )}
            </div>
          )}
          <span className="hidden lg:block max-w-[120px] truncate text-sm font-medium text-foreground">
            {session.user.name || session.user.email}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-2xl bg-card border border-border shadow-xl shadow-black/10 p-0 overflow-hidden z-[9999]"
      >
        {/* User Info */}
        <DropdownMenuLabel className="px-4 py-3 font-normal">
          <div className="flex items-center gap-3">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-10 h-10 rounded-full object-cover ring-2 ring-background"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold ring-2 ring-background">
                {userInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Incognito Mode Toggle */}
        <DropdownMenuItem
          className={cn(
            "gap-3 px-4 py-2.5 text-sm cursor-pointer rounded-lg mx-1 my-0.5 transition-colors",
            isIncognito
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "text-foreground"
          )}
          onSelect={toggleIncognito}
        >
          {isIncognito ? (
            <IncognitoMaskIcon className="w-4 h-4 text-amber-500" style={{ '--mask-bg': '#fbbf24' } as React.CSSProperties} />
          ) : (
            <Eye size={16} className="text-muted-foreground" />
          )}
          <span>{isIncognito ? t('incognitoTurnOff') : t('incognitoTurnOn')}</span>
          <div className={cn(
            "ms-auto w-8 h-[18px] rounded-full relative transition-colors",
            isIncognito ? "bg-amber-500" : "bg-muted"
          )}>
            <div className={cn(
              "absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-all",
              isIncognito ? "inset-inline-start-[16px]" : "inset-inline-start-[2px]"
            )} />
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Settings */}
        <DropdownMenuItem
          className="gap-3 px-4 py-2.5 text-sm cursor-pointer rounded-lg mx-1 my-0.5"
          onSelect={() => router.push("/settings")}
        >
          <Settings size={16} className="text-muted-foreground" />
          <span>{t('settingsNav')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          variant="destructive"
          className="gap-3 px-4 py-2.5 text-sm cursor-pointer rounded-lg mx-1 my-0.5"
          disabled={isSigningOut}
          onSelect={handleSignOut}
        >
          {isSigningOut ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <LogOut size={16} />
          )}
          <span>{t('signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
