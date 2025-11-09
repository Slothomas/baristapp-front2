import { useParams, Link } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { listByJob, updateApplicationStatus } from "../../store/applyStore";
import { getJobById } from "../../store/jobsStore";
import { getUserMock } from "../../api/auth";
import { useToast } from "../../components/Toast";
import { useState } from "react";
import { pushNotification } from "../../store/notifyStore";

export default function ApplicationsByJob() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, setTick] = useState(0); // solo para forzar re-render
  const user = getUserMock();
  const toast = useToast();

  if (!user) {
    return (
      <AppLayout>
        <Card className="p-6">Inicia sesión para ver postulaciones.</Card>
      </AppLayout>
    );
  }

  const job = getJobById(jobId!);
  const apps = listByJob(jobId!);

  if (!job) {
    return (
      <AppLayout>
        <Card className="p-6">Vacante no encontrada.</Card>
      </AppLayout>
    );
  }

  if (user.role !== "cafe") {
    return (
      <AppLayout>
        <Card className="p-6">
          Solo las cafeterías pueden ver las postulaciones a sus vacantes.
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-3">Postulaciones</h1>
        <p className="text-gray-600 mb-6">
          Turno: <b>{job.title}</b> — {job.location}
        </p>

        {apps.length === 0 ? (
          <Card className="p-6 text-sm text-gray-600">
            No hay postulaciones para esta vacante todavía.
          </Card>
        ) : (
          <div className="grid gap-4">
            {apps.map((a) => (
              <Card key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">Barista #{a.userId}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    Estado: {a.status}
                  </div>
                  <div className="text-xs text-gray-500">
                    Postuló el{" "}
                    {new Date(a.createdAt).toLocaleString("es-CL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/app/users/${a.userId}`}
                    className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    Ver perfil
                  </Link>

                  {a.status === "pendiente" && (
                    <>
                      <Button
                        variant="primary"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          updateApplicationStatus(a.id, "aceptado");
                          pushNotification({
                            message: `Postulación aceptada de ${a.userId}`,
                            type: "success",
                          });
                          toast.push("Postulación aceptada");
                          setTick((t) => t + 1);
                        }}
                      >
                        Aceptar
                      </Button>

                      <Button
                        variant="secondary"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => {
                          updateApplicationStatus(a.id, "rechazado");
                          pushNotification({
                            message: `Postulación rechazada de ${a.userId}`,
                            type: "warning",
                          });
                          toast.push("Postulación rechazada");
                          setTick((t) => t + 1);
                        }}
                      >
                        Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
