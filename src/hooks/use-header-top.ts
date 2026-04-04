import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { usePrayer } from "@/lib/prayer-times-context";
import { getDaysUntilRamadan } from "@/lib/date-utils";

export function useHeaderTop() {
  const { showRamadanCountdown } = useI18n();
  const { prayerEnabled, nextPrayer } = usePrayer();
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const isPrayerBarVisible = prayerEnabled && nextPrayer !== null;

  if (isRamadanCountdownVisible && isPrayerBarVisible) {
    return 'top-[80px] sm:top-[72px]';
  } else if (isRamadanCountdownVisible || isPrayerBarVisible) {
    return 'top-[40px] sm:top-[36px]';
  }
  return 'top-0';
}
