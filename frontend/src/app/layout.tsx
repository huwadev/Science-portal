import type { Metadata } from "next";
import "./globals.css";
import GoogleAuthProvider from "@/providers/GoogleAuthProvider";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased relative">
        <GoogleAuthProvider>
          {children}
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
