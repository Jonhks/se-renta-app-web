"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// No external icon library needed, using inline SVGs
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { toast } from "react-toastify";
import { events } from "@/lib/events";
import ConfirmDialog from "./ConfirmDialog";
import ShareButton from "./ShareButton";

export default function BottomNav() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [openSubmenu, setOpenSubmenu] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [reputation, setReputation] = useState<number>(0);
  const [contributions, setContributions] = useState<number>(0);
  
  const isDark = theme === "dark";

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setReputation(data.reputationScore ?? 0);
        setContributions(data.contributionsCount ?? 0);
      }
    });
    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  const handleLogout = async () => {
    await signOut(auth);
    toast.info("Sesión cerrada");
    setConfirmLogout(false);
    setOpenSubmenu(false);
  };

  const navItemClass = "flex flex-col items-center justify-center w-full h-full gap-1 transition-all active:scale-90";
  const iconClass = "size-6";
  const labelClass = "text-[10px] font-medium uppercase tracking-widest opacity-70";

  return (
    <>
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-[8000] h-20 px-4 pb-4 border-t transition-colors ${
        isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-100"
      }`}>
        <div className="flex items-center justify-around h-full max-w-lg mx-auto">
          {/* Submenu Trigger */}
          <button 
            onClick={() => setOpenSubmenu(!openSubmenu)}
            className={`${navItemClass} ${openSubmenu ? "text-blue-500" : (isDark ? "text-zinc-400" : "text-zinc-500")}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            <span className={labelClass}>Menú</span>
          </button>

          {/* About */}
          <a 
            href="https://se-renta-landing.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`${navItemClass} ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <span className={labelClass}>Sobre la app</span>
          </a>

          {/* Create Report */}
          <button 
            onClick={() => events.emit("createReport")}
            className="flex flex-col items-center justify-center -translate-y-8 active:scale-95 transition-transform"
          >
            <div className="size-16 rounded-full bg-black dark:bg-white shadow-xl flex items-center justify-center text-white dark:text-black">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </div>
          </button>

          {/* Location */}
          <button 
            onClick={() => events.emit("locate")}
            className={`${navItemClass} ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className={labelClass}>Ubicación</span>
          </button>
        </div>
      </nav>

      {/* Submenu Backdrop */}
      <AnimatePresence>
        {openSubmenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenSubmenu(false)}
              className="fixed inset-0 bg-black/40 z-[8001] md:hidden backdrop-blur-[2px]"
            />
            
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed bottom-24 left-4 right-4 z-[8002] rounded-3xl overflow-hidden md:hidden shadow-2xl ${
                isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-100"
              }`}
            >
              <div className="flex flex-col p-2">
                {/* User Stats */}
                <div className={`p-4 mb-2 rounded-2xl flex items-center justify-between ${isDark ? "bg-zinc-800/50" : "bg-zinc-50"}`}>
                   <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Tu Actividad</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          <span className="font-bold text-lg">{reputation}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                          <span className="font-bold text-lg">{contributions}</span>
                        </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] opacity-40 uppercase font-bold block">Puntos</span>
                      <span className="text-[10px] opacity-40 uppercase font-bold block">Contribuciones</span>
                   </div>
                </div>

                {/* Submenu Items */}
                <button 
                  onClick={() => { toggleTheme(); setOpenSubmenu(false); }}
                  className={`flex items-center gap-3 w-full p-4 rounded-xl transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isDark ? "text-zinc-100" : "text-zinc-900"}`}
                >
                  {isDark ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M22 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                  )}
                  <span className="font-medium flex-1 text-left">Modo {isDark ? "Claro" : "Oscuro"}</span>
                </button>

                <ShareButton 
                  className={`flex items-center gap-3 w-full p-4 rounded-xl transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isDark ? "text-zinc-100" : "text-zinc-900"}`}
                />

                <button 
                  onClick={() => { setConfirmLogout(true); setOpenSubmenu(false); }}
                  className="flex items-center gap-3 w-full p-4 rounded-xl transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span className="font-medium flex-1 text-left">Cerrar Sesión</span>
                </button>

                <div className="border-t border-zinc-100 dark:border-zinc-800 mt-2 p-3 text-center">
                  <span className="text-[10px] opacity-30 font-bold uppercase tracking-[0.2em]">
                    v{process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.4"}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmLogout}
        title="Cerrar sesión"
        description="¿Seguro que quieres salir de tu cuenta?"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
