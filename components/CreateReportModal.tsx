"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-toastify";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Report {
  id: string;
  price?: string | null;
  phone?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  creatorPhotoUrl?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  latitude: number | null;
  longitude: number | null;
  onAdjustLocation: () => void;
  mode?: "create" | "edit";
  reportData?: Report;
  reportId?: string;
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
  mode = "create",
  reportData,
  reportId,
}: Props) {
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { user } = useAuth();

  // 🔥 Precargar datos si es edición
  useEffect(() => {
    if (mode === "edit" && reportData) {
      setPrice(reportData.price || "");
      setDescription(reportData.description || "");
      setPhone(reportData.phone || "");
    }
  }, [mode, reportData]);

  const handleSubmit = async () => {
    const hasValidPhone = phone.trim() !== "" && phone.length === 10;

    const isValid =
      price.trim() !== "" ||
      description.trim() !== "" ||
      image !== null ||
      hasValidPhone;

    if (!isValid) {
      toast.warning("Agrega al menos precio, teléfono, descripción o foto");
      return;
    }

    // 🔥 MODO EDICIÓN
    if (mode === "edit" && reportId) {
      try {
        await updateDoc(doc(db, "reports", reportId), {
          price: price || null,
          description: description || null,
          phone: phone || null,
          updatedAt: new Date().toISOString(),
        });

        toast.success("Reporte actualizado");
        onClose();
        return;
      } catch (error) {
        console.error(error);
        toast.error("Error al actualizar reporte");
        return;
      }
    }

    // 🔥 Validar teléfono solo si se ha ingresado algo
    if (phone.trim() !== "" && phone.length !== 10) {
      toast.error("Se necesita un teléfono válido (10 dígitos)");
      return;
    }

    if (!user || !latitude || !longitude) {
      toast.error("Error inesperado");
      return;
    }

    setIsUploading(true);

    let uploadedImageUrl = null;

    if (image && mode === "create") {
      try {
        const imageRef = ref(storage, `reports/${Date.now()}-${user.uid}`);
        await uploadBytes(imageRef, image);
        uploadedImageUrl = await getDownloadURL(imageRef);
      } catch (uploadError) {
        console.error("Error al subir imagen:", uploadError);
        toast.warning(
          "No se pudo guardar la imagen (Firebase Storage sin configurar). El reporte se publicará sin foto.",
        );
      }
    }

    try {
      const now = new Date();
      const expires = new Date();
      expires.setDate(now.getDate() + 14);

      await addDoc(collection(db, "reports"), {
        createdAt: now.toISOString(),
        createdBy: user.uid,
        creatorPhotoUrl: user.photoURL || null,
        location: {
          lat: latitude,
          lng: longitude,
        },
        price: price || null,
        phone: phone || null,
        description: description || null,
        imageUrl: uploadedImageUrl,
        status: "active",
        confirmations: 0,
        possibleFraudVotes: 0,
        fraudVotes: 0,
        inactiveVotes: 0,
        expiresAt: expires.toISOString(),
      });

      toast.success("Reporte publicado");

      onClose();

      // reset form
      setPrice("");
      setPhone("");
      setDescription("");
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al publicar reporte");
    } finally {
      setIsUploading(false);
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
          {mode === "edit" ? "Editar reporte" : "Nuevo reporte"}
        </h2>

        {latitude && longitude && mode === "create" && (
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

        {mode === "create" && (
          <button
            onClick={onAdjustLocation}
            className="text-xs text-blue-600 hover:underline mt-2"
          >
            Ajustar ubicación en el mapa
          </button>
        )}

        <div className="flex flex-col gap-3 mt-3">
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

          {mode === "create" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600 font-medium">
                Foto (opcional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImage(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-gray-50 file:text-black
                    hover:file:bg-gray-100 cursor-pointer"
                />
              </div>
              {imagePreview && (
                <div className="relative mt-2 w-full h-32 rounded-lg overflow-hidden border border-gray-200 group">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}
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
            disabled={!isValid || isUploading}
            className="px-4 py-2 rounded-lg bg-black text-white border border-transparent hover:bg-gray-800 transition-all cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading
              ? "Publicando..."
              : mode === "edit"
                ? "Guardar cambios"
                : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
