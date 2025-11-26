// src/features/jobs/MyApplications.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useToast } from "../../components/Toast";
import { getUserMock } from "../../api/auth";

import {
  getMyApplications,
  deleteApplication,
  type MyApplication,
} from "../../api/jobApplication";

import {
  getJobOfferById,
  type JobOffer,
  type JobType,
} from "../../api/jobOffer";

import {
  getAssignmentsByWorker,
  type Assignment,
} from "../../api/assignments";

import ReviewForm from "../reviews/ReviewForm";
import { notify } from "../../lib/notify";

import { getReviewsByUser, type Review } from "../../api/review";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// estados a UI (badge)
const statusUIMap: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pendiente", cls: "bg-yellow-100 text-yellow-800" },
  HIRED: { label: "Seleccionado", cls: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rechazado", cls: "bg-red-100 text-red-800" },

  APPLIED: { label: "Pendiente", cls: "bg-yellow-100 text-yellow-800" },
  ACCEPTED: { label: "Seleccionado", cls: "bg-green-100 text-green-800" },
  DECLINED: { label: "Rechazado", cls: "bg-red-100 text-red-800" },
};

const rejectionReasonMap: Record<string, string> = {
  NO_CUMPLE_REQUISITOS: "No cumples los requisitos",
  YA_CUBRIMOS_VACANTES: "Vacantes ya cubiertas",
  NO_DISPONIBILIDAD_HORARIA: "No hay disponibilidad horaria",
  EXPERIENCIA_INSUFICIENTE: "Experiencia insuficiente",
  OTRO: "Otro motivo",
};

