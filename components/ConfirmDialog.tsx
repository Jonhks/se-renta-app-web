"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  showInput?: boolean;
  inputPlaceholder?: string;
  inputValue?: string;
  onInputChange?: (val: string) => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  showInput = false,
  inputPlaceholder = "Escribe un motivo...",
  inputValue = "",
  onInputChange,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm shadow-xl">
        <h2 className="text-lg text-gray-700 font-semibold mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}

        {showInput && (
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-base text-gray-700 mb-4 focus:outline-none focus:border-black min-h-[100px]"
            placeholder={inputPlaceholder}
            value={inputValue}
            onChange={(e) => onInputChange?.(e.target.value)}
          />
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
            disabled={showInput && !inputValue.trim()}
            className="px-4 py-2 rounded-lg bg-black text-white border border-transparent hover:bg-gray-400 hover:text-white hover:border-black transition-all cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
