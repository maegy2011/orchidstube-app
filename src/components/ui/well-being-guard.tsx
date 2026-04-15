"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Moon as MoonIcon, Timer, Eye, EyeOff, PlayCircle } from 'lucide-react';
import { useWellBeing } from '@/lib/well-being-context';
import { useI18n } from '@/lib/i18n-context';

export function WellBeingGuard({ children }: { children: React.ReactNode }) {
  const { isBedtime, limits, isReady, isLimitReached, isShortsLimitReached, hasPinSet, verifyParentalPin } = useWellBeing();
  const { t } = useI18n();

  const [showOverride, setShowOverride] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Determine which restriction is active
  const isRestricted = isBedtime || isLimitReached || isShortsLimitReached;

  // Show override modal when restriction activates
  useEffect(() => {
    if (isReady && isRestricted && !dismissed) {
      setShowOverride(true);
    }
  }, [isReady, isRestricted, dismissed]);

  const getRestrictionTitle = () => {
    if (isBedtime) return t('bedtimeModeActive');
    if (isLimitReached) return t('dailyLimitReached');
    if (isShortsLimitReached) return t('dailyLimitReached');
    return '';
  };

  const getRestrictionMessage = () => {
    if (isBedtime) return t('goodNightReminder');
    if (isLimitReached) return t('timeToRest');
    if (isShortsLimitReached) return t('shortsLimitReachedDesc');
    return '';
  };

  const getRestrictionIcon = () => {
    if (isBedtime) return MoonIcon;
    if (isLimitReached) return Timer;
    if (isShortsLimitReached) return PlayCircle;
    return MoonIcon;
  };

  const handleOverride = useCallback(async () => {
    if (pin.length < 4) {
      setPinError(true);
      setAttempts(prev => prev + 1);
      setTimeout(() => setPinError(false), 2000);
      return;
    }

    const isValid = await verifyParentalPin(pin);
    if (isValid) {
      setShowOverride(false);
      setPin('');
      setPinError(false);
      setAttempts(0);
      setDismissed(true);
      setTimeout(() => setDismissed(false), 30 * 60 * 1000);
    } else {
      setPinError(true);
      setAttempts(prev => prev + 1);
      setTimeout(() => setPinError(false), 2000);
      if (attempts + 1 >= 3) {
        setShowOverride(false);
        setPin('');
        setAttempts(0);
      }
    }
  }, [pin, verifyParentalPin, attempts]);

  const Icon = getRestrictionIcon();

  return (
    <>
      {children}

      <AnimatePresence>
        {showOverride && isRestricted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-sm mx-4"
            >
              <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl p-8 shadow-2xl border border-gray-800/50">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-indigo-400" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-white text-lg font-bold text-center mb-2">
                  {getRestrictionTitle()}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
                  {getRestrictionMessage()}
                </p>

                {/* PIN Section */}
                {hasPinSet ? (
                  <div className="space-y-4">
                    <label className="text-gray-400 text-xs font-medium text-center block">
                      {t('enterParentalPin')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="• • • •"
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-center text-lg tracking-[0.5em] outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all pr-10"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleOverride()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Attempts remaining */}
                    <div className="flex justify-between text-xs text-white/25 px-1 mb-1">
                      <span>{t('attemptsRemaining').replace('{count}', String(3 - attempts))}</span>
                    </div>

                    {/* Error */}
                    {pinError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-red-400 text-center mb-4"
                      >
                        {attempts >= 2 ? t('pinTooManyAttempts') : t('incorrectPin')}
                      </motion.p>
                    )}

                    {/* Unlock button */}
                    <button
                      onClick={handleOverride}
                      disabled={pin.length < 4 || !hasPinSet}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        pin.length >= 4 && hasPinSet
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white active:scale-[0.98]'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      {t('unlock')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-500 text-xs text-center">
                      {t('parentalPinDescription')}
                    </p>
                    <button
                      onClick={() => setShowOverride(false)}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white active:scale-[0.98] transition-all"
                    >
                      {t('dismiss')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
