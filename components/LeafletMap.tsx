"use client";

import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function LocateControl({
  setPosition,
}: {
  setPosition: (pos: [number, number]) => void;
}) {
  const map = useMap();

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        const coords: [number, number] = [latitude, longitude];

        map.setView(coords, 16);
        setPosition(coords);
      },
      () => {
        alert("No pudimos obtener tu ubicación");
      }
    );
  };

  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-6 right-6 z-[1000] bg-black text-white px-4 py-2 rounded-lg shadow-lg"
    >
      📍 Usar mi ubicación
    </button>
  );
}

export default function LeafletMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);

  // Arreglar icono default de Leaflet
  const DefaultIcon = L.icon({
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  L.Marker.prototype.options.icon = DefaultIcon;

  return (
    <div className="relative w-full h-screen">
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

        <LocateControl setPosition={setPosition} />

        {position && (
          <>
            <Marker position={position} />
            <Circle
              center={position}
              radius={50}
              pathOptions={{ color: "blue", fillOpacity: 0.2 }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}