import type { Metadata } from "next";
import "./globals.css";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/auth/session-provider";
import { I18nProvider } from "@/lib/i18n-context";
import { IncognitoProvider } from "@/lib/incognito-context";
import { WellBeingProvider } from "@/lib/well-being-context";
import { PlaylistQueueProvider } from "@/lib/playlist-queue-context";
import { ClientLayout } from "@/components/ClientLayout";
import { WellBeingGuard } from "@/components/ui/well-being-guard";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-arabic",
});

export const metadata: Metadata = {
  title: "Orchids",
  description: "Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on Orchids.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // NOTE: lang/dir are set client-side from localStorage to prevent flash of wrong language.
  // Server fallback values are overridden by the blocking script before first paint.
  return (
    <html lang="ar" dir="rtl" className={`${ibmPlexSansArabic.variable}`} suppressHydrationWarning>
      {/* Hide body until client-side language is properly initialized */}
      <style dangerouslySetInnerHTML={{ __html: 'html:not([data-lang-ready])>body{visibility:hidden}' }} />
      <noscript><style dangerouslySetInnerHTML={{ __html: 'html>body{visibility:visible!important}' }} /></noscript>
      {/* Blocking script: reads saved language from localStorage and sets html lang/dir before first paint */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var d={ar:'rtl',en:'ltr',fr:'ltr',es:'ltr',zh:'ltr',ja:'ltr',it:'ltr',de:'ltr',pt:'ltr',tr:'ltr'};var lang=null;var m=localStorage.getItem('orchids-language-manually-set');if(m&&d[m])lang=m;if(!lang){var s=localStorage.getItem('orchids-user-settings');if(s){var p=JSON.parse(s);if(p.language&&d[p.language])lang=p.language;}}if(!lang){var det=localStorage.getItem('orchids-language-detected');if(det&&d[det])lang=det;}if(lang){document.documentElement.lang=lang;document.documentElement.dir=d[lang];}}catch(e){}})();`,
        }}
      />
      <body className="antialiased font-ibm-plex-sans-arabic">
        {/* Register BEFORE Next.js bootstraps — capture phase + stopImmediatePropagation
            guarantees our handler wins over Next.js use-error-handler */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('unhandledrejection',function(e){var m=e.reason&&(e.reason.message||String(e.reason));if(m&&m.indexOf('provider destroyed')!==-1){e.stopImmediatePropagation();e.preventDefault();}},true);`,
          }}
        />
        <SessionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <IncognitoProvider>
              <WellBeingProvider>
                <PlaylistQueueProvider>
                  <WellBeingGuard>
                    <ClientLayout />
                    <NextTopLoader color="#FF0000" showSpinner={true} height={3} shadow="0 0 10px #FF0000,0 0 5px #FF0000" />
                    <Script
                      id="orchids-browser-logs"
                      src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
                      strategy="afterInteractive"
                      data-orchids-project-id="24dba629-ac6d-4688-8eef-3717d0605584"
                    />
                    <ErrorReporter />
                    <Toaster position="bottom-left" expand={false} richColors />
                    <Script
                      src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/route-messenger.js"
                      strategy="afterInteractive"
                      data-target-origin="https://orchidstube.com"
                      data-message-type="ROUTE_CHANGE"
                      data-include-search-params="true"
                      data-only-in-iframe="true"
                      data-debug={process.env.NODE_ENV === 'development' ? 'true' : 'false'}
                      data-custom-data='{"appName": "Orchids", "version": "1.0.0"}'
                    />
                    {children}
                  </WellBeingGuard>
                </PlaylistQueueProvider>
              </WellBeingProvider>
            </IncognitoProvider>
          </I18nProvider>
        </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
