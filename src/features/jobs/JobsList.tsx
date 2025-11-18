// src/features/jobs/jobslist.tsx
import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useToast } from "../../components/Toast";
import { getUserMock } from "../../api/auth";

import { getAllJobOffers, type JobOffer, type JobType } from "../../api/jobOffer";
import { applyToJob, getMyApplications, type MyApplication } from "../../api/jobApplication";

// ... (función getJobTypeImage)
function getJobTypeImage(jobType: JobType): string {
  switch (jobType) {
    case "full_time":
      return "/images/job-full-time.jpg"; 
    case "part_time":
      return "/images/job-part-time.jpg"; 
    case "replacement":
      return "/images/job-replacement.jpg"; 
    case "urgent":
      return "/images/job-urgent.jpg"; 
    default:
      return "/images/job-default.jpg"; 
  }
}

// ... (función formatStatus)
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
  
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [applying, setApplying] = useState<Record<number, boolean>>({});

  //
  // ⬇️⬇️ ¡¡ARREGLO DEL BUCLE!! ⬇️⬇️
  // 1. Saca los valores primitivos (id, role) AFUERA del useEffect.
  //
  const userId = u?.id;
  const userRole = u?.role;

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
      // 2. Ahora usamos 'userRole' y 'userId' (que son estables)
      if (userRole === "barista" && userId) {
        setLoadingApps(true);
        try {
          const apps = await getMyApplications(userId); // <-- usa la variable estable
          setMyApplications(apps);
        } catch (err: any) {
          toast.push(err.message || "No se pudo cargar tus postulaciones.");
        } finally {
          setLoadingApps(false);
        }
      } else {
        setLoadingApps(false);
      }
    }

    fetchJobs();
    fetchMyApplications();
  //
  // ⬇️⬇️ ¡¡Y AQUÍ!! ⬇️⬇️
  // 3. Usa los valores primitivos y estables en el array de dependencias.
  //
  }, [userId, userRole]); // <-- El 'toast' también se quita

  // --- 5. Lógica de postulación real ---
  async function apply(job: JobOffer) {
    if (!u) return toast.push("Debes iniciar sesión para postular");

    setApplying((prev) => ({ ...prev, [job.id]: true }));
    try {
      await applyToJob(
        {
          job_offer_id: job.id,
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

  // Ahora 'isBarista' se basa en la variable estable 'userRole'
  const isBarista = userRole === "barista";

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