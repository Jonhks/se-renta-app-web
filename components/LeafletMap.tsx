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

interface Report {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  price?: string | null;
  phone?: string | null;
  description?: string | null;
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

  const { user } = useAuth();

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
      where("expiresAt", ">", now),
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

      // 🔥 Actualizar lista completa
      const data: Report[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Report, "id">),
      }));

      setReports(data);
    });

    return () => unsubscribe();
  }, []);

  // Fix icono default
  const BlackIcon = L.divIcon({
    html: `
    <div style="
      width: 16px;
      height: 16px;
      background: black;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 0 2px black;
    "></div>
  `,
    className: "",
    iconSize: [16, 16],
  });

  const GrayIcon = L.divIcon({
    html: `
    <div style="
      width: 16px;
      height: 16px;
      background: #6b7280;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 0 2px #6b7280;
    "></div>
  `,
    className: "",
    iconSize: [16, 16],
  });
  const GreenIcon = L.divIcon({
    html: `
    <div style="
      width: 16px;
      height: 16px;
      background: #16a34a;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 0 2px #16a34a;
    "></div>
  `,
    className: "",
    iconSize: [16, 16],
  });

  const YellowIcon = L.divIcon({
    html: `
    <div style="
      width: 16px;
      height: 16px;
      background: #eab308;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 0 2px #eab308;
    "></div>
  `,
    className: "",
    iconSize: [16, 16],
  });

  const RedIcon = L.divIcon({
    html: `
    <div style="
      width: 16px;
      height: 16px;
      background: #dc2626;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 0 2px #dc2626;
    "></div>
  `,
    className: "",
    iconSize: [16, 16],
  });

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
            <Marker position={position} />
            <Circle
              center={position}
              radius={50}
              pathOptions={{ color: "black", fillOpacity: 0.2 }}
            />
          </>
        )}

        {reports.map((report) => {
          const dominant = getDominant(report);
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
              <Popup>
                {user && report.createdBy === user.uid && (
                  <div className="w-full flex justify-end">
                    <button
                      onClick={() => {
                        setEditingReport(report);
                        setOpenModal(true);
                      }}
                      className="mt-2 px-3 py-1 bg-transparent text-white rounded text-xs hover:cursor-pointer hover:opacity-100"
                    >
                      ✏️ Editar
                    </button>
                  </div>
                )}
                <div className="flex flex-col gap-1 text-sm">
                  {report.phone && (
                    <a
                      href={`tel:${report.phone}`}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-black hover:bg-gray-800 transition-colors text-white rounded-lg text-sm font-medium no-underline"
                    >
                      📞 Llamar {report.phone}
                    </a>
                  )}
                  {report.price && (
                    <div className="font-semibold">Renta: {report.price}</div>
                  )}
                  {report.description && <div>{report.description}</div>}

                  <div className="mt-3 flex flex-col gap-2">
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
      <button
        onClick={handleLocate}
        className="fixed bottom-6 right-6 z-[5000] bg-black text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors cursor-pointer"
      >
        📍 Usar mi ubicación
      </button>
      <CreateReportButton
        position={position}
        setPosition={setPosition}
        setSelectingLocation={setSelectingLocation}
        setOpenModal={setOpenModal}
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
      {selectingLocation && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[6000] bg-black text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Haz clic en el mapa para colocar el reporte
        </div>
      )}
    </div>
  );
}
