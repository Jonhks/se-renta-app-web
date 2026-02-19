"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm shadow-xl">
        <h2 className="text-lg text-gray-700 font-semibold mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border text-gray-400 hover:bg-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-black text-white border border-transparent hover:bg-gray-400 hover:text-white hover:border-black transition-all cursor-pointer"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
