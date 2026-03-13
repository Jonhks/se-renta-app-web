import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthButton from "@/components/AuthButton";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppInitializer from "@/components/AppInitializer";
import { SeRentaLogo } from "@/components/SeRentaIcon";
import ThemeToggle from "@/components/ThemeToggle";
import AppFooter from "@/components/AppFooter";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Se Renta — Mapa Comunitario",
  description: "Encuentra tu próximo hogar y reporta inmuebles disponibles en tu zona.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Se Renta",
    description: "Mapa comunitario para encontrar rentas disponibles.",
    url: "https://se-renta.vercel.app", // Asumiendo URL base
    siteName: "Se Renta",
    images: [
      {
        url: "/logo.svg",
        width: 800,
        height: 600,
        alt: "Se Renta Logo",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Se Renta",
    description: "Mapa comunitario de inmuebles disponibles.",
    images: ["/logo.svg"],
  },
  appleWebApp: {
    title: "Se Renta",
    statusBarStyle: "default",
    capable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={inter.variable}
    >
      <body className="h-[100dvh] overflow-hidden flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <AppInitializer>
              <ToastContainer
                position="bottom-right"
                theme="dark"
              />
              <header
                className="flex items-center justify-between px-6 py-3 border-b sticky top-0 z-[8000]"
                style={{
                  backgroundColor: "var(--header-bg)",
                  borderColor: "var(--header-border)",
                }}
              >
                <Link
                  href="/"
                  className="se-renta-logo-wrapper"
                >
                  <SeRentaLogo size={36} />
                </Link>
                <div className="flex items-center gap-3">
                  {/* Toggle visible en desktop */}
                  <ThemeToggle className="hidden md:flex" />
                  <AuthButton />
                </div>
              </header>

              <main className="flex-1 overflow-auto">{children}</main>
              <BottomNav />
              <AppFooter />
            </AppInitializer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
