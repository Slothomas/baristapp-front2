// src/features/reviews/ReviewsDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useToast } from "../../components/Toast";
import { getUserMock } from "../../api/auth";

import { getAllJobOffers, type JobOffer } from "../../api/jobOffer";
import {
  getApplicantsForJob,
  completeApplication,
  type Applicant,
  type ApplicationStatus,
} from "../../api/jobApplication";

import ReviewForm from "./ReviewForm";

// cast temporal si ReviewForm aún no tiene applicationId en Props
const ReviewFormAny = ReviewForm as any;

// -------- helpers --------
const POST_WORK_STATUSES: ApplicationStatus[] = [
  "completed_by_worker",
  "completed_by_employer",
  "completed_confirmed",
];

// Heurística para detectar dueño de oferta sin saber el campo real
function isOfferOwnedByUser(offer: any, userId: number) {
  const candidates = [
    offer.user_id,
    offer.userId,
    offer.created_by,
    offer.createdBy,
    offer.owner_id,
    offer.ownerId,
    offer.employer_id,
    offer.employerId,
    offer.cafe_id,
    offer.cafeId,
  ];

  return candidates.some((v) => Number(v) === Number(userId));
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    hired: "Seleccionado",
    completed_by_worker: "Barista marcó completado",
    completed_by_employer: "Tú marcaste completado",
    completed_confirmed: "Trabajo completado",
  };
  return map[status] || status;
}

