"use client";

import { useTheme } from "@/lib/ThemeContext";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
const YEAR = new Date().getFullYear();

export default function AppFooter() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <footer
      className={`hidden md:flex items-center justify-between px-6 py-2 text-xs border-t transition-colors ${
        isDark
          ? "bg-zinc-950 border-zinc-800 text-zinc-500"
          : "bg-white border-gray-100 text-gray-400"
      }`}
    >
      <span>
        © {YEAR} <span className="font-medium">Se Renta</span> — Mapa
        comunitario
      </span>
      <div className="flex items-center gap-4">
        <a
          href="https://se-renta-landing.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className={`transition-colors hover:underline ${isDark ? "hover:text-zinc-300" : "hover:text-gray-600"}`}
        >
          Landing
        </a>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
            isDark
              ? "border-zinc-700 text-zinc-500"
              : "border-gray-200 text-gray-400"
          }`}
        >
          v{APP_VERSION}
        </span>
      </div>
    </footer>
  );
}
