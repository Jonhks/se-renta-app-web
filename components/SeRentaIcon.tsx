"use client";

import { useTheme } from "@/lib/ThemeContext";

type IconProps = {
  size?: number;
  pinColor?: string;
  houseColor?: string;
};

/**
 * Pin SVG icon. Auto-inverts colors based on light/dark theme if no colors passed.
 */
export const SeRentaIcon = ({ size = 36, pinColor, houseColor }: IconProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const pin = pinColor ?? (isDark ? "#ffffff" : "#111111");
  const house = houseColor ?? (isDark ? "#111111" : "#ffffff");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 2C20 2 10 12 10 24c0 14 22 38 22 38s22-24 22-38C54 12 44 2 32 2z"
        fill={pin}
      />
      <circle
        cx="32"
        cy="24"
        r="14"
        fill={pin}
      />
      <path
        d="M24 26 L32 20 L40 26 V36 H34 V30 H30 V36 H24 Z"
        fill={house}
      />
    </svg>
  );
};

export const SeRentaLogo = ({ size = 36 }: { size?: number }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="se-renta-logo-wrapper">
      <SeRentaIcon size={size} />
      <span
        className="se-renta-logo-text"
        style={{ color: isDark ? "#ffffff" : "#111111" }}
      >
        Se Renta
      </span>
    </div>
  );
};
