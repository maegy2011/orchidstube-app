"use client";

import { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useI18n } from "@/lib/i18n-context";
import {
  PasswordStrengthIndicator,
  getPasswordStrength,
} from "@/app/auth/signup/components/PasswordStrength";

type ResetStatus = "form" | "loading" | "success" | "error";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<ResetStatus>("form");
  const [errorMessage, setErrorMessage] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Validate token exists on mount
  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setErrorMessage(t("authResetLinkExpired"));
    }
  }, [token, email, t]);

  const passwordStrength = useMemo(
    () => (password ? getPasswordStrength(password, t) : null),
    [password, t]
  );

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (password && password.length < 6) {
      errors.password = t("authPasswordMin6");
    }
    if (confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = t("authPasswordsNoMatch");
    }
    return errors;
  }, [password, confirmPassword, t]);

  const isValid =
    password.length >= 6 &&
    password === confirmPassword &&
    Object.keys(validationErrors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !token || !email) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || t("authResetPasswordFailed"));
        return;
      }

      setStatus("success");
      toast.success(t("authPasswordChanged"));
    } catch {
      setStatus("error");
      setErrorMessage(t("authSomethingWentWrong"));
    }
  };

  // Error state: expired/invalid link
  if (status === "error") {
    return (
      <AuthLayout
        title={t("authResetLinkExpired")}
        description={t("authResetLinkExpiredDesc")}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center mb-3">
              <AlertCircle className="size-5 text-destructive" />
            </div>
            <p className="text-sm text-destructive font-medium">
              {errorMessage}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/auth/forgot-password">
              <Button
                variant="outline"
                className="w-full rounded-xl h-10 gap-2 text-sm"
              >
                <KeyRound className="size-4" />
                {t("authRequestNewLink")}
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button
                variant="ghost"
                className="w-full rounded-xl h-10 gap-2 text-sm"
              >
                <ArrowLeft className="size-4 rtl:rotate-180" />
                {t("authBackToSignIn")}
              </Button>
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <AuthLayout
        title={t("authPasswordResetSuccess")}
        description={t("authPasswordResetSuccessDesc")}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3"
            >
              <CheckCircle2 className="size-7 text-emerald-600" />
            </motion.div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {t("authPasswordResetSuccess")}
            </p>
          </div>

          <Link href="/auth/signin">
            <Button
              className="w-full rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-lg shadow-red-600/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] gap-2"
            >
              {t("authGoToSignIn")}
            </Button>
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  // Form state
  return (
    <AuthLayout
      title={t("authResetPasswordTitle")}
      description={t("authResetPasswordDesc")}
    >
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
            {t("authNewPassword")}
          </Label>
          <div className="relative group">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-red-600 transition-colors duration-200" />
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder={t("authAtLeast6Chars")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 ps-10 pe-10 rounded-xl bg-background/50 border-border/50 focus-visible:border-red-600 focus-visible:ring-red-600/20 transition-all duration-200"
              required
              autoComplete="new-password"
              disabled={status === "loading"}
              aria-invalid={!!validationErrors.password}
            />
            <button
              type="button"
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? t("authHidePassword") : t("authShowPassword")}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>

          {/* Password Strength */}
          {password.length > 0 && passwordStrength && (
            <PasswordStrengthIndicator passwordStrength={passwordStrength} />
          )}
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm-new-password" className="text-sm font-medium text-foreground">
            {t("authConfirmNewPassword")}
          </Label>
          <div className="relative group">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-red-600 transition-colors duration-200" />
            <Input
              id="confirm-new-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("authReEnterPassword")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 ps-10 pe-10 rounded-xl bg-background/50 border-border/50 focus-visible:border-red-600 focus-visible:ring-red-600/20 transition-all duration-200"
              required
              autoComplete="new-password"
              disabled={status === "loading"}
              aria-invalid={!!validationErrors.confirmPassword}
            />
            <button
              type="button"
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              aria-label={showConfirmPassword ? t("authHideConfirmPassword") : t("authShowConfirmPassword")}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          <AnimatePresence>
            {validationErrors.confirmPassword && confirmPassword.length > 0 && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {validationErrors.confirmPassword}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={status === "loading" || !isValid}
          className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-red-600 disabled:hover:shadow-red-600/20"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("authResettingPassword")}
            </>
          ) : (
            <>
              <KeyRound className="size-4" />
              {t("authResetPasswordBtn")}
            </>
          )}
        </Button>
      </motion.form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-red-600" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
