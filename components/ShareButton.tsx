"use client";

import { toast } from "react-toastify";

interface ShareButtonProps {
  url?: string;
  title?: string;
  text?: string;
  className?: string;
}

export default function ShareButton({
  url = "https://se-renta-landing.vercel.app/",
  title = "SE RENTA — Mapa Comunitario",
  text = "Encuentra depa sin fraudes 🏠 Mapa comunitario donde la gente confirma qué está disponible y reporta fraudes.",
  className = "",
}: ShareButtonProps) {
  const handleShare = async () => {
    // Web Share API — abre sheet nativo en móvil (WhatsApp, Instagram, etc.)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err: any) {
        // Usuario canceló el share dialog — no es error
        if (err?.name !== "AbortError") {
          console.error("Share error:", err);
        }
      }
      return;
    }

    // Fallback desktop: copia al portapapeles
    try {
      await navigator.clipboard.writeText(url);
      toast.success("¡Link copiado al portapapeles! 📋");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  return (
    <button
      onClick={handleShare}
      title="Compartir la app"
      className={`flex items-center gap-2 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle
          cx="18"
          cy="5"
          r="3"
        />
        <circle
          cx="6"
          cy="12"
          r="3"
        />
        <circle
          cx="18"
          cy="19"
          r="3"
        />
        <line
          x1="8.59"
          y1="13.51"
          x2="15.42"
          y2="17.49"
        />
        <line
          x1="15.41"
          y1="6.51"
          x2="8.59"
          y2="10.49"
        />
      </svg>
      Compartir
    </button>
  );
}
