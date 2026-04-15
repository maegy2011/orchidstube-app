"use client";

import { useState, useCallback, Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Chrome,
  Apple,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useI18n } from "@/lib/i18n-context";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { t } = useI18n();

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const errorParam = searchParams.get("error");

  // Redirect if already signed in (in useEffect to avoid setState-during-render)
  useEffect(() => {
    if (session) {
      router.push(callbackUrl);
    }
  }, [session, callbackUrl, router]);

  const getErrorMessage = useCallback(
    (errorCode: string | null) => {
      if (!errorCode) return null;
      switch (errorCode) {
        case "CredentialsSignin":
          return t("authErrorInvalid");
        case "OAuthAccountNotLinked":
          return t("authErrorLinked");
        case "SessionRequired":
          return t("authErrorSession");
        case "Default":
          return t("authErrorDefault");
        default:
          return t("authErrorFailed");
      }
    },
    [t]
  );

  const errorMessage = getErrorMessage(errorParam);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        toast.error(getErrorMessage(result.error) || t("authErrorInvalid"));
      } else if (result?.url) {
        router.push(result.url);
        router.refresh();
      }
    } catch {
      toast.error(t("authSomethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: string) => {
    setSocialLoading(provider);
    try {
      await signIn(provider, { callbackUrl, redirect: true });
    } catch {
      toast.error(t("authErrorProvider").replace("{provider}", provider));
      setSocialLoading(null);
    }
  };

  return (
    <AuthLayout
      title={t("authWelcomeBack")}
      description={t("authWelcomeBackDesc")}
    >
      {/* Error Display */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive text-center mb-5">
              {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Login Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="space-y-3"
      >
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="rounded-xl h-11 gap-2 text-sm font-medium hover:bg-accent/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => handleSocialSignIn("google")}
            disabled={!!socialLoading}
          >
            {socialLoading === "google" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Chrome className="size-4" />
            )}
            <span className="hidden sm:inline">Google</span>
          </Button>

          <Button
            variant="outline"
            className="rounded-xl h-11 gap-2 text-sm font-medium hover:bg-accent/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => handleSocialSignIn("azure-ad")}
            disabled={!!socialLoading}
          >
            {socialLoading === "azure-ad" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg className="size-4" viewBox="0 0 23 23">
                <path fill="#F35325" d="M1 1h10v10H1z" />
                <path fill="#81BC06" d="M12 1h10v10H12z" />
                <path fill="#05A6F0" d="M1 12h10v10H1z" />
                <path fill="#FFBA08" d="M12 12h10v10H12z" />
              </svg>
            )}
            <span className="hidden sm:inline">Microsoft</span>
          </Button>

          <Button
            variant="outline"
            className="rounded-xl h-11 gap-2 text-sm font-medium hover:bg-accent/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => handleSocialSignIn("apple")}
            disabled={!!socialLoading}
          >
            {socialLoading === "apple" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Apple className="size-4" />
            )}
            <span className="hidden sm:inline">Apple</span>
          </Button>
        </div>
      </motion.div>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">
            {t("authOrContinueWithEmail")}
          </span>
        </div>
      </div>

      {/* Email & Password Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            {t("authEmailAddress")}
          </Label>
          <div className="relative group">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-red-600 transition-colors duration-200" />
            <Input
              id="email"
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

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              {t("authPassword")}
            </Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors duration-200 hover:underline"
            >
              {t("authForgotPassword")}
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-red-600 transition-colors duration-200" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("authEnterPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 ps-10 pe-10 rounded-xl bg-background/50 border-border/50 focus-visible:border-red-600 focus-visible:ring-red-600/20 transition-all duration-200"
              required
              autoComplete="current-password"
              disabled={isLoading}
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
        </div>

        {/* Sign In Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] mt-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("authSigningIn")}
            </>
          ) : (
            t("signIn")
          )}
        </Button>
      </motion.form>
    </AuthLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-red-600" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
