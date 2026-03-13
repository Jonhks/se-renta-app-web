"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";

interface DirectionsModalProps {
  open: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
}

export default function DirectionsModal({ open, onClose, lat, lng }: DirectionsModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleOpenMaps = (app: "google" | "waze") => {
    let url = "";
    if (app === "google") {
      // Google Maps deep link
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    } else {
      // Waze deep link
      url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    }
    window.open(url, "_blank");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[9000] backdrop-blur-sm"
          />
          
          {/* Action Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed bottom-0 left-0 right-0 z-[9001] rounded-t-3xl p-6 pb-10 ${
              isDark ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
            } shadow-[0_-8px_30px_rgb(0,0,0,0.12)]`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold tracking-tight">¿Cómo quieres llegar?</h3>
              <button 
                onClick={onClose}
                className={`p-2 rounded-full ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"} transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleOpenMaps("google")}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                  isDark 
                    ? "bg-zinc-800 border-zinc-700 hover:border-blue-500" 
                    : "bg-zinc-50 border-zinc-100 hover:border-blue-500"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden">
                  <img src="https://www.google.com/images/branding/product/2x/maps_96dp.png" alt="Google Maps" className="w-8 h-8" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-base">Google Maps</span>
                  <span className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Usa la navegación de Google</span>
                </div>
              </button>

              <button
                onClick={() => handleOpenMaps("waze")}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                  isDark 
                    ? "bg-zinc-800 border-zinc-700 hover:border-cyan-500" 
                    : "bg-zinc-50 border-zinc-100 hover:border-cyan-500"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#33CCFF] shadow-sm flex items-center justify-center p-2">
                  <svg viewBox="0 0 30 30" fill="white" className="w-8 h-8">
                     <path d="M25.32 15.115c0-5.744-4.67-10.414-10.414-10.414-5.744 0-10.414 4.67-10.414 10.414 0 5.744 4.67 10.414 10.414 10.414l.001 2.373c0 .285.344.428.546.226l2.126-2.126h7.741c5.744 0 10.414-4.67 10.414-10.414zm-14.717 3.32c-.822 0-1.487-.666-1.487-1.487 0-.822.666-1.487 1.487-1.487s1.487.666 1.487 1.487c0 .822-.666 1.487-1.487 1.487zm8.592 0c-.822 0-1.487-.666-1.487-1.487 0-.822.666-1.487 1.487-1.487s1.487.666 1.487 1.487c0 .822-.665 1.487-1.487 1.487zm-1.859-4.832c-1.346-.807-3.08-.807-4.426 0-.256.154-.588.07-.741-.186-.153-.256-.07-.588.186-.741 1.765-1.059 4.029-1.059 5.794 0 .256.154.34.486.186.741-.153.256-.485.34-.741.186z"/>
                  </svg>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-base">Waze</span>
                  <span className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Evita el tráfico con Waze</span>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
