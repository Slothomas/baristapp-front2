import { useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useToast } from "../../components/Toast";
import { getUserMock } from "../../api/auth";
import {
  getApplicationsByUser,
  removeApplication,
  type Application,
} from "../../store/applyStore";
import { getJobById } from "../../store/jobsStore";
import ReviewForm from "../reviews/ReviewForm";

function fmtDT(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
}

export default function MyApplications() {
  const u = getUserMock();
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const [reviewJob, setReviewJob] = useState<string | null>(null); // jobId a evaluar

  const apps: Application[] = useMemo(
    () => (u ? getApplicationsByUser(u.id) : []),
    [u, tick]
  );

  if (!u) return (
    <AppLayout>
      <Card className="p-6">Inicia sesión</Card>
    </AppLayout>
  );
  if (u.role !== "barista") return (
    <AppLayout>
      <Card className="p-6">Solo baristas pueden ver esta sección</Card>
    </AppLayout>
  );

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Mis postulaciones</h1>

      {apps.length === 0 ? (
        <Card className="p-6 text-sm text-gray-700">Aún no has postulado a vacantes.</Card>
      ) : (
        <div className="grid gap-4">
          {apps.map(a => {
            const job = getJobById(a.jobId);
            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{job?.title || `Turno ${a.jobId}`}</div>
                    <div className="text-sm text-gray-600">{job?.location}</div>
                    <div className="text-xs text-gray-500">
                      {fmtDT(job?.startISO)} — {fmtDT(job?.endISO)}
                    </div>
                    <div className="mt-1 text-sm">
                      Estado: <b className="capitalize">{a.status}</b>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {a.status === "pendiente" && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (confirm("¿Cancelar postulación?")) {
                            removeApplication(a.id);
                            toast.push("Postulación cancelada");
                            setTick(t => t + 1);
                          }
                        }}
                      >
                        Cancelar
                      </Button>
                    )}

                    {/* evaluar cafetería cuando fue aceptado */}
                    {a.status === "aceptado" && job?.ownerId && (
                      <Button
                        variant="secondary"
                        onClick={() => setReviewJob(cur => (cur === a.jobId ? null : a.jobId))}
                      >
                        {reviewJob === a.jobId ? "Cerrar evaluación" : "Evaluar cafetería"}
                      </Button>
                    )}
                  </div>
                </div>

                {a.status === "aceptado" && reviewJob === a.jobId && job?.ownerId && (
                  <div className="mt-4 border-t pt-4">
                    <ReviewForm
                      jobId={a.jobId}
                      fromUserId={u.id}          // barista logueado
                      toUserId={job.ownerId}     // cafetería
                      role="cafe"                // evaluamos a la cafetería
                      onDone={() => {
                        setReviewJob(null);
                        toast.push("Evaluación enviada");
                      }}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
