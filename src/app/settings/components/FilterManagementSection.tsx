"use client";

import { ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface FilterManagementSectionProps {
  t: (key: string) => string;
  isRTL: boolean;
  router: AppRouterInstance;
}

export default function FilterManagementSection({
  t,
  isRTL,
  router,
}: FilterManagementSectionProps) {
  return (
    <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push('/admin/filter')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold">{t('filterManagement')}</h3>
            <p className="text-sm text-muted-foreground">{t('filterManagement')}</p>
          </div>
        </div>
        <div className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowRight size={20} className={cn("text-muted-foreground", isRTL && "rotate-180")} />
        </div>
      </div>
    </div>
  );
}
