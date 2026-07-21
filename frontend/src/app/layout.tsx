import type { Metadata } from "next";
import "./globals.css";
import GoogleAuthProvider from "@/providers/GoogleAuthProvider";
import ThemeHydrator from "@/components/ThemeHydrator";

export const metadata: Metadata = {
  title: "ESSS Science Portal | Ethiopian Space Science Society",
  description: "Explore the Ethiopian Space Science Society (ESSS) Science Portal. Access interactive tools, track satellites, search exoplanet archives, and walk in the solar system.",
  icons: {
    icon: "/esss-badge.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.cdnfonts.com/css/google-sans" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/style.css" />
        {/* Inline script to prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('portal_theme');
                  if (savedTheme === 'light') {
                    document.documentElement.classList.add('light');
                  } else if (savedTheme === 'dark') {
                    document.documentElement.classList.remove('light');
                  } else {
                    var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (!systemPrefersDark) {
                      document.documentElement.classList.add('light');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeHydrator />
        <GoogleAuthProvider>
          {children}
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
