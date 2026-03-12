"use client";

import { useTheme } from "@/lib/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={`relative flex items-center cursor-pointer select-none ${className}`}
    >
      {/* Track */}
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
          isDark ? "bg-zinc-600" : "bg-zinc-300"
        }`}
      >
        {/* Thumb */}
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full shadow flex items-center justify-center transition-all duration-300 ${
            isDark ? "translate-x-5 bg-zinc-200" : "translate-x-0.5 bg-white"
          }`}
        >
          {isDark ? (
            /* Moon icon */
            <svg
              viewBox="0 0 24 24"
              width="11"
              height="11"
              fill="none"
              stroke="#3f3f46"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            /* Sun icon */
            <svg
              viewBox="0 0 24 24"
              width="11"
              height="11"
              fill="none"
              stroke="#71717a"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle
                cx="12"
                cy="12"
                r="4"
              />
              <line
                x1="12"
                y1="2"
                x2="12"
                y2="4"
              />
              <line
                x1="12"
                y1="20"
                x2="12"
                y2="22"
              />
              <line
                x1="4.22"
                y1="4.22"
                x2="5.64"
                y2="5.64"
              />
              <line
                x1="18.36"
                y1="18.36"
                x2="19.78"
                y2="19.78"
              />
              <line
                x1="2"
                y1="12"
                x2="4"
                y2="12"
              />
              <line
                x1="20"
                y1="12"
                x2="22"
                y2="12"
              />
              <line
                x1="4.22"
                y1="19.78"
                x2="5.64"
                y2="18.36"
              />
              <line
                x1="18.36"
                y1="5.64"
                x2="19.78"
                y2="4.22"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}
