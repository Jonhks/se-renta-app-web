"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";

export default function UpdateNotification() {
  const [show, setShow] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "metadata", "app"), (snap) => {
      console.log("UpdateNotification: Snapshot received");
      if (snap.exists()) {
        const data = snap.data();
        const latest = data.version?.toString().trim();
        const current = CURRENT_VERSION.trim();
        
        console.log("UpdateNotification: Version check", { current, latest });
        
        if (latest && latest !== current) {
          console.warn(`UpdateNotification: Update available! ${current} -> ${latest}`);
          setNewVersion(latest);
          setShow(true);
        } else {
          console.log("UpdateNotification: App is up to date");
        }
      } else {
        console.error("UpdateNotification Error: Document 'metadata/app' not found");
      }
    });

    return () => unsub();
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 dark:border-zinc-800 text-center space-y-4 transform transition-all scale-100">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto text-3xl">
          🚀
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            ¡Nueva versión disponible!
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Hemos actualizado la aplicación con mejoras y correcciones importantes. 
            <span className="block mt-1 font-medium text-gray-400">v{CURRENT_VERSION} → v{newVersion}</span>
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg"
        >
          Actualizar ahora
        </button>
      </div>
    </div>
  );
}
