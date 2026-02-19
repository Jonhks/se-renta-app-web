"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { User, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si venimos de un redirect y hubo error
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Resultado de redirección correcto:", result.user);
        }
      })
      .catch((error) => {
        console.error("Error en redirect result:", error.code, error.message);
        if (error.code === "auth/unauthorized-domain") {
          alert("Error: Este dominio no está autorizado en Firebase Console.");
        }
      });

    const unsubscribe = auth.onAuthStateChanged(
      async (u) => {
        console.log(
          "Estado de Auth cambiado (Contexto):",
          u ? u.email : "desconectado",
        );
        setUser(u);

        if (u) {
          try {
            const userRef = doc(db, "users", u.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
              await setDoc(userRef, {
                id: u.uid,
                displayName: u.displayName,
                email: u.email,
                reputationScore: 0,
                contributionsCount: 0,
                status: "active",
                isAdmin: false,
                createdAt: new Date().toISOString(),
              });
            } else {
              await setDoc(
                userRef,
                {
                  displayName: u.displayName,
                  email: u.email,
                  lastLogin: new Date().toISOString(),
                },
                { merge: true },
              );
            }
          } catch (error) {
            console.error("Firestore Error:", error);
          }
        }

        setLoading(false);
      },
      (error) => {
        console.error("Error en el estado de Auth:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
