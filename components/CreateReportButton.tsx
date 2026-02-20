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
}: {
  position: [number, number] | null;
  setPosition: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  setSelectingLocation: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>("active");
  const hasLocation = !!position;

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
      <button
        onClick={handleClick}
        className={`fixed bottom-6 left-6 z-[5000] w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all cursor-pointer
        ${
          isActive
            ? "bg-black text-white hover:bg-gray-800"
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
