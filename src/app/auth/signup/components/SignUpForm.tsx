"use client";

import { useState, useMemo, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  Check,
  X,
  Chrome,
  Apple,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useI18n } from "@/lib/i18n-context";
import {
  PasswordStrengthIndicator,
  getPasswordStrength,
} from "./PasswordStrength";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { t } = useI18n();

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Redirect if already signed in (in useEffect to avoid setState-during-render)
  useEffect(() => {
    if (session) {
      router.push(callbackUrl);
    }
  }, [session, callbackUrl, router]);

  const passwordStrength = useMemo(
    () => (password ? getPasswordStrength(password, t) : null),
    [password, t]
  );

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (name && name.trim().length < 2) {
      errors.name = t("authNameMin2");
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t("authValidEmail");
    }

    if (password) {
      if (password.length < 6) {
        errors.password = t("authPasswordMin6");
      }
    }

    if (confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = t("authPasswordsNoMatch");
    }

    return errors;
  }, [name, email, password, confirmPassword, t]);

  const isValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 6 &&
    password === confirmPassword &&
    Object.keys(validationErrors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      if (password !== confirmPassword) {
        toast.error(t("authPasswordsNoMatch"));
      } else if (password.length < 6) {
        toast.error(t("authPasswordMin6"));
      } else {
        toast.error(t("authFillAllFields"));
      }
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t("authRegisterFailed"));
        setIsLoading(false);
        return;
      }

      toast.success(t("authAccountCreated"));

      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        toast.error(t("authAccountCreatedFailed"));
        router.push(
          `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
        );
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
      title={t("authCreateAccountTitle")}
      description={t("authCreateAccountDesc")}
    >
      {/* Social Login Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
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
            {t("authOrSignUpWithEmail")}
          </span>
        </div>
      </div>

      {/* Registration Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Name Field */}
        <div className="space-y-1.5">
          <Label
            htmlFor="name"
            className="text-sm font-medium text-foreground"
          >
            {t("authFullName")}
          </Label>
          <div className="relative group">
            <User className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-red-600 transition-colors duration-200" />
            <Input
              id="name"
              type="text"
              placeholder={t("authPlaceholderName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              className="h-11 ps-10 pe-10 rounded-xl bg-background/50 border-border/50 focus-visible:border-red-600 focus-visible:ring-red-600/20 transition-all duration-200"
              required
              autoComplete="name"
              disabled={isLoading}
              aria-invalid={!!validationErrors.name}
            />
            <AnimatePresence>
              {name.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute end-3 top-1/2 -translate-y-1/2"
                >
                  {name.trim().length >= 2 ? (
                    <Check className="size-4 text-emerald-500" />
                  ) : (
                    <X className="size-4 text-red-500" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {validationErrors.name && focusedField === "name" && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {validationErrors.name}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <Label
            htmlFor="signup-email"
            className="text-sm font-medium text-foreground"
          >
            {t("authEmailAddress")}
          </Label>
          <div className="relative group">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-red-600 transition-colors duration-200" />
            <Input
              id="signup-email"
              type="email"
              placeholder={t("authPlaceholderEmail")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className="h-11 ps-10 pe-10 rounded-xl bg-background/50 border-border/50 focus-visible:border-red-600 focus-visible:ring-red-600/20 transition-all duration-200"
              required
              autoComplete="email"
              disabled={isLoading}
              aria-invalid={!!validationErrors.email}
            />
            <AnimatePresence>
              {email.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute end-3 top-1/2 -translate-y-1/2"
                >
                  {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? (
                    <Check className="size-4 text-emerald-500" />
                  ) : (
                    <X className="size-4 text-red-500" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {validationErrors.email && focusedField === "email" && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {validationErrors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <Label
            htmlFor="signup-password"
            className="text-sm font-medium text-foreground"
          >
            {t("authPassword")}
          </Label>
          <div className="relative group">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-red-600 transition-colors duration-200" />
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder={t("authAtLeast6Chars")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              className="h-11 ps-10 pe-10 rounded-xl bg-background/50 border-border/50 focus-visible:border-red-600 focus-visible:ring-red-600/20 transition-all duration-200"
              required
              autoComplete="new-password"
              disabled={isLoading}
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

          {/* Password Strength Indicator */}
          {password.length > 0 && passwordStrength && (
            <PasswordStrengthIndicator passwordStrength={passwordStrength} />
          )}
          <AnimatePresence>
            {validationErrors.password && focusedField === "password" && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {validationErrors.password}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1.5">
          <Label
            htmlFor="confirm-password"
            className="text-sm font-medium text-foreground"
          >
            {t("authConfirmPassword")}
          </Label>
          <div className="relative group">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-red-600 transition-colors duration-200" />
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("authReEnterPassword")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField(null)}
              className="h-11 ps-10 pe-10 rounded-xl bg-background/50 border-border/50 focus-visible:border-red-600 focus-visible:ring-red-600/20 transition-all duration-200"
              required
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={!!validationErrors.confirmPassword}
            />
            <AnimatePresence>
              {confirmPassword.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute end-3 top-1/2 -translate-y-1/2"
                >
                  {password === confirmPassword ? (
                    <Check className="size-4 text-emerald-500" />
                  ) : (
                    <X className="size-4 text-red-500" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {confirmPassword.length > 0 && (
              <button
                type="button"
                className="absolute end-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={
                  showConfirmPassword
                    ? t("authHideConfirmPassword")
                    : t("authShowConfirmPassword")
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            )}
          </div>
          <AnimatePresence>
            {validationErrors.confirmPassword &&
              focusedField === "confirmPassword" && (
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

        {/* Create Account Button */}
        <Button
          type="submit"
          disabled={isLoading || !isValid}
          className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-red-600 disabled:hover:shadow-red-600/20 mt-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("authCreatingAccount")}
            </>
          ) : (
            t("authCreateAccountBtn")
          )}
        </Button>
      </motion.form>
    </AuthLayout>
  );
}
