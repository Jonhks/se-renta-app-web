"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { toast } from "react-toastify";
import ConfirmDialog from "./ConfirmDialog";
import ShareButton from "./ShareButton";
import ThemeToggle from "./ThemeToggle";

export default function MobileUserMenu() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [reputation, setReputation] = useState<number>(0);
  const [contributions, setContributions] = useState<number>(0);
  const [status, setStatus] = useState<string>("active");
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const isDark = theme === "dark";

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setReputation(data.reputationScore ?? 0);
        setContributions(data.contributionsCount ?? 0);
        setStatus(data.status ?? "active");
      }
    });
    user.getIdTokenResult().then((token) => {
      setIsAdmin(token.claims.admin === true);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    toast.info("Sesión cerrada");
    setConfirmLogout(false);
  };

  const openLogoutConfirm = () => {
    setOpen(false);
    setTimeout(() => setConfirmLogout(true), 220);
  };

  if (!user) return null;

  // ── Theme-aware class helpers ──────────────────────────
  const drawerBg = isDark ? "bg-zinc-900 text-white" : "bg-white text-gray-900";
  const headerBdr = isDark ? "border-zinc-700" : "border-gray-200";
  const closeColor = isDark
    ? "text-zinc-400 hover:text-white"
    : "text-gray-400 hover:text-gray-800";
  const profileBg = isDark ? "bg-zinc-800" : "bg-gray-50";
  const avatarBdr = isDark ? "border-zinc-600" : "border-gray-200";
  const scoreTxt = isDark ? "text-zinc-400" : "text-gray-400";
  const contribTxt = isDark ? "text-zinc-500" : "text-gray-400";
  const navHover = isDark
    ? "text-zinc-300 hover:bg-zinc-800 hover:text-white"
    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  const logoutBdr = isDark
    ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
    : "border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900";
  const adminBtn = isDark
    ? "bg-white text-black hover:bg-zinc-200"
    : "bg-black text-white hover:bg-gray-800";

  return (
    <>
      {/* Trigger: foto del usuario */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center focus:outline-none"
        aria-label="Abrir menú de usuario"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt="Avatar"
            className={`w-9 h-9 rounded-full border-2 ${avatarBdr} shadow-sm object-cover`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-base shadow-sm border ${avatarBdr} ${isDark ? "bg-zinc-700" : "bg-gray-100"}`}
          >
            👤
          </div>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[7000] bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 z-[7100] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${drawerBg} ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${headerBdr}`}
        >
          <span className="font-semibold text-base">Mi cuenta</span>
          <button
            onClick={() => setOpen(false)}
            className={`text-xl leading-none transition-colors ${closeColor}`}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Perfil */}
        <div
          className={`flex items-center gap-3 px-5 py-4 border-b ${headerBdr} ${profileBg}`}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Avatar"
              className={`w-12 h-12 rounded-full border-2 ${avatarBdr} object-cover`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border ${avatarBdr} ${isDark ? "bg-zinc-700" : "bg-gray-100"}`}
            >
              👤
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">
              {user.displayName}
            </span>
            <span
              className={`text-xs mt-0.5 ${
                status === "banned"
                  ? "text-red-400"
                  : status === "restricted"
                    ? "text-orange-400"
                    : scoreTxt
              }`}
            >
              {status === "banned" ? (
                <>🚫 Cuenta suspendida</>
              ) : (
                <>
                  ⭐ {reputation} ·{" "}
                  {status === "active" ? "Activo" : "Restringido"}
                </>
              )}
            </span>
            {status !== "banned" && (
              <span className={`text-xs mt-0.5 ${contribTxt}`}>
                📝 {contributions} contribuciones
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col px-4 py-4 gap-1 flex-1">
          {isAdmin && (
            <a
              href={pathname === "/admin" ? "/" : "/admin"}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${adminBtn}`}
            >
              <span>🛠</span>
              {pathname === "/admin" ? "Ir al Mapa" : "Panel Admin"}
            </a>
          )}

          {/* Theme toggle row */}
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${navHover}`}
          >
            <span className="flex items-center gap-3">
              <span>🎨</span>
              Modo oscuro
            </span>
            <ThemeToggle />
          </div>

          <a
            href="https://se-renta-landing.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${navHover}`}
          >
            <span>🌐</span>
            Sobre la app
          </a>

          <ShareButton
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full ${navHover}`}
          />
        </nav>

        {/* Footer: logout + versión */}
        <div className={`px-4 pt-2 border-t ${headerBdr}`}>
          <button
            onClick={openLogoutConfirm}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${logoutBdr}`}
          >
            <span>→</span>
            Cerrar sesión
          </button>
          <div className={`text-center py-3 text-[11px] ${contribTxt}`}>
            v{process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0"}
          </div>
        </div>
      </div>

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
