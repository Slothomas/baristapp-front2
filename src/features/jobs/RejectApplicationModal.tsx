import { useState } from "react";
import Button from "../../components/Button";
import type { RejectionReason } from "../../api/jobApplication";

const REASONS: { value: RejectionReason; label: string }[] = [
  { value: "NO_CUMPLE_REQUISITOS", label: "No cumple requisitos" },
  { value: "YA_CUBRIMOS_VACANTES", label: "Vacantes ya cubiertas" },
  { value: "NO_DISPONIBILIDAD_HORARIA", label: "No disponibilidad horaria" },
  { value: "EXPERIENCIA_INSUFICIENTE", label: "Experiencia insuficiente" },
  { value: "OTRO", label: "Otro" },
];

export default function RejectApplicationModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: RejectionReason, note?: string) => void;
  loading?: boolean;
}) {
  const [reason, setReason] = useState<RejectionReason>("NO_CUMPLE_REQUISITOS");
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-4 w-full max-w-md shadow-soft">
        <h3 className="text-lg font-semibold mb-3">Rechazar postulante</h3>

        <label className="text-sm font-medium">Motivo *</label>
        <select
          className="w-full border rounded-xl p-2 mt-1 mb-3"
          value={reason}
          onChange={(e) => setReason(e.target.value as RejectionReason)}
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <label className="text-sm font-medium">Comentario (opcional)</label>
        <textarea
          className="w-full border rounded-xl p-2 mt-1 mb-4"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej: Te falta experiencia en cafeterías de alto flujo..."
        />

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(reason, note.trim() || undefined)}
            disabled={loading}
          >
            Confirmar rechazo
          </Button>
        </div>
      </div>
    </div>
  );
}
