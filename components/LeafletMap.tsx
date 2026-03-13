"use client";

import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import CreateReportButton from "./CreateReportButton";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import CreateReportModal from "./CreateReportModal";
import VoteButtons from "./VoteButtons";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/AuthContext";
import { events } from "@/lib/events";
import DirectionsModal from "./DirectionsModal";

interface Report {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  price?: string | null;
  phone?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  creatorPhotoUrl?: string | null;
  createdAt: string;
  confirmations: number;
  possibleFraudVotes: number;
  fraudVotes: number;
  inactiveVotes?: number;
  status: string;
  expiresAt: string;
  createdBy: string;
}

function RecenterMap({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 16);
    }
  }, [position, map]);
  return null;
}

function MapClickHandler({
  selectingLocation,
  setPosition,
  setSelectingLocation,
  setOpenModal,
}: {
  selectingLocation: boolean;
  setPosition: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  setSelectingLocation: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    // Cambiar cursor dinámicamente
    if (selectingLocation) {
      container.style.cursor = "crosshair";
    } else {
      container.style.cursor = "";
    }

    if (!selectingLocation) return;

    const handleClick = (e: any) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setSelectingLocation(false);
      setOpenModal(true);
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
      container.style.cursor = "";
    };
  }, [selectingLocation, map, setPosition, setSelectingLocation, setOpenModal]);
  return null;
}

function getDominant(report: Report) {
  if ((report.fraudVotes ?? 0) >= 3) return "fraud";
  if ((report.inactiveVotes ?? 0) >= 2) return "inactive";

  const max = Math.max(
    report.confirmations ?? 0,
    report.possibleFraudVotes ?? 0,
    report.fraudVotes ?? 0,
    report.inactiveVotes ?? 0,
  );

  if (max === (report.confirmations ?? 0)) return "confirm";
  if (max === (report.possibleFraudVotes ?? 0)) return "possible";
  if (max === (report.inactiveVotes ?? 0)) return "inactive";
  if (max === (report.fraudVotes ?? 0)) return "fraud";

  return "neutral";
}

