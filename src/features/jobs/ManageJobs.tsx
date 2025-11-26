import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { getUserMock } from "../../api/auth";
import { useToast } from "../../components/Toast";
import { useEffect, useMemo, useState } from "react";

import {
  getJobsByRestaurant,
  deleteJobOffer,
  updateJobOffer,
  selectCandidate,
  getMatchingWorkers,
  type JobOffer,
  getJobOfferById,
} from "../../api/jobOffer";

import {
  getApplicantsForJob,
  updateApplicationStatus,
  completeApplication, // ✅ NUEVO
  type ApplicationStatus,
  type Applicant,
  type RejectionReason,
} from "../../api/jobApplication";

import RejectApplicationModal from "./RejectApplicationModal";

import { createAssignment } from "../../api/assignments";
import { createEventLog } from "../../api/eventLogs";
import {
  getFavoriteWorkers,
  addWorkerToFavorites,
  removeWorkerFromFavorites,
} from "../../api/favorites";

import { fetchProfile, type ApiProfile } from "../../api/profile";
import {
  getReviewsByUser,
  type Review,
  type ReviewsByUserResponse,
} from "../../api/review";
import {
  getCertificates,
  getCertificateDownloadUrl,
  type ApiCertificate,
} from "../../api/certificate";
import { useNavigate } from "react-router-dom";

