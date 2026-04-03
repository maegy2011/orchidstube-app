"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationPickerProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: string[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelect: (value: string) => void;
  isLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  placeholder: string;
  isRTL: boolean;
  noResultsText: string;
  searchPlaceholder: string;
}

export default function LocationPicker({
  label,
  icon,
  value,
  options,
  searchQuery,
  onSearchChange,
  onSelect,
  isLoading,
  isOpen,
  onToggle,
  disabled = false,
  placeholder,
  isRTL,
  noResultsText,
  searchPlaceholder,
}: LocationPickerProps) {
  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-medium flex items-center gap-2">
        {icon}
        {label}
      </label>
      <div className="relative">
        <button
          disabled={disabled}
          onClick={onToggle}
          className={cn(
            "w-full bg-muted border border-border/50 rounded-xl px-4 py-2 text-sm text-start flex items-center justify-between hover:bg-muted/80 transition-all",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className={cn(value ? "text-foreground" : "text-muted-foreground", isRTL && "text-right w-full")}>
            {value || placeholder}
          </span>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-[100] overflow-hidden flex flex-col max-h-[300px]"
            >
              <div className="p-2 border-b border-border bg-muted/30">
                <div className="relative">
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-background border border-border rounded-lg px-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="overflow-y-auto custom-scrollbar">
                {options.length > 0 ? (
                  options.map((option) => (
                    <button
                      key={option}
                      onClick={() => onSelect(option)}
                      className={cn(
                        "w-full px-4 py-2 text-sm text-start hover:bg-muted transition-colors",
                        value === option && "bg-emerald-500/10 text-emerald-600 font-semibold"
                      )}
                    >
                      {option}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {noResultsText}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
