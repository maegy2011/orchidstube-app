import type { Metadata } from "next";
import * as nextHeaders from "next/headers";
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
  const headersList = await nextHeaders.headers();
  const acceptLanguage = headersList.get('accept-language');
  const language = acceptLanguage ? acceptLanguage.split(',')[0].split('-')[0] : 'en';
  const isRTL = language === 'ar';

  return (
    <html lang={language} dir={isRTL ? "rtl" : "ltr"} className={`${ibmPlexSansArabic.variable}`} suppressHydrationWarning>
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
            </WellBeingProvider>
            </IncognitoProvider>
          </I18nProvider>
        </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