function Stars({ value = 0 }: { value?: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= v ? "text-yellow-500" : "text-gray-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ✅ Lógica UI completado (employer = cafe/academy)
function getCompletionUIForEmployer(status: string, employerReviewed?: boolean) {
  switch (status) {
    case "hired":
      return {
        showButton: true,
        label: "Marcar trabajo como completado",
        mode: "mark" as const,
      };

    case "completed_by_worker":
      return {
        showButton: true,
        label: "Confirmar trabajo completado",
        mode: "confirm" as const,
      };

    case "completed_by_employer":
      return {
        showButton: false,
        label: "Esperando confirmación del barista",
        mode: "wait" as const,
      };

    case "completed_confirmed":
      if (employerReviewed) {
        return {
          showButton: false,
          label: "Reseña enviada",
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

export default function ManageJobs() {
  const u = getUserMock();
  const toast = useToast();

  const [myJobs, setMyJobs] = useState<JobOffer[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const [applicantCounts, setApplicantCounts] = useState<Record<number, number>>(
    {}
  );
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<Record<number, boolean>>(
    {}
  );

  const [matchingResults, setMatchingResults] = useState<any[]>([]);
  const [loadingMatching, setLoadingMatching] = useState(false);

  const [favoriteWorkerIds, setFavoriteWorkerIds] = useState<Set<number>>(
    new Set()
  );
  const [togglingFavWorker, setTogglingFavWorker] = useState<
    Record<number, boolean>
  >({});

  // ✅ NUEVO: loading por completar/confirmar
  const [completing, setCompleting] = useState<Record<number, boolean>>({});

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] =
    useState<Applicant | null>(null);

  const [selectedProfile, setSelectedProfile] = useState<ApiProfile | null>(
    null
  );
  const [reviewsData, setReviewsData] =
    useState<ReviewsByUserResponse | null>(null);
  const [certificates, setCertificates] = useState<ApiCertificate[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingCerts, setLoadingCerts] = useState(false);

  // modal rechazo
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedRejectApp, setSelectedRejectApp] =
    useState<Applicant | null>(null);

  const userId = u?.id;
  const userRole = u?.role;
  const nav = useNavigate();

  // ============================
  // Mapeo status UI postulantes
  // ============================
  const statusUIMap: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Pendiente", cls: "bg-yellow-100 text-yellow-800" },
    HIRED: { label: "Contratado", cls: "bg-green-100 text-green-800" },
    REJECTED: { label: "Rechazado", cls: "bg-red-100 text-red-800" },

    // ✅ Post-trabajo
    COMPLETED_BY_EMPLOYER: {
      label: "Completado por empleador",
      cls: "bg-gray-100 text-gray-800",
    },
    COMPLETED_BY_WORKER: {
      label: "Completado por barista",
      cls: "bg-gray-100 text-gray-800",
    },
    COMPLETED_CONFIRMED: {
      label: "Trabajo completado",
      cls: "bg-blue-100 text-blue-800",
    },

    APPLIED: { label: "Pendiente", cls: "bg-yellow-100 text-yellow-800" },
    ACCEPTED: { label: "Contratado", cls: "bg-green-100 text-green-800" },
    DECLINED: { label: "Rechazado", cls: "bg-red-100 text-red-800" },
  };

  useEffect(() => {
    const loadJobsAndCounts = async () => {
      if (userId && (userRole === "cafe" || userRole === "academy")) {
        setLoadingJobs(true);
        try {
          const jobs = await getJobsByRestaurant(userId);
          setMyJobs(jobs);

          const countsMap: Record<number, number> = {};
          const countPromises = jobs.map((job) =>
            getApplicantsForJob(job.id).then((list) => {
              countsMap[job.id] = list.length;
            })
          );
          await Promise.all(countPromises);
          setApplicantCounts(countsMap);
        } catch {
          toast.push("No se pudo cargar tus ofertas");
        } finally {
          setLoadingJobs(false);
        }
      } else {
        setLoadingJobs(false);
      }
    };

    loadJobsAndCounts();
  }, [userId, userRole]);

  useEffect(() => {
    const loadFavWorkers = async () => {
      if (!userId || (userRole !== "cafe" && userRole !== "academy")) return;
      try {
        const favs: any[] = await getFavoriteWorkers(userId);

        const ids = favs
          .map((f) => Number(f?.id ?? f?.user_id ?? f?.worker_id))
          .filter((x) => !Number.isNaN(x));

        setFavoriteWorkerIds(new Set(ids));
      } catch {}
    };
    loadFavWorkers();
  }, [userId, userRole]);

  const handleSelectJob = async (jobId: number) => {
    if (selectedJobId === jobId) return;

    setSelectedJobId(jobId);
    setLoadingApplicants(true);
    setMatchingResults([]);

    try {
      const applicantData = await getApplicantsForJob(jobId);
      setApplicants(applicantData);
    } catch {
      toast.push("No se pudo cargar los postulantes");
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleRunMatching = async () => {
    if (!selectedJobId) return;
    setLoadingMatching(true);
    try {
      const results = await getMatchingWorkers(selectedJobId);
      setMatchingResults(results);

      await createEventLog({
        entity_type: "job_offer",
        entity_id: selectedJobId,
        actor_id: Number(userId),
        action: "matching_run",
        description: "Se ejecutó matching para la oferta",
        payload: { count: results.length },
      });
    } finally {
      setLoadingMatching(false);
    }
  };

  const handleAcceptApplicant = async (application: Applicant) => {
    if (!selectedJobId || !userId) return;

    setUpdatingStatus((prev) => ({ ...prev, [application.id]: true }));

    try {
      await selectCandidate(selectedJobId, application.id, "");
      const newStatus: ApplicationStatus = "hired";
      await updateApplicationStatus(application.id, newStatus);

      await createAssignment({
        job_offer_id: selectedJobId,
        application_id: application.id,
        worker_id: application.user_id,
        client_id: Number(userId),
      });

      try {
        await createEventLog({
          entity_type: "job_offer",
          entity_id: selectedJobId,
          actor_id: Number(userId),
          action: "candidate_selected",
          description: "Se seleccionó y asignó candidato",
          payload: {
            application_id: application.id,
            worker_id: application.user_id,
          },
        });
      } catch {}

      setApplicants((prev) =>
        prev.map((a) =>
          a.id === application.id ? { ...a, status: newStatus } : a
        )
      );

      if (selectedJobId) {
        const freshOffer = await getJobOfferById(selectedJobId);

        setMyJobs((prev) =>
          prev.map((j) => (j.id === selectedJobId ? freshOffer : j))
        );

        if (freshOffer.status === "CERRADO" || freshOffer.is_active === 0) {
          setApplicants((prev) =>
            prev.map((a) =>
              a.id === application.id ? a : { ...a, status: "rejected" }
            )
          );
        }
      }
    } catch (e) {
      console.error(e);
      toast.push("No se pudo aceptar postulante ❌");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [application.id]: false }));
    }
  };

  // ✅ NUEVO: completar/confirmar como employer
  const handleCompleteEmployer = async (app: Applicant) => {
    if (!u || !selectedJobId) return;

    const ui = getCompletionUIForEmployer(
      String(app.status),
      app.employer_reviewed
    );

    if (ui.mode === "review") {
      toast.push("Aquí abriremos el modal de reseña 🙂");
      return;
    }

    setCompleting((prev) => ({ ...prev, [app.id]: true }));
    try {
      await completeApplication(app.id, u.id, "employer");

      const freshApps = await getApplicantsForJob(selectedJobId);
      setApplicants(freshApps);

      // si modal abierto, refrescar seleccionado
      const updated = freshApps.find((x) => x.id === app.id);
      if (updated && selectedApplicant?.id === app.id) {
        setSelectedApplicant(updated);
      }

      toast.push("Estado actualizado ✅");
    } catch (err: any) {
      console.error("Error completando postulación:", err);
      toast.push(
        err.response?.data?.detail ||
          err.message ||
          "No se pudo actualizar."
      );
    } finally {
      setCompleting((prev) => ({ ...prev, [app.id]: false }));
    }
  };

  // ==========================================================
  // RECHAZO
  // ==========================================================
  const openRejectApplicant = (application: Applicant) => {
    setSelectedRejectApp(application);
    setRejectOpen(true);
  };

  const confirmRejectApplicant = async (
    reason: RejectionReason,
    note?: string
  ) => {
    if (!selectedRejectApp) return;
    const application = selectedRejectApp;

    setUpdatingStatus((prev) => ({ ...prev, [application.id]: true }));

    try {
      const newStatus: ApplicationStatus = "rejected";

      await updateApplicationStatus(application.id, newStatus, "", {
        rejection_reason: reason,
        rejection_note: note,
      });

      try {
        await createEventLog({
          entity_type: "application",
          entity_id: application.id,
          actor_id: Number(userId),
          action: "rejected",
          description: `Postulación rechazada. Motivo: ${reason}`,
        });
      } catch {}

      setApplicants((prev) =>
        prev.map((a) =>
          a.id === application.id
            ? {
                ...a,
                status: newStatus,
                rejection_reason: reason as any,
                rejection_note: note as any,
              }
            : a
        )
      );

      if (selectedJobId) {
        const freshOffer = await getJobOfferById(selectedJobId);

        setMyJobs((prev) =>
          prev.map((j) => (j.id === selectedJobId ? freshOffer : j))
        );
      }
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [application.id]: false }));
      setRejectOpen(false);
      setSelectedRejectApp(null);
    }
  };

  // ==========================================================
  // PERFIL+RESEÑAS
  // ==========================================================
  const openProfileModal = async (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setSelectedProfile(null);
    setReviewsData(null);
    setCertificates([]);

    setShowProfileModal(true);

    setLoadingProfile(true);
    setLoadingReviews(true);
    setLoadingCerts(true);

    try {
      const [p, r, c] = await Promise.allSettled([
        fetchProfile(applicant.user_id),
        getReviewsByUser(applicant.user_id),
        getCertificates(applicant.user_id),
      ]);

      if (p.status === "fulfilled") setSelectedProfile(p.value);
      if (r.status === "fulfilled") setReviewsData(r.value);
      if (c.status === "fulfilled") setCertificates(c.value);
    } finally {
      setLoadingProfile(false);
      setLoadingReviews(false);
      setLoadingCerts(false);
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedApplicant(null);
    setSelectedProfile(null);
    setReviewsData(null);
    setCertificates([]);
  };

  const handleDownloadCert = async (certId: number) => {
    try {
      const res = await getCertificateDownloadUrl(certId);
      if (res?.download_url) window.open(res.download_url, "_blank");
    } catch {
      toast.push("No se pudo descargar el certificado");
    }
  };

  const toggleFavoriteWorker = async (workerId: number) => {
    if (!userId) return;

    setTogglingFavWorker((prev) => ({ ...prev, [workerId]: true }));
    const isFav = favoriteWorkerIds.has(workerId);

    setFavoriteWorkerIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(workerId);
      else next.add(workerId);
      return next;
    });

    try {
      if (isFav) await removeWorkerFromFavorites(workerId, userId);
      else await addWorkerToFavorites(workerId, userId);
    } finally {
      setTogglingFavWorker((prev) => ({ ...prev, [workerId]: false }));
    }
  };

  const handleToggleActive = async (job: JobOffer) => {
    const newActive = job.is_active ? 0 : 1;
    try {
      await updateJobOffer(job.id, { is_active: newActive });
      setMyJobs(
        myJobs.map((j) =>
          j.id === job.id ? { ...j, is_active: newActive } : j
        )
      );
      toast.push(newActive ? "Vacante mostrada" : "Vacante ocultada");
    } catch {
      toast.push("No se pudo actualizar la vacante");
    }
  };

  const handleDelete = async (job: JobOffer) => {
    if (!window.confirm(`¿Seguro que quieres eliminar "${job.title}"?`))
      return;
    try {
      await deleteJobOffer(job.id);
      setMyJobs(myJobs.filter((j) => j.id !== job.id));
      toast.push("Vacante eliminada");
    } catch {
      toast.push("No se pudo eliminar la vacante");
    }
  };

  const selectedJob = useMemo(
    () => myJobs.find((j) => j.id === selectedJobId),
    [myJobs, selectedJobId]
  );

  const vacantesDisponibles = useMemo(() => {
    if (!selectedJob) return 0;
    const total = Number(selectedJob.vacancies_total ?? 1);
    const filled = Number(selectedJob.vacancies_filled ?? 0);
    return Math.max(0, total - filled);
  }, [selectedJob]);

  if (!u) {
    return (
      <AppLayout>
        <Card className="p-6">Inicia sesión</Card>
      </AppLayout>
    );
  }

  if (userRole !== "cafe" && userRole !== "academy") {
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* MIS OFERTAS */}
        <div className="md:col-span-1 space-y-3">
          <h2 className="text-lg font-medium">Mis Ofertas Publicadas</h2>

          {loadingJobs ? (
            <Card className="p-4 text-sm">Cargando...</Card>
          ) : myJobs.length === 0 ? (
            <Card className="p-4 text-sm text-gray-600">
              No has publicado ofertas.
            </Card>
          ) : (
            myJobs.map((job) => {
              const total = Number(job.vacancies_total ?? 1);
              const filled = Number(job.vacancies_filled ?? 0);
              const disponibles = Math.max(0, total - filled);

              return (
                <Card
                  key={job.id}
                  className={`p-0 ${
                    selectedJobId === job.id
                      ? "bg-brand-50 border-2 border-brand-500"
                      : ""
                  }`}
                >
                  <div
                    className={`p-4 cursor-pointer ${
                      selectedJobId !== job.id ? "hover:bg-gray-50" : ""
                    }`}
                    onClick={() => handleSelectJob(job.id)}
                  >
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.location}</p>

                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          job.status === "CERRADO"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {job.status || (job.is_active ? "Activa" : "Cerrada")}
                      </span>

                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Postulantes: <b>{applicantCounts[job.id] ?? 0}</b>
                      </span>

                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          disponibles > 0
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        Vacantes: <b>{disponibles}</b> / {total}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleToggleActive(job)}
                    >
                      {job.is_active ? "Ocultar" : "Mostrar"}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => nav(`/app/jobs/${job.id}/edit`)}
                    >
                      Editar oferta
                    </Button>

                    <Button variant="ghost" onClick={() => handleDelete(job)}>
                      Eliminar
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* POSTULANTES */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Postulantes</h2>

            {!!selectedJobId && (
              <Button
                variant="primary"
                onClick={handleRunMatching}
                disabled={loadingMatching || vacantesDisponibles <= 0}
                title={
                  vacantesDisponibles <= 0
                    ? "No quedan vacantes disponibles"
                    : undefined
                }
              >
                {loadingMatching ? "Ejecutando..." : "Ejecutar matching"}
              </Button>
            )}
          </div>

          {!!selectedJobId && matchingResults.length > 0 && (
            <Card className="p-4">
              <div className="text-sm font-medium mb-2">Matching sugerido</div>
              <div className="grid gap-2">
                {matchingResults.map((m, idx) => (
                  <div
                    key={m.user_id ?? idx}
                    className="text-sm flex justify-between"
                  >
                    <span>Barista #{m.user_id}</span>
                    <span className="text-gray-600">
                      Score: {m.matching_score ?? m.score ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {loadingApplicants ? (
            <Card className="p-6 text-sm">Cargando postulantes...</Card>
          ) : !selectedJobId ? (
            <Card className="p-6 text-sm text-gray-600">
              Selecciona una oferta para ver postulantes.
            </Card>
          ) : applicants.length === 0 ? (
            <Card className="p-6 text-sm text-gray-600">
              Aún no hay postulantes para esta oferta.
            </Card>
          ) : (
            applicants.map((app) => {
              const isFav = favoriteWorkerIds.has(app.user_id);

              const rawStatus = String(app.status ?? "")
                .trim()
                .toLowerCase();

              const st =
                statusUIMap[rawStatus.toUpperCase()] ?? {
                  label: rawStatus || "Pendiente",
                  cls: "bg-gray-100 text-gray-700",
                };

              const completionUI = getCompletionUIForEmployer(
                rawStatus,
                app.employer_reviewed
              );

              return (
                <Card
                  key={app.id}
                  className="p-4 relative border border-gray-100 hover:shadow-md transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleFavoriteWorker(app.user_id)}
                    disabled={togglingFavWorker[app.user_id]}
                    className="absolute top-3 right-3 text-xl"
                  >
                    {isFav ? "❤️" : "🤍"}
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200 grid place-items-center text-xs font-semibold text-gray-700">
                      {`B${app.user_id}`}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">
                          Barista #{app.user_id}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </div>

                      {/* bloque completado employer */}
                      {completionUI.mode === "wait" && (
                        <div className="mt-2 text-xs text-gray-600">
                          {completionUI.label}
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => openProfileModal(app)}
                        >
                          Ver perfil
                        </Button>

                        {completionUI.showButton && (
                          <Button
                            variant={
                              completionUI.mode === "review"
                                ? "primary"
                                : "secondary"
                            }
                            disabled={!!completing[app.id]}
                            onClick={() => handleCompleteEmployer(app)}
                          >
                            {completing[app.id]
                              ? "Actualizando..."
                              : completionUI.label}
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          onClick={() => openRejectApplicant(app)}
                          disabled={
                            updatingStatus[app.id] ||
                            rawStatus === "rejected"
                          }
                        >
                          {rawStatus === "rejected" ? "Rechazado" : "Rechazar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <RejectApplicationModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={confirmRejectApplicant}
        loading={
          selectedRejectApp ? updatingStatus[selectedRejectApp.id] : false
        }
      />

      {showProfileModal && selectedApplicant && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold text-lg">Perfil del postulante</div>
              <button
                onClick={closeProfileModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="p-5 grid gap-4 max-h-[65vh] overflow-y-auto">
              {(loadingProfile || loadingReviews || loadingCerts) && (
                <Card className="p-4 text-sm">Cargando perfil...</Card>
              )}

              {!loadingProfile && !selectedProfile && (
                <Card className="p-4 text-sm text-gray-600">
                  No se pudo cargar este perfil.
                </Card>
              )}

              {!loadingProfile && selectedProfile && (
                <>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden grid place-items-center">
                      {selectedProfile.avatar_url ? (
                        <img
                          src={selectedProfile.avatar_url}
                          alt="avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-500">
                          {selectedProfile.full_name
                            ? selectedProfile.full_name
                                .split(" ")
                                .map((w: string) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            : `B${selectedApplicant.user_id}`}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="text-xl font-semibold">
                        {selectedProfile.full_name ||
                          selectedProfile.business_name ||
                          `Barista #${selectedApplicant.user_id}`}
                      </div>

                      {(selectedProfile.comuna || selectedProfile.region) && (
                        <div className="text-sm text-gray-600">
                          {selectedProfile.comuna
                            ? `${selectedProfile.comuna}, `
                            : ""}
                          {selectedProfile.region || ""}
                        </div>
                      )}

                      {(() => {
                        const avg =
                          reviewsData?.rating_avg != null
                            ? Number(reviewsData.rating_avg)
                            : Number(selectedProfile.rating_avg ?? 0);

                        const count =
                          reviewsData?.reviews_count != null
                            ? Number(reviewsData.reviews_count)
                            : Number(selectedProfile.reviews_count ?? 0);

                        return (
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                            <Stars value={avg} />
                            <span>
                              <b>{avg ? avg.toFixed(1) : "—"}</b> / 5 ·{" "}
                              <b>{count}</b> reseña{count === 1 ? "" : "s"}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {selectedProfile.bio && (
                    <Card className="p-4 text-sm">
                      <div className="text-gray-600 font-medium mb-1">Bio</div>
                      <div>{selectedProfile.bio}</div>
                    </Card>
                  )}

                  {/* ... resto modal sin cambios ... */}

                  <section className="grid gap-2">
                    <h3 className="text-base font-semibold">Reseñas</h3>

                    {loadingReviews ? (
                      <Card className="p-3 text-sm text-gray-600">
                        Cargando reseñas...
                      </Card>
                    ) : !reviewsData || reviewsData.reviews_count === 0 ? (
                      <Card className="p-3 text-sm text-gray-600">
                        Sin reseñas todavía.
                      </Card>
                    ) : (
                      <div className="grid gap-2">
                        {reviewsData.reviews.map((r: Review) => (
                          <Card key={r.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <Stars value={r.rating} />
                              <span className="text-xs text-gray-500">
                                {fmtDate(r.created_at)}
                              </span>
                            </div>
                            {r.comment && (
                              <p className="text-sm mt-1 text-gray-800">
                                {r.comment}
                              </p>
                            )}
                            {(r.reviewer_name || r.reviewer_id) && (
                              <div className="text-xs text-gray-500 mt-1">
                                Por:{" "}
                                {r.reviewer_name ??
                                  `Usuario #${r.reviewer_id}`}
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>

            <div className="border-t p-4 flex flex-wrap gap-2 justify-end bg-white sticky bottom-0 z-10">
              <a
                href="/app/support"
                className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-100"
              >
                Contactar
              </a>

              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    const fullApplicant = applicants.find(
                      (a) => a.id === selectedApplicant.id
                    );
                    if (!fullApplicant) return;

                    await handleAcceptApplicant(fullApplicant);
                    closeProfileModal();
                  } catch {}
                }}
                disabled={
                  updatingStatus[selectedApplicant.id] ||
                  String(selectedApplicant.status).toLowerCase() === "hired" ||
                  myJobs.find((j) => j.id === selectedJobId)?.status ===
                    "CERRADO" ||
                  vacantesDisponibles <= 0
                }
                title={
                  vacantesDisponibles <= 0
                    ? "No quedan vacantes disponibles"
                    : undefined
                }
              >
                {String(selectedApplicant.status).toLowerCase() === "hired"
                  ? "Contratado"
                  : "Contratar"}
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  const fullApplicant = applicants.find(
                    (a) => a.id === selectedApplicant.id
                  );
                  if (!fullApplicant) return;
                  openRejectApplicant(fullApplicant);
                }}
                disabled={
                  updatingStatus[selectedApplicant.id] ||
                  String(selectedApplicant.status).toLowerCase() === "rejected"
                }
              >
                {String(selectedApplicant.status).toLowerCase() === "rejected"
                  ? "Rechazado"
                  : "Rechazar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
