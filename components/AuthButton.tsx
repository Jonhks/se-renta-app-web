"use client";

import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import ConfirmDialog from "./ConfirmDialog";
import { doc, onSnapshot } from "firebase/firestore";
import { toast } from "react-toastify";

export default function AuthButton() {
  const { user, loading } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [reputation, setReputation] = useState<number>(0);
  const [status, setStatus] = useState<string>("active");
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setReputation(data.reputationScore ?? 0);
        setStatus(data.status ?? "active");
      }
    });

    // Verificar admin claim
    user.getIdTokenResult().then((token) => {
      setIsAdmin(token.claims.admin === true);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-500">Verificando...</span>
      </div>
    );
  }

  // Consola de ayuda para entender el estado del usuario
  if (user) {
    // console.log("Usuario autenticado:", user);
  }

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      toast.success(`¡Bienvenido, ${result.user.displayName}!`);
    } catch (error: any) {
      console.error("handleLogin: Error!", error.code, error.message);
      toast.error("Error al iniciar sesión");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.info("Sesión cerrada");
    setOpenDialog(false);
  };

  if (user) {
    return (
      <>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <a
              href={pathname === "/admin" ? "/" : "/admin"}
              className="bg-black text-white px-3 py-1 rounded transition-colors hover:bg-gray-800 cursor-pointer text-sm font-medium"
            >
              {pathname === "/admin" ? "Mapa" : "Admin"}
            </a>
          )}
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Avatar"
              className="w-10 h-10 rounded-full border-2 border-transparent shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg shadow-sm border border-gray-300">
              👤
            </div>
          )}
          <div className="flex flex-col items-start pr-2">
            <span className="text-sm font-medium line-clamp-1">
              {user.displayName}
            </span>
            <span
              className={`text-xs flex items-center gap-1 ${
                status === "banned"
                  ? "text-red-500"
                  : status === "restricted"
                    ? "text-orange-300"
                    : "text-gray-400"
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
          </div>
          <button
            onClick={() => setOpenDialog(true)}
            className="bg-black text-white px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-800 cursor-pointer text-sm font-medium hidden md:block"
          >
            Salir
          </button>
        </div>

        <ConfirmDialog
          open={openDialog}
          title="Cerrar sesión"
          description="¿Seguro que quieres salir de tu cuenta?"
          onConfirm={handleLogout}
          onCancel={() => setOpenDialog(false)}
        />
      </>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="bg-black text-white px-4 py-2 rounded transition-colors hover:bg-gray-800 hover:text-white cursor-pointer"
    >
      Iniciar con Google
    </button>
  );
}
