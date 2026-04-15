"use client";

import { useState, useCallback } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, Check, X, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { useUserSettings } from "@/hooks/useUserSettings";
import { motion, AnimatePresence } from "framer-motion";

export default function ParentalPinSection() {
  const { t } = useI18n();
  const { settings, isLoaded, setSetting } = useUserSettings();

  const currentPin = settings.parentalPin || '';
  const hasPin = currentPin.length > 0;

  const [mode, setMode] = useState<'idle' | 'set' | 'change' | 'remove'>('idle');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [currentPinVerify, setCurrentPinVerify] = useState('');
  const [showPin1, setShowPin1] = useState(false);
  const [showPin2, setShowPin2] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetState = useCallback(() => {
    setMode('idle');
    setPin1('');
    setPin2('');
    setCurrentPinVerify('');
    setShowPin1(false);
    setShowPin2(false);
    setShowCurrent(false);
    setError('');
    setSuccess(false);
  }, []);

  const handleSetPin = useCallback(() => {
    if (!isLoaded) return;
    if (pin1.length < 4) {
      setError(t('pinMinLength'));
      return;
    }
    if (pin1 !== pin2) {
      setError(t('pinMismatch'));
      return;
    }
    setSetting('parentalPin', pin1);
    setSuccess(true);
    setTimeout(() => resetState(), 1500);
  }, [pin1, pin2, isLoaded, setSetting, t, resetState]);

  const handleChangePin = useCallback(() => {
    if (!isLoaded) return;
    if (currentPinVerify !== currentPin) {
      setError(t('pinIncorrect'));
      return;
    }
    if (pin1.length < 4) {
      setError(t('pinMinLength'));
      return;
    }
    if (pin1 !== pin2) {
      setError(t('pinMismatch'));
      return;
    }
    setSetting('parentalPin', pin1);
    setSuccess(true);
    setTimeout(() => resetState(), 1500);
  }, [currentPinVerify, currentPin, pin1, pin2, isLoaded, setSetting, t, resetState]);

  const handleRemovePin = useCallback(() => {
    if (!isLoaded) return;
    if (currentPinVerify !== currentPin) {
      setError(t('pinIncorrect'));
      return;
    }
    setSetting('parentalPin', '');
    setSuccess(true);
    setTimeout(() => resetState(), 1500);
  }, [currentPinVerify, currentPin, isLoaded, setSetting, t, resetState]);

  const PinInput = ({
    value,
    onChange,
    show,
    onToggleShow,
    placeholder = '• • • •',
    errorState = false,
  }: {
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggleShow: () => void;
    placeholder?: string;
    errorState?: boolean;
  }) => (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
        placeholder={placeholder}
        className={`w-full h-12 bg-background border rounded-xl px-4 pe-12 text-center text-lg font-bold tracking-[0.3em] outline-none transition-all duration-300 placeholder:text-muted-foreground/30 ${
          errorState
            ? 'border-red-400 bg-red-50 dark:bg-red-950/20 focus:border-red-500'
            : 'border-border focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10'
        }`}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold">{t('parentalPinTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {hasPin ? t('parentalPinSetDesc') : t('parentalPinDesc')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasPin && mode === 'idle' && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setMode('remove'); setError(''); }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900/30 transition-colors"
              >
                {t('remove')}
              </motion.button>
            )}
            {mode === 'idle' ? (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setMode(hasPin ? 'change' : 'set'); setError(''); }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {hasPin ? t('changePin') : t('setPin')}
              </motion.button>
            ) : (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetState}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted border border-border transition-colors flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                {t('cancel')}
              </motion.button>
            )}
          </div>
        </div>

        {/* PIN forms */}
        <AnimatePresence mode="wait">
          {mode !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4 max-w-sm">
                {/* Verify current PIN (for change/remove) */}
                {hasPin && (mode === 'change' || mode === 'remove') && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      {t('enterCurrentPin')}
                    </label>
                    <PinInput
                      value={currentPinVerify}
                      onChange={setCurrentPinVerify}
                      show={showCurrent}
                      onToggleShow={() => setShowCurrent(!showCurrent)}
                    />
                  </div>
                )}

                {/* New PIN (for set/change) */}
                {(mode === 'set' || mode === 'change') && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        {t('enterNewPin')}
                      </label>
                      <PinInput
                        value={pin1}
                        onChange={(v) => { setPin1(v); setError(''); }}
                        show={showPin1}
                        onToggleShow={() => setShowPin1(!showPin1)}
                        errorState={!!error && error === t('pinMinLength')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        {t('confirmNewPin')}
                      </label>
                      <PinInput
                        value={pin2}
                        onChange={(v) => { setPin2(v); setError(''); }}
                        show={showPin2}
                        onToggleShow={() => setShowPin2(!showPin2)}
                        errorState={!!error && (error === t('pinMismatch'))}
                      />
                    </div>
                    <button
                      onClick={mode === 'set' ? handleSetPin : handleChangePin}
                      className="w-full h-11 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Lock className="w-4 h-4" />
                      {mode === 'set' ? t('savePin') : t('updatePin')}
                    </button>
                  </>
                )}

                {/* Remove PIN confirm */}
                {mode === 'remove' && (
                  <>
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                        {t('removePinWarning')}
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePin}
                      className="w-full h-11 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {t('confirmRemovePin')}
                    </button>
                  </>
                )}

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-red-500 text-center font-medium"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Success message */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900/30"
                    >
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {t('pinSaved')}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
