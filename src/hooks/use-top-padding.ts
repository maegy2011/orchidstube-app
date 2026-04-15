import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { usePrayer } from "@/lib/prayer-times-context";
import { getDaysUntilRamadan } from "@/lib/date-utils";

export function useTopPadding() {
  const { showRamadanCountdown } = useI18n();
  const { prayerEnabled, nextPrayer } = usePrayer();
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const isPrayerBarVisible = prayerEnabled && nextPrayer !== null;

  if (isRamadanCountdownVisible && isPrayerBarVisible) {
    return 'pt-[144px] sm:pt-[136px]';
  } else if (isRamadanCountdownVisible || isPrayerBarVisible) {
    return 'pt-[104px] sm:pt-[100px]';
  }
  return 'pt-[64px]';
}
