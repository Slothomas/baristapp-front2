import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { getUserMock } from "../../api/auth";
import { useToast } from "../../components/Toast";
// --- 1. Importaciones correctas ---
import { createJobOffer } from "../../api/jobOffer";
import type { JobType } from "../../api/jobOffer";
import { useNavigate } from "react-router-dom";

export default function PostJob() {
  const u = getUserMock();
  const toast = useToast();
  const nav = useNavigate();

  // --- 2. Ajustamos el estado a lo que pide el backend ---
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState(""); // <-- CAMPO AÑADIDO (Requerido por backend)
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<JobType>("full_time"); // <-- CAMPO AÑADIDO (Requerido por backend)

  const [salaryRange, setSalaryRange] = useState(""); // <-- CAMPO MODIFICADO (es string, no número)
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  // (Guardamos las fechas para ponerlas en la descripción)
  const [startISO, setStartISO] = useState("");
  const [endISO, setEndISO] = useState("");

  const [isSending, setIsSending] = useState(false); // Para el feedback del botón

  // --- 3. Actualizamos la función onSubmit ---
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!u) return toast.push("Debes iniciar sesión");

    //
    // Activamos la validación de rol. Asumimos que "cafe" y "academy"
    // son los únicos que pueden publicar.
    if (u.role === "cafe") {
      return toast.push("Solo las cafeterías o academias pueden publicar");
    }

    // Validamos los campos nuevos
    if (!title || !company || !location || !jobType) {
      return toast.push("Completa los campos obligatorios (*)");
    }

    setIsSending(true);

    try {
      // "Hack": Como el backend no tiene campos de fecha, los ponemos en la descripción
      const fullDescription = `
${description}

---
Información Adicional del Turno:
Inicio: ${startISO || "No especificado"}
Fin: ${endISO || "No especificado"}
      `.trim();

      // Este es el objeto que el backend (tu compañero) espera
      const payload = {
        title: title,
        company: company,
        location: location,
        job_type: jobType,
        description: fullDescription,
        salary_range: salaryRange || null,
        requirements: requirements || null,
      };

      // Llamamos a la API real
      await createJobOffer(payload, u.id); // u.id es el user_id del Query Param

      toast.push("Vacante publicada exitosamente");
      nav("/app/jobs"); // O a la página de lista de ofertas
    } catch (err: any) {
      console.error("Error publicando la vacante:", err);
      toast.push(err.message || "No se pudo publicar la vacante.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Publicar vacante</h1>
      {/* El JSX del <form> se queda exactamente igual que en tu versión */}
      <form onSubmit={onSubmit} className="grid gap-3 max-w-2xl">
        <Input
          label="Título*"
          placeholder="Barista turno mañana"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* --- 4. AÑADIMOS LOS CAMPOS NUEVOS AL FORMULARIO --- */}
        <Input
          label="Nombre de la Cafetería/Restaurante*"
          placeholder="Starbucks Co."
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />

        <Input
          label="Ubicación*"
          placeholder="Providencia"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />

        <label className="block space-y-1">
          <span className="text-sm text-gray-700">Tipo de Trabajo*</span>
          <select
            className="w-full border rounded-lg p-2"
            value={jobType}
            onChange={(e) => setJobType(e.target.value as JobType)}
            required
          >
            <option value="full_time">Tiempo Completo</option>
            <option value="part_time">Medio Tiempo</option>
            <option value="replacement">Reemplazo</option>
            <option value="urgent">Urgente</option>
          </select>
        </label>

        {/* --- Fin de campos nuevos --- */}

        <div className="grid md:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm text-gray-700">
              Inicio del Turno (Opcional)
            </span>
            <input
              type="datetime-local"
              className="w-full border rounded-lg p-2"
              value={startISO}
              onChange={(e) => setStartISO(e.target.value)}
              // Ya no es requerido
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-gray-700">
              Fin del Turno (Opcional)
            </span>
            <input
              type="datetime-local"
              className="w-full border rounded-lg p-2"
              value={endISO}
              onChange={(e) => setEndISO(e.target.value)}
              // Ya no es requerido
            />
          </label>
        </div>

        <label className="block space-y-1">
          {/* --- 5. CAMBIAMOS EL INPUT DE PAGO A "salary_range" --- */}
          <span className="text-sm text-gray-700">
            Rango Salarial (Opcional)
          </span>
          <input
            type="text" // Cambiado a texto
            className="w-full border rounded-lg p-2"
            placeholder="Ej: $500.000 - $600.000 CLP"
            value={salaryRange}
            onChange={(e) => setSalaryRange(e.target.value)}
            // Ya no es requerido
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-gray-700">
            Descripción (Obligatorio)
          </span>
          <textarea
            rows={4}
            className="w-full border rounded-lg p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tareas del turno, dress code, caja/espresso, etc."
            required // <-- Lo hacemos requerido
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-gray-700">Requisitos (Opcional)</span>
          <textarea
            rows={3}
            className="w-full border rounded-lg p-2"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Certificados deseables, experiencia mínima..."
          />
        </label>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSending}>
            {isSending ? "Publicando..." : "Publicar"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => nav(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}