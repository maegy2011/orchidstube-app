"use client";

import React, { useState } from "react";
import { Timer, PlayCircle, Bell, Moon as MoonIcon, ShieldCheck, ClockArrowUp, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n-context";
import { useWellBeing, WellBeingLimits } from "@/lib/well-being-context";
import SettingsToggle from "./SettingsToggle";

interface WellBeingProps {
  wbLimits: WellBeingLimits;
  setWbLimits: (v: WellBeingLimits) => void;
  isRTL: boolean;
}

export default function WellBeingSection({ wbLimits, setWbLimits, isRTL }: WellBeingProps) {
  const { t } = useI18n();

  return (
    <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">{t('digitalWellbeing')}</h3>
              <p className="text-sm text-muted-foreground">{t('parentalControls')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Daily Watch Limit */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Timer className="w-4 h-4 text-orange-500" />
                <span>{t('dailyTimeLimit')}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="480"
                  step="15"
                  value={wbLimits.dailyTimeLimit}
                  onChange={(e) => setWbLimits({...wbLimits, dailyTimeLimit: parseInt(e.target.value)})}
                  className="flex-1 accent-primary"
                />
                <div className="w-20 px-2 py-1 bg-muted rounded-lg text-center text-sm font-bold">
                  {wbLimits.dailyTimeLimit === 0 ? "Off" : `${wbLimits.dailyTimeLimit}m`}
                </div>
              </div>
            </div>

            {/* Daily Shorts Limit */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <PlayCircle className="w-4 h-4 text-red-500" />
                <span>{t('shortsDailyLimit')}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={wbLimits.shortsDailyLimit}
                  onChange={(e) => setWbLimits({...wbLimits, shortsDailyLimit: parseInt(e.target.value)})}
                  className="flex-1 accent-primary"
                />
                <div className="w-20 px-2 py-1 bg-muted rounded-lg text-center text-sm font-bold">
                  {wbLimits.shortsDailyLimit === 0 ? "Off" : `${wbLimits.shortsDailyLimit}`}
                </div>
              </div>
            </div>

            {/* Break Interval */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bell className="w-4 h-4 text-emerald-500" />
                <span>{t('breakInterval')}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="10"
                  value={wbLimits.breakInterval}
                  onChange={(e) => setWbLimits({...wbLimits, breakInterval: parseInt(e.target.value)})}
                  className="flex-1 accent-primary"
                />
                <div className="w-20 px-2 py-1 bg-muted rounded-lg text-center text-sm font-bold">
                  {wbLimits.breakInterval === 0 ? "Off" : `${wbLimits.breakInterval}m`}
                </div>
              </div>
            </div>

            {/* Bedtime Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="flex items-center gap-2">
                <MoonIcon className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium">{t('bedtimeMode')}</span>
              </div>
              <SettingsToggle
                enabled={wbLimits.bedtimeEnabled}
                onToggle={() => setWbLimits({...wbLimits, bedtimeEnabled: !wbLimits.bedtimeEnabled})}
                isRTL={isRTL}
                activeColor="bg-primary"
                ringColor="focus:ring-primary"
              />
            </div>

            {/* Bedtime Times */}
            {wbLimits.bedtimeEnabled && (
              <div className="col-span-full grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('bedtimeStart')}</label>
                  <input
                    type="time"
                    value={wbLimits.bedtimeStart}
                    onChange={(e) => setWbLimits({...wbLimits, bedtimeStart: e.target.value})}
                    className="w-full bg-muted border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('bedtimeEnd')}</label>
                  <input
                    type="time"
                    value={wbLimits.bedtimeEnd}
                    onChange={(e) => setWbLimits({...wbLimits, bedtimeEnd: e.target.value})}
                    className="w-full bg-muted border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Parental PIN Setup */}
            <ParentalPinSection />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Parental PIN management section */
function ParentalPinSection() {
  const { t } = useI18n();
  const { hasPinSet, setParentalPin, removeParentalPin } = useWellBeing();
  const [isSetting, setIsSetting] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSavePin = async () => {
    setError('');
    if (newPin.length < 4) {
      setError(t('pinMinLength'));
      return;
    }
    if (newPin !== confirmPin) {
      setError(t('pinMismatch'));
      return;
    }
    await setParentalPin(newPin);
    setNewPin('');
    setConfirmPin('');
    setIsSetting(false);
    setShowPins(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleRemovePin = () => {
    removeParentalPin();
    setIsSetting(false);
    setNewPin('');
    setConfirmPin('');
    setShowPins(false);
  };

  return (
    <div className="col-span-full space-y-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-rose-500" />
          <span className="text-sm font-medium">{t('parentalPin')}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasPinSet && !isSetting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('pinSet')}
            </motion.div>
          )}
          {!isSetting ? (
            <button
              onClick={() => setIsSetting(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-background border border-border hover:bg-muted transition-colors"
            >
              {hasPinSet ? t('changePin') : t('setPin')}
            </button>
          ) : (
            <button
              onClick={() => { setIsSetting(false); setNewPin(''); setConfirmPin(''); setShowPins(false); setError(''); }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              {t('cancel')}
            </button>
          )}
        </div>
      </div>

      {/* PIN description */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t('parentalPinDescription')}
      </p>

      <AnimatePresence>
        {isSetting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* New PIN */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('newPin')}</label>
              <div className="relative">
                <input
                  type={showPins ? 'text' : 'password'}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • •"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/50 transition-all pe-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPins(!showPins)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  {showPins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm PIN */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('confirmPin')}</label>
              <input
                type={showPins ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • •"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/50 transition-all"
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-destructive font-medium"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('pinSaved')}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSavePin}
                disabled={newPin.length < 4 || confirmPin.length < 4}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  newPin.length >= 4 && confirmPin.length >= 4
                    ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {t('savePin')}
              </button>
              {hasPinSet && (
                <button
                  onClick={handleRemovePin}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 border border-border hover:border-destructive/20 transition-all"
                >
                  {t('removePin')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
