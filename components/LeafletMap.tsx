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
    };
  }, [selectingLocation, map, setPosition, setSelectingLocation, setOpenModal]);
  return null;
}

export default function LeafletMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [selectingLocation, setSelectingLocation] = useState(false);
  const [openModal, setOpenModal] = useState(false);

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
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[19.4326, -99.1332]}
        zoom={12}
        scrollWheelZoom
        className="w-full h-full"
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
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.location.lat, report.location.lng]}
            icon={BlackIcon}
          >
            <Popup>
              <div className="flex flex-col gap-1 text-sm">
                {report.price && (
                  <div className="font-semibold">{report.price}</div>
                )}

                {report.description && <div>{report.description}</div>}

                {report.phone && (
                  <div className="text-blue-600">📞 {report.phone}</div>
                )}

                <div className="text-xs text-gray-400">
                  Confirmaciones: {report.confirmations}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
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
        onClose={() => setOpenModal(false)}
        latitude={position ? position[0] : null}
        longitude={position ? position[1] : null}
        onAdjustLocation={() => {
          setOpenModal(false);
          setSelectingLocation(true);
        }}
      />
    </div>
  );
}