export default function ReviewsDashboard() {
  const u = getUserMock();
  const toast = useToast();

  const userId = Number(u?.id);
  const isCafe = u?.role === "cafe";

  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [appsByOffer, setAppsByOffer] = useState<Record<number, Applicant[]>>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<Record<number, boolean>>({});
  const [openOfferIds, setOpenOfferIds] = useState<Set<number>>(new Set());

  const [reviewTarget, setReviewTarget] = useState<{
    jobOfferId: number;
    applicationId: number;
    baristaId: number;
  } | null>(null);

  useEffect(() => {
    if (!u || !isCafe) return;

    async function fetchData() {
      setLoading(true);
      try {
        const allOffers = await getAllJobOffers();
        const myOffers = allOffers.filter((o: any) =>
          isOfferOwnedByUser(o, userId)
        );

        setOffers(myOffers);

        const byOffer: Record<number, Applicant[]> = {};

        for (const offer of myOffers) {
          const apps = await getApplicantsForJob(offer.id);

          const postApps = apps.filter((a) =>
            POST_WORK_STATUSES.includes(a.status as ApplicationStatus)
          );

          if (postApps.length) byOffer[offer.id] = postApps;
        }

        setAppsByOffer(byOffer);

        setOpenOfferIds(new Set(Object.keys(byOffer).map((k) => Number(k))));
      } catch (err: any) {
        console.error(err);
        toast.push(err.message || "No se pudo cargar trabajos realizados.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]); // ok

  const offersWithApps = useMemo(() => {
    return offers.filter((o) => appsByOffer[o.id]?.length);
  }, [offers, appsByOffer]);

  async function handleConfirmCompleted(app: Applicant) {
    if (!u) return;

    setCompleting((prev) => ({ ...prev, [app.id]: true }));
    try {
      await completeApplication(app.id, u.id, "employer");

      const apps = await getApplicantsForJob(app.job_offer_id);
      const postApps = apps.filter((a) =>
        POST_WORK_STATUSES.includes(a.status as ApplicationStatus)
      );

      setAppsByOffer((prev) => ({
        ...prev,
        [app.job_offer_id]: postApps,
      }));

      toast.push("Trabajo confirmado ✅");
    } catch (err: any) {
      console.error(err);
      toast.push(err.response?.data?.detail || "No se pudo confirmar.");
    } finally {
      setCompleting((prev) => ({ ...prev, [app.id]: false }));
    }
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Trabajos / Reseñas</h1>

      {!isCafe && (
        <Card className="p-4 text-sm text-gray-700">
          Esta vista es solo para cafeterías/restaurantes.
        </Card>
      )}

      {loading ? (
        <Card className="p-6">Cargando trabajos...</Card>
      ) : !offersWithApps.length ? (
        <Card className="p-6 text-sm text-gray-700">
          No tienes trabajos pendientes de confirmar o reseñar.
        </Card>
      ) : (
        <div className="grid gap-4">
          {offersWithApps.map((offer) => {
            const apps = appsByOffer[offer.id] || [];
            const isOpen = openOfferIds.has(offer.id);

            const pendientesConfirmar = apps.filter(
              (a) => a.status === "completed_by_worker"
            ).length;

            const pendientesResena = apps.filter((a) => {
              const ax = a as any;
              return (
                a.status === "completed_confirmed" &&
                !ax.employer_reviewed
              );
            }).length;

            return (
              <Card key={offer.id} className="p-4">
                <button
                  type="button"
                  onClick={() =>
                    setOpenOfferIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(offer.id)) next.delete(offer.id);
                      else next.add(offer.id);
                      return next;
                    })
                  }
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <div className="font-semibold">{offer.title}</div>
                    <div className="text-xs text-gray-500">
                      {offer.company} • {offer.location}
                    </div>
                  </div>

                  <div className="text-right text-xs text-gray-600">
                    <div>Confirmar: {pendientesConfirmar}</div>
                    <div>Reseñar: {pendientesResena}</div>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 grid gap-3">
                    {apps.map((app) => {
                      const ax = app as any; // para flags sin romper TS
                      const isWaitingMe =
                        app.status === "completed_by_worker";
                      const isWaitingOther =
                        app.status === "completed_by_employer";
                      const isConfirmed =
                        app.status === "completed_confirmed";

                      const alreadyReviewedByMe = !!ax.employer_reviewed;
                      const baristaReviewed = !!ax.worker_reviewed;

                      return (
                        <div
                          key={app.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium">
                              Barista ID: {app.user_id}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatStatus(app.status)}
                            </div>

                            {isConfirmed && (
                              <div className="text-xs text-gray-500 mt-1">
                                {baristaReviewed
                                  ? "✅ Barista ya dejó su reseña"
                                  : "⏳ Barista aún no reseña"}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isWaitingOther && (
                              <span className="text-xs text-gray-600">
                                Esperando confirmación del barista
                              </span>
                            )}

                            {isWaitingMe && (
                              <Button
                                onClick={() => handleConfirmCompleted(app)}
                                disabled={!!completing[app.id]}
                              >
                                {completing[app.id]
                                  ? "Confirmando..."
                                  : "Confirmar completado"}
                              </Button>
                            )}

                            {isConfirmed && !alreadyReviewedByMe && (
                              <Button
                                variant="primary"
                                onClick={() =>
                                  setReviewTarget({
                                    jobOfferId: offer.id,
                                    applicationId: app.id,
                                    baristaId: app.user_id,
                                  })
                                }
                              >
                                Dejar reseña
                              </Button>
                            )}

                            {isConfirmed && alreadyReviewedByMe && (
                              <span className="text-xs text-green-700 font-medium">
                                ✅ Ya reseñaste
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal reseña */}
      {reviewTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Dejar reseña</h2>
              <button
                className="text-xl"
                onClick={() => setReviewTarget(null)}
              >
                ✕
              </button>
            </div>

            <ReviewFormAny
              jobId={reviewTarget.jobOfferId}
              applicationId={reviewTarget.applicationId}
              fromUserId={userId}
              toUserId={reviewTarget.baristaId}
              role="cafe"
              onDone={async () => {
                toast.push("Reseña enviada ✅");
                setReviewTarget(null);

                // refrescar oferta para ocultar el botón
                try {
                  const apps = await getApplicantsForJob(
                    reviewTarget.jobOfferId
                  );
                  const postApps = apps.filter((a) =>
                    POST_WORK_STATUSES.includes(
                      a.status as ApplicationStatus
                    )
                  );

                  setAppsByOffer((prev) => ({
                    ...prev,
                    [reviewTarget.jobOfferId]: postApps,
                  }));
                } catch (e) {
                  console.error("No se pudo refrescar apps", e);
                }
              }}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
