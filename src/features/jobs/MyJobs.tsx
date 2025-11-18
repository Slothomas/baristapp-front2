// src/features/jobs/MyJobs.tsx
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { getUserMock } from "../../api/auth";
import { useToast } from "../../components/Toast";
import { Link } from "react-router-dom"; // <-- 1. Importa Link
import { useEffect, useState } from "react";

// --- 2. Importa las funciones reales de la API ---
import {
  getJobsByRestaurant,
  deleteJobOffer,
  updateJobOffer,
  type JobOffer,
} from "../../api/jobOffer";
// --- (Quitamos 'jobsStore' y 'applyStore') ---


export default function MyJobs() {
  const u = getUserMock();
  const toast = useToast();
  
  // --- 3. El estado ahora usa la interfaz real 'JobOffer' ---
  const [list, setList] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 4. Carga los datos reales al montar ---
  useEffect(() => {
    if (u && (u.role === "cafe" || u.role === "academy")) {
      setLoading(true);
      getJobsByRestaurant(u.id)
        .then(setList)
        .catch((err) =>
          toast.push(err.message || "No se pudo cargar tus ofertas")
        )
        .finally(() => setLoading(false));
    }
  }, [u, toast]);

  // --- 5. Lógica para Ocultar/Mostrar (UPDATE) ---
  const handleToggleActive = async (job: JobOffer) => {
    const newStatus = job.is_active ? 0 : 1; // Invierte el estado
    const actionText = newStatus ? "mostrada" : "ocultada";

    try {
      await updateJobOffer(job.id, { is_active: newStatus });
      // Actualiza la lista localmente
      setList(list.map((j) =>
        j.id === job.id ? { ...j, is_active: newStatus } : j
      ));
      toast.push(`Vacante ${actionText}.`);
    } catch (err: any) {
      toast.push(err.message || "No se pudo actualizar la vacante.");
    }
  };

  // --- 6. Lógica para Eliminar (DELETE) ---
  const handleDelete = async (job: JobOffer) => {
    if (!window.confirm(`¿Seguro que quieres eliminar "${job.title}"?`)) {
      return;
    }

    try {
      await deleteJobOffer(job.id); // Llama al soft delete
      // Actualiza la lista localmente (la quitamos)
      setList(list.filter((j) => j.id !== job.id));
      toast.push("Vacante eliminada.");
    } catch (err: any) {
      toast.push(err.message || "No se pudo eliminar la vacante.");
    }
  };

  // --- 7. Verificación de Rol ---
  if (!u) {
    return (
      <AppLayout>
        <Card className="p-6">Inicia sesión</Card>
      </AppLayout>
    );
  }
  if (u.role !== "cafe" && u.role !== "academy") {
    return (
      <AppLayout>
        <Card className="p-6">Solo cafeterías y academias pueden ver esta página.</Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Mis vacantes</h1>

      {loading ? (
         <Card className="p-6 text-sm text-gray-700">Cargando...</Card>
      ) : list.length === 0 ? (
        <Card className="p-6 text-sm text-gray-700">
          Aún no has publicado vacantes. Ve a <b>Publicar</b> para crear una.
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.map((j) => (
            <Card key={j.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{j.title}</div>
                <div className="text-sm text-gray-600">{j.location}</div>
                <div className="text-xs mt-1">
                  Estado: <b>{j.is_active ? "Visible" : "Oculta"}</b>
                  {/* (Quitamos el 'count' de postulantes por ahora) */}
                </div>
              </div>

              <div className="flex gap-2">
                {/* --- 8. Usamos <Link> de React Router --- */}
                <Link
                  to={`/app/jobs/${j.id}/applications`}
                  className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  Ver postulantes
                </Link>

                <Button
                  variant="secondary"
                  onClick={() => handleToggleActive(j)}
                >
                  {j.is_active ? "Ocultar" : "Mostrar"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => handleDelete(j)}
                >
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}