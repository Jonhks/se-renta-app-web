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

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Se Renta",
  description: "Encuentra tu próximo hogar",
  icons: {
    icon: "/logo.svg",
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
      <body className="h-screen flex flex-col">
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
                <a
                  href="/"
                  className="se-renta-logo-wrapper"
                >
                  <SeRentaLogo size={36} />
                </a>
                <div className="flex items-center gap-3">
                  {/* Toggle visible en desktop */}
                  <ThemeToggle className="hidden md:flex" />
                  <AuthButton />
                </div>
              </header>

              <main className="flex-1">{children}</main>
              <AppFooter />
            </AppInitializer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
