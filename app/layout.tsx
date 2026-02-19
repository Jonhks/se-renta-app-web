import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthButton from "@/components/AuthButton";
import { AuthProvider } from "@/lib/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Se Renta",
  description: "Encuentra tu próximo hogar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen flex flex-col">
        <AuthProvider>
          <ToastContainer
            position="top-right"
            theme="dark"
          />
          <header className="flex items-center justify-between px-6 py-4 border-b">
            <h1 className="text-lg font-bold tracking-wide">SE RENTA</h1>
            <AuthButton />
          </header>

          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
