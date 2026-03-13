"use client";

import { useAuth } from "@/lib/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
// import CreateReportModal from "./CreateReportModal";
export default function CreateReportButton({
  position,
  setPosition,
  setSelectingLocation,
  setOpenModal,
  className,
}: {
  position: [number, number] | null;
  setPosition: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  setSelectingLocation: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}) {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>("active");
  const [showTooltip, setShowTooltip] = useState(true);
  const hasLocation = !!position;

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setStatus(snap.data().status ?? "active");
      }
    });

    return () => unsubscribe();
  }, [user]);

  const isActive = !!user && status === "active" && hasLocation;
  const isRestricted = !!user && status === "restricted";
  const isBanned = !!user && status === "banned";
  const isGuest = !user;

  const handleClick = () => {
    if (!position) {
      if (!navigator.geolocation) {
        toast.error("Tu navegador no soporta geolocalización");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);

          if (user && status === "active") {
            setOpenModal(true);
          } else if (!user) {
            toast.warning("Inicia sesión para reportar");
          } else if (status === "restricted") {
            toast.error("Tu cuenta está restringida");
          } else if (status === "banned") {
            toast.error("Cuenta suspendida");
          }
        },
        () => {
          toast.warning("Necesitamos tu ubicación para crear el reporte");
        },
      );
      return;
    }

    if (isActive) {
      setOpenModal(true);
      return;
    }

    if (isGuest) {
      toast.warning("Inicia sesión para reportar");
    } else if (isRestricted) {
      toast.error("Tu cuenta está restringida");
    } else if (isBanned) {
      toast.error("Cuenta suspendida");
    }
  };

  let label = "+";
  if (isRestricted) label = "⚠";
  if (isBanned) label = "🚫";
  if (isGuest) label = "🔒";

  return (
    <>
      <div className={`fixed bottom-6 left-6 z-[5000] flex items-center gap-4 ${className || ""}`}>
        <button
          onClick={handleClick}
          className={`w-14 h-14 rounded-full flex shrink-0 items-center justify-center text-2xl shadow-lg transition-all cursor-pointer
          ${
            isActive
              ? "bg-green-600 text-white hover:bg-green-700"
              : user && status === "active"
                ? "bg-green-900/100 text-white hover:bg-green-800"
                : "bg-gray-300 text-gray-600 hover:bg-gray-400"
          }`}
          title={
            isActive
              ? "Crear reporte"
              : isGuest
                ? "Inicia sesión para reportar"
                : isRestricted
                  ? "Tu cuenta está restringida"
                  : "Cuenta suspendida"
          }
        >
          {label}
        </button>
        {showTooltip && (isActive || isGuest) && (
          <div
            onClick={handleClick}
            className="relative bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-2xl cursor-pointer whitespace-nowrap animate-bounce select-none"
          >
            Crea tu reporte aquí ✨
            <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-gray-900 transform -translate-y-1/2 rotate-45 rounded-sm"></div>
          </div>
        )}
      </div>
      {/* <CreateReportModal
        // open={openModal}
        onClose={() => setOpenModal(false)}
        latitude={position ? position[0] : null}
        longitude={position ? position[1] : null}
        onAdjustLocation={() => {
          setOpenModal(false);
          setSelectingLocation(true);
        }}
      /> */}
    </>
  );
}
