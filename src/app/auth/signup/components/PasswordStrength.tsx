"use client";

import { motion, AnimatePresence } from "framer-motion";

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  bgColor: string;
}

export function getPasswordStrength(
  password: string,
  t: (key: string) => string
): PasswordStrength {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1)
    return { score, label: t("authPasswordWeak"), color: "text-red-500", bgColor: "bg-red-500" };
  if (score <= 2)
    return { score, label: t("authPasswordFair"), color: "text-orange-500", bgColor: "bg-orange-500" };
  if (score <= 3)
    return { score, label: t("authPasswordGood"), color: "text-yellow-500", bgColor: "bg-yellow-500" };
  if (score <= 4)
    return { score, label: t("authPasswordStrong"), color: "text-emerald-500", bgColor: "bg-emerald-500" };
  return { score, label: t("authPasswordExcellent"), color: "text-emerald-600", bgColor: "bg-emerald-600" };
}

interface PasswordStrengthIndicatorProps {
  passwordStrength: PasswordStrength;
}

export function PasswordStrengthIndicator({
  passwordStrength,
}: PasswordStrengthIndicatorProps) {
  return (
    <AnimatePresence>
      {passwordStrength && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-1.5"
        >
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className="h-1.5 flex-1 rounded-full bg-muted transition-all duration-300 overflow-hidden"
              >
                <motion.div
                  className={`h-full rounded-full ${
                    level <= passwordStrength.score
                      ? passwordStrength.bgColor
                      : "bg-transparent"
                  }`}
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      level <= passwordStrength.score ? "100%" : "0%",
                  }}
                  transition={{
                    duration: 0.3,
                    delay: level * 0.05,
                  }}
                />
              </div>
            ))}
          </div>
          <p className={`text-xs font-medium ${passwordStrength.color}`}>
            {passwordStrength.label}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