export default function LeafletMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectingLocation, setSelectingLocation] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [previousInactiveVotes, setPreviousInactiveVotes] = useState<
    Record<string, number>
  >({});
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [navTarget, setNavTarget] = useState<{ lat: number; lng: number } | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    const handleLocateEvent = () => {
      handleLocate();
    };
    const handleCreateEvent = () => {
      setOpenModal(true);
    };

    events.on("locate", handleLocateEvent);
    events.on("createReport", handleCreateEvent);

    return () => {
      events.off("locate", handleLocateEvent);
      events.off("createReport", handleCreateEvent);
    };
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
      },
      () => {
        alert("No pudimos obtener tu ubicación");
      },
    );
  };

  useEffect(() => {
    const now = new Date().toISOString();

    const q = query(
      collection(db, "reports"),
      where("status", "==", "active"),
      // Removido expiresAt de la query para evitar problemas de indices faltantes
      // Se filtrará en cliente para garantizar que sean visibles universalmente.
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 🔥 Detectar SOLO cambios reales
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const data = change.doc.data() as Report;
          const inactiveVotes = data.inactiveVotes ?? 0;

          if (inactiveVotes === 2) {
            toast.info(
              "Este reporte fue marcado como probablemente no disponible",
            );
          }
        }
      });

      // 🔥 Actualizar lista completa con validación de fecha en memoria local
      const data: Report[] = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Report, "id">),
        }))
        .filter((report) => report.expiresAt > now);

      setReports(data);
    });

    return () => unsubscribe();
  }, []);

  // Helper para crear icono de pin "Se Renta" con color
  const seRentaPin = (color: string) =>
    L.divIcon({
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="32" height="32" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,.35))">
        <path d="M32 2C20 2 10 12 10 24c0 14 22 38 22 38s22-24 22-38C54 12 44 2 32 2z" fill="${color}"/>
        <circle cx="32" cy="24" r="14" fill="${color}"/>
        <path d="M24 26 L32 20 L40 26 V36 H34 V30 H30 V36 H24 Z" fill="#fff"/>
      </svg>`,
      className: "",
      iconSize: [32, 38],
      iconAnchor: [16, 38],
      popupAnchor: [0, -40],
    });

  const BlackIcon = seRentaPin("#111");
  const GrayIcon = seRentaPin("#6b7280");
  const GreenIcon = seRentaPin("#16a34a");
  const YellowIcon = seRentaPin("#eab308");
  const RedIcon = seRentaPin("#dc2626");

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[19.4326, -99.1332]}
        zoom={12}
        scrollWheelZoom
        className={`w-full h-full`}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap position={position} />

        {position && (
          <>
            <Marker
              position={position}
              icon={L.divIcon({
                html: `<div style="
                  width:16px;height:16px;
                  background:#2563eb;
                  border:3px solid white;
                  border-radius:50%;
                  box-shadow:0 0 0 3px rgba(37,99,235,0.3);
                "></div>`,
                className: "",
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            />
            <Circle
              center={position}
              radius={50}
              pathOptions={{
                color: "#2563eb",
                fillColor: "#2563eb",
                fillOpacity: 0.1,
                weight: 1,
              }}
            />
          </>
        )}

        {reports.map((report) => {
          const dominant = getDominant(report);

          // Calcular días restantes y formato de fecha
          const createdDate = new Date(report.createdAt);
          const formattedDate = createdDate.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const expiresDate = new Date(report.expiresAt);
          const daysRemaining = Math.max(
            0,
            Math.ceil(
              (expiresDate.getTime() - new Date().getTime()) /
                (1000 * 3600 * 24),
            ),
          );

          return (
            <Marker
              key={report.id}
              position={[report.location.lat, report.location.lng]}
              icon={
                dominant === "fraud"
                  ? RedIcon
                  : dominant === "inactive"
                    ? GrayIcon
                    : dominant === "confirm"
                      ? GreenIcon
                      : dominant === "possible"
                        ? YellowIcon
                        : BlackIcon
              }
            >
              <Popup className="se-renta-popup">
                <div className="w-full relative">
                  {/* Header: Avatar + Título/Opciones */}
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                      {report.creatorPhotoUrl ? (
                        <img
                          src={report.creatorPhotoUrl}
                          alt="creador"
                          className="w-6 h-6 rounded-full border border-gray-200 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold border border-gray-300">
                          👤
                        </div>
                      )}
                      <span className="text-xs text-gray-500 font-medium">
                        Publicado el {formattedDate}
                      </span>
                    </div>

                    {user && report.createdBy === user.uid && (
                      <button
                        onClick={() => {
                          setEditingReport(report);
                          setOpenModal(true);
                        }}
                        className="p-1 bg-gray-100 text-gray-600 hover:bg-black hover:text-white rounded transition-colors text-xs"
                        title="Editar"
                      >
                        ✏️
                      </button>
                    )}
                  </div>

                  {report.imageUrl && (
                    <div className="w-full h-32 mb-3 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                      <img
                        src={report.imageUrl}
                        alt="Lugar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 text-sm">
                    {report.phone && (
                      <a
                        href={`tel:${report.phone}`}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-black hover:bg-gray-800 transition-colors !text-white rounded-lg text-sm font-medium no-underline"
                      >
                        📞 Llamar {report.phone}
                      </a>
                    )}
                    {report.price && (
                      <div className="font-semibold text-gray-800 bg-gray-50 py-1.5 px-2 rounded border border-gray-100">
                        Renta:{" "}
                        <span className="text-black">{report.price}</span>
                      </div>
                    )}
                    {report.description && (
                      <div className="text-gray-600 text-xs mt-1 leading-relaxed border-l-2 border-gray-200 pl-2 py-1">
                        {report.description}
                      </div>
                    )}

                    <div className="flex flex-col gap-2 mt-2">
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setNavTarget({ lat: report.location.lat, lng: report.location.lng });
                         }}
                         className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 transition-colors !text-white rounded-lg text-sm font-medium"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                         Cómo llegar
                       </button>
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100 pb-1 mb-1">
                        <span>Validación Comunitaria</span>
                        <span
                          className={daysRemaining <= 3 ? "text-red-500" : ""}
                        >
                          ⏱ {daysRemaining}{" "}
                          {daysRemaining === 1 ? "día" : "días"} activo
                        </span>
                      </div>
                      <VoteButtons
                        reportId={report.id}
                        counts={{
                          confirmations: report.confirmations ?? 0,
                          inactiveVotes: report.inactiveVotes ?? 0,
                          possibleFraudVotes: report.possibleFraudVotes ?? 0,
                          fraudVotes: report.fraudVotes ?? 0,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        <MapClickHandler
          selectingLocation={selectingLocation}
          setPosition={setPosition}
          setSelectingLocation={setSelectingLocation}
          setOpenModal={setOpenModal}
        />
      </MapContainer>
      <CreateReportButton
        position={position}
        setPosition={setPosition}
        setSelectingLocation={setSelectingLocation}
        setOpenModal={setOpenModal}
        className="hidden md:flex" 
      />
      <CreateReportModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditingReport(null);
        }}
        latitude={position ? position[0] : null}
        longitude={position ? position[1] : null}
        onAdjustLocation={() => {
          setOpenModal(false);
          setSelectingLocation(true);
        }}
        mode={editingReport ? "edit" : "create"}
        reportData={editingReport || undefined}
        reportId={editingReport?.id}
      />

      <DirectionsModal
        open={!!navTarget}
        onClose={() => setNavTarget(null)}
        lat={navTarget?.lat ?? 0}
        lng={navTarget?.lng ?? 0}
      />

      {selectingLocation && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[6000] bg-black text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Haz clic en el mapa para colocar el reporte
        </div>
      )}
    </div>
  );
}
