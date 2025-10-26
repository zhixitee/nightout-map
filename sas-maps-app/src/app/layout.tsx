import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { RoutePlannerProvider } from "@/lib/RoutePlannerContext";
import { MapSearchProvider } from "@/lib/MapSearchContext";
import Navigation from "./components/Navigation";
import EventsSidebar from "./components/EventsSidebar/EventsSidebar";
import ConstellationBackground from "./components/ConstellationBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NightOut Maps",
  description: "Discover and share nightlife spots powered by Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            <MapSearchProvider>
              <RoutePlannerProvider>
                <ConstellationBackground />
                <Navigation />
                <EventsSidebar />
                {children}
              </RoutePlannerProvider>
            </MapSearchProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
