// src/features/jobs/ManageJobs.tsx
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { getUserMock } from "../../api/auth";
import { useToast } from "../../components/Toast";
import { useEffect, useState } from "react";

// --- Importamos las APIs ---
import {
  getJobsByRestaurant,
  deleteJobOffer,
  updateJobOffer,
  type JobOffer,
} from "../../api/jobOffer";
import { 
  getApplicantsForJob, 
  updateApplicationStatus, 
  type ApplicationStatus,
  type Applicant // <-- Asegúrate de tener esta interfaz en 'jobApplication.ts'
} from "../../api/jobApplication";


export default function ManageJobs() {
  const u = getUserMock();
  const toast = useToast();

  const [myJobs, setMyJobs] = useState<JobOffer[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]); // Usamos la interfaz
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<Record<number, boolean>>({});

  // 1. Cargar las ofertas creadas por este restaurante
  useEffect(() => {
    if (u && (u.role === "cafe" || u.role === "academy")) {
      setLoadingJobs(true);
      getJobsByRestaurant(u.id)
        .then(setMyJobs)
        .catch((err) => toast.push(err.message || "No se pudo cargar tus ofertas"))
        .finally(() => setLoadingJobs(false));
    } else {
      setLoadingJobs(false); // Si no es rol, no cargues nada
    }
  }, [u, toast]);

  // 2. Cargar los postulantes cuando se selecciona una oferta
  const handleSelectJob = async (jobId: number) => {
    // Si ya está seleccionado, no hagas nada
    if (selectedJobId === jobId) return; 

    setSelectedJobId(jobId);
    setLoadingApplicants(true);
    try {
      const applicantData = await getApplicantsForJob(jobId);
      setApplicants(applicantData);
    } catch (err: any) {
      toast.push(err.message || "No se pudo cargar los postulantes");
    } finally {
      setLoadingApplicants(false);
    }
  };

  // 3. Aceptar o Rechazar un postulante
  const handleUpdateStatus = async (application: Applicant, newStatus: ApplicationStatus) => {
    setUpdatingStatus((prev) => ({ ...prev, [application.id]: true }));
    try {
      await updateApplicationStatus(application.id, newStatus);
      
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === application.id ? { ...app, status: newStatus } : app
        )
      );
      toast.push(`Postulante ${newStatus === "accepted" ? "Aceptado" : "Rechazado"}`);

    } catch (err: any) {
      toast.push(err.message || "No se pudo actualizar el estado");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [application.id]: false }));
    }
  };

  // 4. Lógica para Ocultar/Mostrar (UPDATE)
  const handleToggleActive = async (job: JobOffer) => {
    const newStatus = job.is_active ? 0 : 1;
    const actionText = newStatus ? "mostrada" : "ocultada";

    try {
      await updateJobOffer(job.id, { is_active: newStatus });
      setMyJobs(myJobs.map((j) =>
        j.id === job.id ? { ...j, is_active: newStatus } : j
      ));
      toast.push(`Vacante ${actionText}.`);
    } catch (err: any) {
      toast.push(err.message || "No se pudo actualizar la vacante.");
    }
  };

  // 5. Lógica para Eliminar (DELETE)
  const handleDelete = async (job: JobOffer) => {
    if (!window.confirm(`¿Seguro que quieres eliminar "${job.title}"?`)) {
      return;
    }
    try {
      await deleteJobOffer(job.id);
      setMyJobs(myJobs.filter((j) => j.id !== job.id));
      toast.push("Vacante eliminada.");
    } catch (err: any) {
      toast.push(err.message || "No se pudo eliminar la vacante.");
    }
  };


  // Renderizado
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
        <h1 className="text-2xl font-semibold mb-4">Gestionar Vacantes</h1>
        <Card className="p-6 text-sm text-gray-700">
          Esta sección es solo para Restaurantes y Academias.
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Gestionar Vacantes</h1>
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Columna 1: Mis Ofertas */}
        <div className="md:col-span-1 space-y-3">
          <h2 className="text-lg font-medium">Mis Ofertas Publicadas</h2>
          {loadingJobs ? (
            <Card className="p-4 text-sm">Cargando...</Card>
          ) : (
            myJobs.map((job) => (
              // **ARREGLO 'onClick'**: El 'Card' ya no tiene 'onClick'
              <Card
                key={job.id}
                className={`p-0 ${
                  selectedJobId === job.id ? "bg-brand-50 border-2 border-brand-500" : ""
                }`}
              >
                {/* **ARREGLO 'onClick'**: 'onClick' se mueve a este 'div' interno */}
                <div 
                  className={`p-4 cursor-pointer ${selectedJobId !== job.id ? "hover:bg-gray-50" : ""}`}
                  onClick={() => handleSelectJob(job.id)}
                >
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.location}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${job.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {job.is_active ? "Activa" : "Cerrada"}
                  </span>
                </div>
                {/* Opciones de Ocultar/Eliminar */}
                <div className="p-4 border-t border-gray-100 flex gap-2">
                   <Button
                      variant="secondary"
                      onClick={() => handleToggleActive(job)}
                    >
                      {job.is_active ? "Ocultar" : "Mostrar"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(job)}
                    >
                      Eliminar
                    </Button>
                </div>
              </Card>
            ))
          )}
          {myJobs.length === 0 && !loadingJobs && (
            <Card className="p-4 text-sm text-gray-600">No has publicado ofertas.</Card>
          )}
        </div>

        {/* Columna 2: Postulantes */}
        <div className="md:col-span-2 space-y-3">
          <h2 className="text-lg font-medium">Postulantes</h2>
          {loadingApplicants ? (
            <Card className="p-6 text-sm">Cargando postulantes...</Card>
          ) : !selectedJobId ? (
            <Card className="p-6 text-sm text-gray-600">
              Selecciona una oferta de la izquierda para ver los postulantes.
            </Card>
          ) : applicants.length === 0 ? (
            <Card className="p-6 text-sm text-gray-600">
              Aún no hay postulantes para esta oferta.
            </Card>
          ) : (
            applicants.map((app) => (
              <Card key={app.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Postulante ID: {app.user_id}</p>
                    <p className="text-sm text-gray-600">Estado: {app.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {/* **ARREGLO 'size'**: Propiedad 'size' eliminada */}
                    <Button
                      variant="primary"
                      onClick={() => handleUpdateStatus(app, "accepted")}
                      disabled={updatingStatus[app.id] || app.status === "accepted"}
                    >
                      {app.status === "accepted" ? "Aceptado" : "Aceptar"}
                    </Button>
                    {/* **ARREGLO 'size'**: Propiedad 'size' eliminada */}
                    <Button
                      variant="secondary"
                      onClick={() => handleUpdateStatus(app, "rejected")}
                      disabled={updatingStatus[app.id] || app.status === "rejected"}
                    >
                      {app.status === "rejected" ? "Rechazado" : "Rechazar"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}