// imagen chiquita por tipo
function getJobTypeImage(jobType?: string | null): string {
  const t = String(jobType ?? "").toUpperCase() as JobType;
  switch (t) {
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

export default function MyApplications() {
  const u = getUserMock();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const userId = useMemo(() => {
    if (!u?.id) return null;
    const n = Number(u.id);
    return Number.isNaN(n) ? null : n;
  }, [u?.id]);

  const userRole = u?.role;

  // ID de postulación a resaltar/abrir desde la URL
  const highlightAppId = useMemo(() => {
    const v = searchParams.get("app");
    if (!v) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }, [searchParams]);

  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [jobs, setJobs] = useState<Record<number, JobOffer>>({});
  const [loading, setLoading] = useState(true);

  // applicationId cuyo formulario de reseña está abierto
  const [reviewAppId, setReviewAppId] = useState<number | null>(null);

  // reviews recibidas por application_id
  const [reviewsByAppId, setReviewsByAppId] = useState<Record<number, Review>>(
    {}
  );

  // modal oferta
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        setLoading(true);

        const apps = await getMyApplications(userId);
        setApplications(apps);

        const asg = await getAssignmentsByWorker(userId);
        setAssignments(asg);

        // ofertas
        const jobMap: Record<number, JobOffer> = {};
        for (const app of apps) {
          try {
            jobMap[app.job_offer_id] = await getJobOfferById(app.job_offer_id);
          } catch {
            // ignoramos errores individuales
          }
        }
        setJobs(jobMap);

        // reseñas recibidas por este barista
        try {
          const res = await getReviewsByUser(userId);
          const map: Record<number, Review> = {};

          for (const r of res.reviews || []) {
            if (r.application_id != null) {
              map[Number(r.application_id)] = r;
            }
          }
          setReviewsByAppId(map);
        } catch (e: any) {
          console.warn("No se pudieron cargar reseñas del barista", e);
        }
      } catch (err: any) {
        toast.push(err.message || "No se pudo cargar tus postulaciones");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId, toast]);

  // Si viene ?app=ID en la URL, abrir automáticamente el formulario de reseña
  useEffect(() => {
    if (!highlightAppId) return;
    if (!applications.length) return;

    const app = applications.find((a) => a.id === highlightAppId);
    if (!app) return;

    // Debe existir assignment (trabajo completado)
    const hasAssignment = assignments.some(
      (asg) => asg.job_offer_id === app.job_offer_id
    );
    if (!hasAssignment) return;

    setReviewAppId(highlightAppId);
  }, [highlightAppId, applications, assignments]);

  async function openOffer(jobOfferId: number) {
    try {
      const job = jobs[jobOfferId] ?? (await getJobOfferById(jobOfferId));
      setSelectedJob(job);
      setShowOfferModal(true);
    } catch {
      toast.push("No se pudo cargar la oferta");
    }
  }

  if (!u)
    return (
      <AppLayout>
        <Card className="p-6">Inicia sesión</Card>
      </AppLayout>
    );

  if (userRole !== "barista")
    return (
      <AppLayout>
        <Card className="p-6">Solo baristas pueden ver esta sección.</Card>
      </AppLayout>
    );

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Mis postulaciones</h1>

      {loading ? (
        <Card className="p-6 text-sm">Cargando...</Card>
      ) : applications.length === 0 ? (
        <Card className="p-6 text-sm text-gray-700">
          Aún no has postulado a vacantes.
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => {
            const job = jobs[app.job_offer_id];

            const assignment = assignments.find(
              (a) => a.job_offer_id === app.job_offer_id
            );

            const rawStatus = String(app.status ?? "").trim().toUpperCase();
            const st = statusUIMap[rawStatus] ?? {
              label: rawStatus || "Pendiente",
              cls: "bg-gray-100 text-gray-700",
            };

            const estadoFinal = assignment
              ? "Contratado"
              : rawStatus === "HIRED"
              ? "Seleccionado"
              : st.label;

            // reseña del empleador hacia este barista, ligada a ESTA postulación
            const employerReview = reviewsByAppId[app.id];

            const isHighlighted = highlightAppId === app.id;

            return (
              <Card
                key={app.id}
                className={`p-0 overflow-hidden ${
                  isHighlighted ? "ring-2 ring-purple-500" : ""
                }`}
              >
                {/* header delgado con imagen */}
                <div className="relative h-20 bg-gray-100">
                  <img
                    src={getJobTypeImage(job?.job_type)}
                    alt="Oferta"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                  <div className="absolute left-4 top-3 text-white">
                    <div className="text-sm opacity-90">Oferta</div>
                    <div className="font-semibold">
                      {job?.company ?? "Cafetería"}
                    </div>
                  </div>
                </div>

                {/* body 3 columnas */}
                <div className="p-4 grid gap-4 md:grid-cols-3 items-start">
                  {/* IZQUIERDA: info */}
                  <div className="space-y-2">
                    <div className="font-semibold text-lg">
                      {job?.title || `Vacante #${app.job_offer_id}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {job?.location}
                    </div>

                    <div className="text-xs text-gray-500">
                      Inicio: {fmtDate(job?.date_start)} <br />
                      Fin: {fmtDate(job?.date_end)}
                    </div>

                    <div className="mt-2 text-sm flex items-center gap-2">
                      <span className="text-gray-700">Estado:</span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${st.cls}`}
                      >
                        {estadoFinal}
                      </span>
                    </div>
                  </div>

                  {/* CENTRO: feedback / rating */}
                  <div className="space-y-2">
                    {rawStatus === "REJECTED" ? (
                      <div className="p-3 rounded-xl border border-red-200 bg-red-50/40">
                        <div className="flex items-center gap-2 font-semibold text-red-700">
                          <span className="text-lg">⛔</span>
                          Motivo del rechazo
                        </div>

                        <div className="mt-1 text-sm text-red-800 font-medium">
                          {rejectionReasonMap[
                            (app as any).rejection_reason ?? ""
                          ] ?? "No especificado"}
                        </div>

                        {!!(app as any).rejection_note && (
                          <div className="mt-1 text-sm text-gray-800">
                            “{(app as any).rejection_note}”
                          </div>
                        )}

                        {!!(app as any).rejected_at && (
                          <div className="mt-1 text-xs text-gray-500">
                            Rechazado el{" "}
                            {new Date(
                              (app as any).rejected_at
                            ).toLocaleString("es-CL")}
                          </div>
                        )}
                      </div>
                    ) : assignment ? (
                      <div className="p-3 rounded-xl border bg-gray-50">
                        <div className="font-semibold text-gray-800">
                          Trabajo finalizado ✅
                        </div>

                        {!employerReview ? (
                          <>
                            <div className="text-sm text-gray-600 mt-1">
                              Aquí podrás ver tu reseña y calificación cuando
                              esté lista.
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              ⏳ Aún no te reseñan
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-gray-700 mt-1">
                              Te reseñaron:
                            </div>

                            <div className="mt-2 text-yellow-500 text-lg">
                              {"★".repeat(
                                Math.round(employerReview.rating)
                              )}
                              {"☆".repeat(
                                5 - Math.round(employerReview.rating)
                              )}
                            </div>

                            {!!employerReview.topic && (
                              <div className="text-xs text-gray-600 mt-1">
                                Tópico: {employerReview.topic}
                              </div>
                            )}

                            {!!employerReview.comment && (
                              <div className="text-sm text-gray-800 mt-1 italic">
                                “{employerReview.comment}”
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border bg-gray-50">
                        <div className="font-semibold text-gray-800">
                          Postulación en revisión
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Te avisaremos cuando haya novedades.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DERECHA: acciones */}
                  <div className="flex md:flex-col gap-2 md:items-end">
                    <Button
                      variant="primary"
                      onClick={() => openOffer(app.job_offer_id)}
                    >
                      Ver oferta
                    </Button>

                    {rawStatus === "PENDING" && !assignment && (
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          if (confirm("¿Cancelar postulación?")) {
                            try {
                              await deleteApplication(app.id);

                              if (job?.created_by) {
                                notify({
                                  userId: Number(job.created_by),
                                  type: "APPLICATION_CANCELLED",
                                  title: "Postulación cancelada",
                                  message: `Un barista canceló su postulación para "${job.title}".`,
                                  payload: {
                                    job_offer_id: job.id,
                                    application_id: app.id,
                                  },
                                });
                              }

                              toast.push("Postulación cancelada");
                              setApplications((prev) =>
                                prev.filter((x) => x.id !== app.id)
                              );
                            } catch (err: any) {
                              toast.push(
                                err.message ||
                                  "No se pudo cancelar la postulación"
                              );
                            }
                          }
                        }}
                      >
                        Cancelar
                      </Button>
                    )}

                    {assignment && job && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setReviewAppId(
                            reviewAppId === app.id ? null : app.id
                          )
                        }
                      >
                        {reviewAppId === app.id
                          ? "Cerrar evaluación"
                          : "Evaluar cafetería"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Form evaluación */}
                {assignment && reviewAppId === app.id && job && (
                  <div className="px-4 pb-4">
                    <div className="border-t pt-4">
                      <ReviewForm
                        jobId={job.id}
                        applicationId={app.id}
                        fromUserId={Number(u.id)}
                        toUserId={job.created_by}
                        role="barista"
                        onDone={async () => {
                          toast.push("Evaluación enviada");
                          setReviewAppId(null);

                          // refrescar reseñas para que se vea reflejado
                          try {
                            if (userId == null) return;

                            const res = await getReviewsByUser(userId);
                            const map: Record<number, Review> = {};

                            for (const r of res.reviews || []) {
                              if (r.application_id != null) {
                                map[Number(r.application_id)] = r;
                              }
                            }

                            setReviewsByAppId(map);
                          } catch (e) {
                            console.error(
                              "No se pudo refrescar reviews",
                              e
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL OFERTA */}
      {showOfferModal && selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="font-semibold text-lg">{selectedJob.title}</div>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-5 grid gap-3 text-sm">
              <div>
                <b>Cafetería:</b> {selectedJob.company}
              </div>
              <div>
                <b>Ubicación:</b> {selectedJob.location}
              </div>
              <div>
                <b>Tipo:</b> {selectedJob.job_type}
              </div>
              <div>
                <b>Fechas:</b> {fmtDate(selectedJob.date_start)} →{" "}
                {fmtDate(selectedJob.date_end)}
              </div>
              {!!selectedJob.salary_range && (
                <div>
                  <b>Rango sueldo:</b> {selectedJob.salary_range}
                </div>
              )}
              <div>
                <b>Descripción:</b>
                <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                  {selectedJob.description}
                </p>
              </div>

              {!!selectedJob.requirements && (
                <div>
                  <b>Requisitos:</b>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                    {selectedJob.requirements}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end">
              <Button
                variant="primary"
                onClick={() => setShowOfferModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
