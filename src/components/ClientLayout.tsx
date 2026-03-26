"use client";

import dynamic from "next/dynamic";
import { KidsModeEffects } from "@/components/ui/kids-mode-effects";
import { EyeProtectionReminder } from "@/components/ui/eye-protection-reminder";

const RamadanCountdown = dynamic(() => import("@/components/sections/ramadan-countdown"), {
  ssr: false,
});

const PrayerTimesBar = dynamic(() => import("@/components/sections/prayer-times-bar"), {
  ssr: false,
});

const PrayerReminderOverlay = dynamic(() => import("@/components/ui/prayer-reminder-overlay"), {
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
