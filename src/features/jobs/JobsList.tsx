// src/features/jobs/jobslist.tsx
import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useToast } from "../../components/Toast";
import { getUserMock } from "../../api/auth";
import { getAllJobOffers, type JobOffer, type JobType } from "../../api/jobOffer";
import { applyToJob, getMyApplications, type MyApplication } from "../../api/jobApplication";


// --- 2. ¡Tu idea! Un helper para las imágenes ---
// (Guarda estas imágenes de ejemplo en tu carpeta /public/images/)
function getJobTypeImage(jobType: JobType): string {
  switch (jobType) {
    case "full_time":
      return "/images/job-full-time.jpg"; // Imagen genérica para full time
    case "part_time":
      return "/images/job-part-time.jpg"; // Imagen para part time
    case "replacement":
      return "/images/job-replacement.jpg"; // Imagen para reemplazo
    case "urgent":
      return "/images/job-urgent.jpg"; // Imagen para urgente
    default:
      return "/images/job-default.jpg"; // Una imagen por defecto
  }
}

// Función para formatear el estado (para "Mis Postulaciones")
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Pendiente",
    reviewed: "En Revisión",
    accepted: "Aceptado",
    rejected: "Rechazado",
  };
  return statusMap[status] || status;
}

export default function JobsList() {
  const u = getUserMock();
  const toast = useToast();
  
  // --- 3. Dos estados: uno para ofertas, uno para mis postulaciones ---
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [applying, setApplying] = useState<Record<number, boolean>>({}); // Para deshabilitar botones

  // --- 4. Cargamos AMBAS listas desde el backend ---
  useEffect(() => {
    // A. Cargar todas las vacantes
    async function fetchJobs() {
      setLoadingOffers(true);
      try {
        const jobOffers = await getAllJobOffers();
        setOffers(jobOffers);
      } catch (err: any) {
        toast.push(err.message || "No se pudo cargar las vacantes.");
      } finally {
        setLoadingOffers(false);
      }
    }

    // B. Cargar mis postulaciones (solo si soy barista)
    async function fetchMyApplications() {
      // **ARREGLO PARA 'u is possibly null'**
      // Primero, revisa si el usuario existe (no es null)
      // y LUEGO revisa su rol.
      if (u && u.role === "barista") {
        setLoadingApps(true);
        try {
          // 'u.id' ahora es seguro de usar
          const apps = await getMyApplications(u.id);
          setMyApplications(apps);
        } catch (err: any) {
          toast.push(err.message || "No se pudo cargar tus postulaciones.");
        } finally {
          setLoadingApps(false);
        }
      } else {
        // Si no hay usuario o no es barista, no hagas nada.
        setLoadingApps(false);
      }
    }

    fetchJobs();
    fetchMyApplications();
  }, [u, toast]); // El 'u' aquí es la dependencia correcta

  // --- 5. Lógica de postulación real ---
  async function apply(job: JobOffer) {
    if (!u) return toast.push("Debes iniciar sesión para postular");

    setApplying((prev) => ({ ...prev, [job.id]: true }));
    try {
      await applyToJob(
        {
          job_offer_id: job.id,
          // (Opcional) Podríamos abrir un modal para pedir una cover_letter
        },
        u.id
      );

      toast.push("¡Postulación enviada con éxito!");

    } catch (err: any) {
      console.error("Error al postular:", err);
      if (err.response?.data?.detail.includes("ya has postulado")) {
        toast.push("Ya habías postulado a esta oferta.");
      } else {
        toast.push(err.message || "No se pudo enviar la postulación.");
      }
    } finally {
      setApplying((prev) => ({ ...prev, [job.id]: false }));
    }
  }

  // **ARREGLO PARA 'u is possibly null'**
  // Usamos 'optional chaining' (?.). Si 'u' es null, isBarista será false.
  const isBarista = u?.role === "barista";

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Vacantes</h1>

      {!isBarista && (
        <Card className="p-4 mb-4 text-sm text-gray-700">
          Esta vista es solo para <b>baristas</b>. Inicia sesión como barista
          para ver y postular a las vacantes.
        </Card>
      )}

      {/* --- 6. SECCIÓN "MIS POSTULACIONES" (SOLO BARISTAS) --- */}
      {isBarista && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Mis Postulaciones</h2>
          {loadingApps ? (
            <Card className="p-6">Cargando postulaciones...</Card>
          ) : !myApplications.length ? (
            <Card className="p-6 text-sm text-gray-700">
              Aún no has postulado a ninguna vacante.
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myApplications.map((app) => (
                <Card key={app.id} className="p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{app.job_title}</h3>
                      <p className="text-sm text-gray-600">{app.company}</p>
                    </div>
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        app.status === "accepted" ? "bg-green-100 text-green-800" :
                        app.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {formatStatus(app.status)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- 7. SECCIÓN "VACANTES DISPONIBLES" (SOLO BARISTAS) --- */}
      {isBarista && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Vacantes Disponibles</h2>
          {loadingOffers ? (
            <Card className="p-6">Cargando vacantes...</Card>
          ) : !offers.length ? (
            // **ARREGLO DEL TYPO 'DatoCard'**
            <Card className="p-6 text-sm text-gray-700">
              No hay vacantes activas por ahora.
            </Card> 
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {offers.map((job) => (
                <Card key={job.id} className="p-0 overflow-hidden">
                  <img
                    src={getJobTypeImage(job.job_type)}
                    alt={job.job_type}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-medium">{job.title}</h2>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <p className="text-sm text-gray-600 mt-1">{job.location}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-brand-600">
                          {job.salary_range || "No especificado"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(job.created_at).toLocaleDateString("es-CL")}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm mt-2 text-gray-800">
                      {job.description.substring(0, 100)}...
                    </p>
                    
                    <div className="mt-4">
                      <Button
                        variant={"primary"}
                        disabled={applying[job.id]}
                        onClick={() => apply(job)}
                      >
                        {applying[job.id] ? "Postulando..." : "Postular"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      
    </AppLayout>
  );
}