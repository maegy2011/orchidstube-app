"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Mail,
  Loader2,
  ArrowLeft,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useI18n } from "@/lib/i18n-context";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("authValidEmail"));
      return;
    }

    setIsLoading(true);
    setResetUrl(null);
    setEmailSent(false);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t("authSomethingWentWrong"));
        setIsLoading(false);
        return;
      }

      setEmailSent(true);
      toast.success(t("authResetLinkSent"));

      // In dev mode, show the reset URL
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch {
      toast.error(t("authSomethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const copyResetLink = async () => {
    if (!resetUrl) return;
    try {
      await navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      toast.success(t("textCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("authSomethingWentWrong"));
    }
  };

  return (
    <AuthLayout
      title={t("authForgotPasswordTitle")}
      description={t("authForgotPasswordDesc")}
    >
      <AnimatePresence mode="wait">
        {!emailSent ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
                {t("authEmailAddress")}
              </Label>
              <div className="relative group">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-red-600 transition-colors duration-200" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder={t("authPlaceholderEmail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 ps-10 rounded-xl bg-background/50 border-border/50 focus-visible:border-red-600 focus-visible:ring-red-600/20 transition-all duration-200"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("authSendingResetLink")}
                </>
              ) : (
                <>
                  <KeyRound className="size-4" />
                  {t("authSendResetLink")}
                </>
              )}
            </Button>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Success Message */}
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                <KeyRound className="size-5 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {t("authResetLinkSent")}
              </p>
            </div>

            {/* Dev Mode: Show Reset Link */}
            {resetUrl && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {t("authDevResetNote")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("authResetLinkSentDesc")}
                  </p>

                  {/* Reset Link Box */}
                  <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground">
                      {t("authResetLinkLabel")}:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted/50 rounded-md px-2.5 py-1.5 text-muted-foreground overflow-hidden text-ellipsis">
                        {resetUrl}
                      </code>
                      <button
                        onClick={copyResetLink}
                        className="shrink-0 p-1.5 rounded-md hover:bg-muted/80 transition-colors"
                        title={t("textCopied")}
                      >
                        {copied ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : (
                          <Copy className="size-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <Link href={resetUrl}>
                      <Button
                        size="sm"
                        className="w-full rounded-lg text-xs gap-1.5"
                      >
                        <ExternalLink className="size-3.5" />
                        {t("authGoToSignIn")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Back to Sign In */}
            <div className="pt-2">
              <Link href="/auth/signin">
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-10 gap-2 text-sm"
                >
                  <ArrowLeft className="size-4 rtl:rotate-180" />
                  {t("authBackToSignIn")}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-red-600" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
