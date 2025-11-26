// src/features/jobs/JobsList.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useToast } from "../../components/Toast";
import { getUserMock } from "../../api/auth";

import {
  getAllJobOffers,
  type JobOffer,
  type JobType,
} from "../../api/jobOffer";
import {
  applyToJob,
  getMyApplications,
  type MyApplication,
  completeApplication, // ✅ NUEVO
} from "../../api/jobApplication";

import { notify } from "../../lib/notify";

import {
  getFavoriteOffers,
  addOfferToFavorites,
  removeOfferFromFavorites,
} from "../../api/favorites";

// ✅ NUEVO: validación perfil
import { validateProfile } from "../../lib/validateProfile";
import { normalizeRole } from "../../lib/roles";

// Imagen por tipo (ok)
function getJobTypeImage(jobType: JobType): string {
  switch (jobType) {
    case "FULL_TIME":
      return "/images/job-full-time.jpg";
    case "PART_TIME":
      return "/images/job-part-time.jpg";
    case "REPLACEMENT":
      return "/images/job-replacement.jpg";
    case "URGENT":
      return "/images/job-urgent.jpg";
    default:
      return "/images/job-default.jpg";
  }
}

// Estados reales backend
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Pendiente",
    under_review: "En revisión",
    interview_scheduled: "Entrevista agendada",
    interviewed: "Entrevistado",
    offered: "Oferta enviada",
    hired: "Seleccionado",
    rejected: "Rechazado",

    // ✅ NUEVOS post-trabajo
    completed_by_employer: "Completado por empleador",
    completed_by_worker: "Completado por barista",
    completed_confirmed: "Trabajo completado",
  };
  return statusMap[status] || status;
}

