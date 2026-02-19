"use client";

import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-toastify";

interface Props {
  open: boolean;
  onClose: () => void;
  latitude: number | null;
  longitude: number | null;
  onAdjustLocation: () => void;
}

const formatPrice = (value: string) => {
  if (!value) return "";
  const cleanVal = value.replace(/\D/g, "");
  if (!cleanVal) return "";
  const formatted = new Intl.NumberFormat("es-MX").format(parseInt(cleanVal));
  return `$${formatted}`;
};

export default function CreateReportModal({
  open,
  onClose,
  latitude,
  longitude,
  onAdjustLocation,
}: Props) {
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [phoneError, setPhoneError] = useState(false);

  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!isValid) {
      toast.warning("Agrega al menos precio, teléfono, descripción o foto");
      return;
    }

    // Validar teléfono solo si se ha ingresado algo
    if (phone.trim() !== "" && phone.length !== 10) {
      toast.error("Se necesita un teléfono válido (10 dígitos)");
      return;
    }

    if (!user || !latitude || !longitude) {
      toast.error("Error inesperado");
      return;
    }

    try {
      const now = new Date();
      const expires = new Date();
      expires.setDate(now.getDate() + 14);

      await addDoc(collection(db, "reports"), {
        createdAt: now.toISOString(),
        createdBy: user.uid,
        location: {
          lat: latitude,
          lng: longitude,
        },
        price: price || null,
        phone: phone || null,
        description: description || null,
        imageUrl: null,
        status: "active",
        confirmations: 0,
        possibleFraudVotes: 0,
        fraudVotes: 0,
        expiresAt: expires.toISOString(),
      });

      toast.success("Reporte publicado");

      onClose();

      // reset form
      setPrice("");
      setPhone("");
      setDescription("");
      setImage(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al publicar reporte");
    }
  };

  const hasValidPhone = phone.trim() !== "" && phone.length === 10;

  const isValid =
    price.trim() !== "" ||
    description.trim() !== "" ||
    image !== null ||
    hasValidPhone;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/50">
      <div className="bg-white w-[95%] max-w-md rounded-xl p-6 shadow-xl">
        <h2 className="text-lg text-gray-700 font-semibold mb-4">
          Nuevo reporte
        </h2>
        {latitude && longitude && (
          <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center text-center gap-2 text-sm text-gray-700">
              <span>📍</span>
              <span className="font-medium">Usando tu ubicación actual</span>
            </div>

            <div className="text-xs text-center text-gray-400 mt-1">
              Lat: {latitude.toFixed(5)} | Lng: {longitude.toFixed(5)}
            </div>
          </div>
        )}
        <button
          onClick={onAdjustLocation}
          className="text-xs text-blue-600 hover:underline mt-2"
        >
          Ajustar ubicación en el mapa
        </button>
        <div className="flex flex-col gap-3">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Precio (opcional)"
              value={price}
              onChange={(e) => setPrice(formatPrice(e.target.value))}
              className="w-full border border-gray-200 rounded-lg pl-3 pr-12 py-2 text-gray-700 outline-none focus:border-gray-800 transition-all font-light"
            />
            {price && (
              <span className="absolute right-3 text-xs text-gray-400 font-medium">
                MXN
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <input
              type="text"
              placeholder="Teléfono (opcional)"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 10) {
                  setPhone(val);
                  if (val.length === 10 || val.length === 0)
                    setPhoneError(false);
                }
              }}
              onBlur={() => {
                if (phone.length > 0 && phone.length !== 10) {
                  setPhoneError(true);
                } else {
                  setPhoneError(false);
                }
              }}
              className={`border rounded-lg px-3 py-2 text-gray-700 outline-none transition-all font-light ${
                phoneError
                  ? "border-red-500 focus:border-red-600"
                  : "border-gray-200 focus:border-gray-800"
              }`}
            />
            {phoneError && (
              <span className="text-xs text-red-500 px-1">
                El teléfono debe tener 10 dígitos
              </span>
            )}
          </div>

          <textarea
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-gray-800 transition-all min-h-[100px] font-light"
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-700 font-medium">
              Foto del letrero
            </label>

            <div
              onClick={() => document.getElementById("file-input")?.click()}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
                ${
                  image
                    ? "border-green-200 bg-green-50/30"
                    : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                }`}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImage(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {image ? (
                <div className="relative w-full flex flex-col items-center gap-2">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg shadow-sm"
                  />
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-600 font-medium">
                      ✓ Imagen lista
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      (Quitar)
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                    📸
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 font-medium">
                      Haz clic para subir foto
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Aumenta la confianza del reporte
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="px-4 py-2 rounded-lg bg-black text-white border border-transparent hover:bg-gray-800 transition-all cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
