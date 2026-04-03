"use client";

import { useState, useEffect } from "react";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { Search, ChevronRight, Play, User, Shield, CreditCard, MessageCircle, Headphones, MessageSquarePlus, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { useSidebarLayout } from "@/hooks/use-sidebar-layout";
import { useTopPadding } from "@/hooks/use-top-padding";

export default function HelpPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { t, direction } = useI18n();
  const mainPaddingTop = useTopPadding();

  const { marginClass } = useSidebarLayout(sidebarOpen);

  const topics = [
    { icon: Play, title: t('helpTopicPlay'), desc: t('helpTopicPlayDesc') },
    { icon: User, title: t('helpTopicUser'), desc: t('helpTopicUserDesc') },
    { icon: Shield, title: t('helpTopicShield'), desc: t('helpTopicShieldDesc') },
    { icon: CreditCard, title: t('helpTopicCreditCard'), desc: t('helpTopicCreditCardDesc') },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" dir={direction}>
      <Masthead 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
      />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
        <main className={`${marginClass} ${mainPaddingTop} transition-all duration-300`}>
          {/* Header Navigation */}
          <div className="bg-red-600 p-4 text-white">
            <div className="max-w-4xl mx-auto flex gap-2 bg-black/10 p-1 rounded-xl">
              <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold bg-white text-red-600">
                <HelpCircle className="w-4 h-4" />
                {t('help')}
              </div>
              <Link 
                href="/feedback"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <MessageSquarePlus className="w-4 h-4" />
                {t('feedback')}
              </Link>
              <Link 
                href="/support"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <Headphones className="w-4 h-4" />
                {t('support')}
              </Link>
            </div>
          </div>

          {/* Hero Section */}
        <div className="bg-muted py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-8">{t('helpHeroHeading')}</h1>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input 
                type="text"
                placeholder={t('helpSearchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 ps-12 pe-4 rounded-2xl border-none shadow-xl bg-background focus:ring-2 focus:ring-red-500 outline-none transition-all text-lg"
              />
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto p-8">
          <h2 className="text-xl font-bold mb-6">{t('helpPopularTopics')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic, i) => (
              <button 
                key={i}
                className="flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:bg-muted hover:border-red-500/30 transition-all group text-end"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors">
                    <topic.icon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{topic.title}</h3>
                    <p className="text-sm text-muted-foreground">{topic.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-red-600 transition-colors rtl:rotate-180" />
              </button>
            ))}
          </div>

          <div className="mt-16 bg-red-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">{t('helpCtaHeading')}</h2>
              <p className="opacity-90">{t('helpCtaDesc')}</p>
            </div>
            <Link href="/support" className="whitespace-nowrap bg-white text-red-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {t('helpCtaButton')}
            </Link>
          </div>

          <div className="mt-16 text-center border-t border-border pt-12">
            <p className="text-muted-foreground text-sm">{t('helpFooter')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
