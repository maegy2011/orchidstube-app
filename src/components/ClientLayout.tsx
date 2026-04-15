"use client";

import dynamic from "next/dynamic";

const RamadanCountdown = dynamic(() => import("@/components/sections/ramadan-countdown"), {
  ssr: false,
});

const PrayerTimesBar = dynamic(() => import("@/components/sections/prayer-times-bar"), {
  ssr: false,
});

const PrayerReminderOverlay = dynamic(() => import("@/components/ui/prayer-reminder-overlay"), {
  ssr: false,
});

const KidsModeEffects = dynamic(() => import("@/components/ui/kids-mode-effects").then(m => ({ default: m.KidsModeEffects })), {
  ssr: false,
});

const EyeProtectionReminder = dynamic(() => import("@/components/ui/eye-protection-reminder").then(m => ({ default: m.EyeProtectionReminder })), {
  ssr: false,
});

export function ClientLayout() {
  return (
    <>
      <KidsModeEffects />
      <PrayerTimesBar />
      <RamadanCountdown />
      <EyeProtectionReminder />
      <PrayerReminderOverlay />
    </>
  );
}