// ✅ helper accordion
function SectionHeader({
  title,
  open,
  onToggle,
  right,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  right?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 px-1 py-2 text-left"
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-block transition-transform ${
            open ? "rotate-90" : "rotate-0"
          }`}
        >
          ▶
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      {right}
    </button>
  );
}

// ✅ Lógica de UI para completado (barista = worker)
// AHORA recibe workerReviewed para ocultar reseña cuando corresponde
function getCompletionUIForWorker(status: string, workerReviewed: boolean) {
  switch (status) {
    case "hired":
      return {
        showButton: true,
        label: "Marcar trabajo como completado",
        mode: "mark" as const,
      };

    case "completed_by_employer":
      return {
        showButton: true,
        label: "Confirmar trabajo completado",
        mode: "confirm" as const,
      };

    case "completed_by_worker":
      return {
        showButton: false,
        label: "Esperando confirmación del empleador",
        mode: "wait" as const,
      };

    case "completed_confirmed":
      // ✅ solo permitir reseña si aún no reseñó el worker
      if (workerReviewed) {
        return {
          showButton: false,
          label: "Ya dejaste tu reseña ✅",
          mode: "done" as const,
        };
      }
      return {
        showButton: true,
        label: "Dejar reseña",
        mode: "review" as const,
      };

    default:
      return {
        showButton: false,
        label: "",
        mode: "none" as const,
      };
  }
}

export default function JobsList() {
  const u = getUserMock();
  const toast = useToast();
  const nav = useNavigate();

  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [favoriteOfferIds, setFavoriteOfferIds] = useState<Set<number>>(
    new Set()
  );

  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);

  const [applying, setApplying] = useState<Record<number, boolean>>({});
  const [togglingFav, setTogglingFav] = useState<Record<number, boolean>>({});

  // ✅ NUEVO: loading por postulación al completar
  const [completing, setCompleting] = useState<Record<number, boolean>>({});

  // ✅ NUEVO: acordeones abiertos/cerrados
  const [openMyApps, setOpenMyApps] = useState(true);
  const [openOffers, setOpenOffers] = useState(true);

  const userId = u?.id;
  const userRole = u?.role;
  const isBarista = userRole === "barista";

  useEffect(() => {
    async function fetchJobs() {
      setLoadingOffers(true);
      try {
        const jobOffers = await getAllJobOffers();

        const filtered =
          isBarista
            ? jobOffers.filter(
                (j) => j.is_active === 1 && j.status !== "CERRADO"
              )
            : jobOffers;

        setOffers(filtered);
      } catch (err: any) {
        toast.push(err.message || "No se pudo cargar las vacantes.");
      } finally {
        setLoadingOffers(false);
      }
    }

    async function fetchMyApplications() {
      if (isBarista && userId) {
        setLoadingApps(true);
        try {
          const apps = await getMyApplications(userId);
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

    async function fetchFavorites() {
      if (!isBarista || !userId) return;

      try {
        const favs: any[] = await getFavoriteOffers(userId);
        const ids = favs
          .map((f) => Number(f?.id ?? f?.job_offer_id ?? f?.jobOfferId))
          .filter((x) => !Number.isNaN(x));

        setFavoriteOfferIds(new Set(ids));
      } catch (err) {
        console.warn("No se pudieron cargar favoritos:", err);
      }
    }

    fetchJobs();
    fetchMyApplications();
    fetchFavorites();
  }, [userId, userRole]);

  const appliedOfferIds = useMemo(() => {
    return new Set(myApplications.map((a) => a.job_offer_id));
  }, [myApplications]);

  async function apply(job: JobOffer) {
    if (!u) return toast.push("Debes iniciar sesión para postular");
    if (!isBarista) return;

    // ✅ VALIDAR PERFIL ANTES DE POSTULAR
    const role = normalizeRole(u) as any;
    const v = validateProfile(u, role);

    if (!v.ok) {
      toast.push("Debes completar tu perfil antes de postular.");
      nav("/app/profile");
      return;
    }

    setApplying((prev) => ({ ...prev, [job.id]: true }));
    try {
      await applyToJob({ job_offer_id: job.id }, u.id);

      toast.push("¡Postulación enviada con éxito!");

      notify({
        userId: Number(u.id),
        type: "BARISTA_APPLIED",
        title: "Postulación enviada",
        message: `Has postulado a la oferta "${job.title}"`,
        payload: { job_offer_id: job.id },
      });

      const apps = await getMyApplications(u.id);
      setMyApplications(apps);

      // ✅ si estaba cerrado el accordion, lo abrimos para que vea su postulación
      setOpenMyApps(true);
    } catch (err: any) {
      console.error("Error al postular:", err);
      const detail = err.response?.data?.detail ?? "";
      if (
        typeof detail === "string" &&
        detail.toLowerCase().includes("ya has postulado")
      ) {
        toast.push("Ya habías postulado a esta oferta.");
      } else {
        toast.push(err.message || "No se pudo enviar la postulación.");
      }
    } finally {
      setApplying((prev) => ({ ...prev, [job.id]: false }));
    }
  }

  async function toggleFavoriteOffer(jobId: number) {
    if (!u || !isBarista) return;

    setTogglingFav((prev) => ({ ...prev, [jobId]: true }));

    const isFav = favoriteOfferIds.has(jobId);

    setFavoriteOfferIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(jobId);
      else next.add(jobId);
      return next;
    });

    try {
      if (isFav) {
        await removeOfferFromFavorites(jobId, u.id);
      } else {
        await addOfferToFavorites(jobId, u.id);
      }
    } catch (err: any) {
      setFavoriteOfferIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
      toast.push(err.message || "No se pudo actualizar favorito");
    } finally {
      setTogglingFav((prev) => ({ ...prev, [jobId]: false }));
    }
  }

  // ✅ NUEVO: handler completar/confirmar/reseñar
  async function handleComplete(app: MyApplication) {
    if (!u) return;

    const workerReviewed = !!(app as any).worker_reviewed;
    const ui = getCompletionUIForWorker(app.status, workerReviewed);

    if (ui.mode === "review") {
      toast.push("Aquí se abrirá el formulario de reseña 🙂");
      return;
    }

    setCompleting((prev) => ({ ...prev, [app.id]: true }));
    try {
      await completeApplication(app.id, u.id, "worker");

      const apps = await getMyApplications(u.id);
      setMyApplications(apps);

      toast.push("Estado actualizado ✅");
    } catch (err: any) {
      console.error("Error completando postulación:", err);
      toast.push(err.response?.data?.detail || err.message || "No se pudo actualizar.");
    } finally {
      setCompleting((prev) => ({ ...prev, [app.id]: false }));
    }
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Vacantes</h1>

      {!isBarista && (
        <Card className="p-4 mb-4 text-sm text-gray-700">
          Esta vista es solo para <b>baristas</b>. Inicia sesión como barista
          para ver y postular a las vacantes.
        </Card>
      )}

      {/* =========================
          MIS POSTULACIONES (ACCORDION)
         ========================= */}
      {isBarista && (
        <div className="mb-6">
          <SectionHeader
            title="Mis Postulaciones"
            open={openMyApps}
            onToggle={() => setOpenMyApps((v) => !v)}
            right={
              <span className="text-xs text-gray-500">
                {loadingApps ? "..." : myApplications.length}
              </span>
            }
          />

          <div
            className={`grid transition-all duration-200 ease-in-out ${
              openMyApps ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              {loadingApps ? (
                <Card className="p-6">Cargando postulaciones...</Card>
              ) : !myApplications.length ? (
                <Card className="p-6 text-sm text-gray-700">
                  Aún no has postulado a ninguna vacante.
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 mt-2">
                  {myApplications.map((app) => {
                    const workerReviewed = !!(app as any).worker_reviewed;
                    const completionUI = getCompletionUIForWorker(app.status, workerReviewed);

                    return (
                      <Card key={app.id} className="p-5">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{app.job_title}</h3>
                            <p className="text-sm text-gray-600">{app.company}</p>
                          </div>
                          <span
                            className={`text-sm font-medium px-2 py-1 rounded ${
                              app.status === "hired"
                                ? "bg-green-100 text-green-800"
                                : app.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : app.status === "completed_confirmed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {formatStatus(app.status)}
                          </span>
                        </div>

                        {(completionUI.mode === "wait" || completionUI.mode === "done") && (
                          <div className="mt-3 text-xs text-gray-600">
                            {completionUI.label}
                          </div>
                        )}

                        {completionUI.showButton && (
                          <div className="mt-3">
                            <Button
                              variant={completionUI.mode === "review" ? "primary" : "secondary"}
                              disabled={!!completing[app.id]}
                              onClick={() => handleComplete(app)}
                            >
                              {completing[app.id]
                                ? "Actualizando..."
                                : completionUI.label}
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================
          VACANTES DISPONIBLES (ACCORDION)
         ========================= */}
      {isBarista && (
        <div className="mb-8">
          <SectionHeader
            title="Vacantes Disponibles"
            open={openOffers}
            onToggle={() => setOpenOffers((v) => !v)}
            right={
              <span className="text-xs text-gray-500">
                {loadingOffers ? "..." : offers.length}
              </span>
            }
          />

          <div
            className={`grid transition-all duration-200 ease-in-out ${
              openOffers ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              {loadingOffers ? (
                <Card className="p-6">Cargando vacantes...</Card>
              ) : !offers.length ? (
                <Card className="p-6 text-sm text-gray-700">
                  No hay vacantes activas por ahora.
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 mt-2">
                  {offers.map((job) => {
                    const alreadyApplied = appliedOfferIds.has(job.id);
                    const isFav = favoriteOfferIds.has(job.id);

                    return (
                      <Card key={job.id} className="p-0 overflow-hidden relative">
                        <button
                          type="button"
                          onClick={() => toggleFavoriteOffer(job.id)}
                          disabled={togglingFav[job.id]}
                          className="absolute top-3 right-3 z-10 text-2xl drop-shadow"
                          aria-label="Favorito"
                          title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
                        >
                          {isFav ? "❤️" : "🤍"}
                        </button>

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
                              <p className="text-sm text-gray-600 mt-1">
                                {job.location}
                              </p>
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
                              variant="primary"
                              disabled={applying[job.id] || alreadyApplied}
                              onClick={() => apply(job)}
                            >
                              {alreadyApplied
                                ? "Ya postulaste"
                                : applying[job.id]
                                ? "Postulando..."
                                : "Postular"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
