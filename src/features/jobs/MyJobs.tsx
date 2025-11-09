import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { getUserMock } from "../../api/auth";
import { listJobsByOwner, toggleJobActive, removeJob } from "../../store/jobsStore";
import { listByJob } from "../../store/applyStore";
import { useMemo, useState } from "react";

export default function MyJobs() {
  const u = getUserMock();
  const [tick, setTick] = useState(0);

  const list = useMemo(() => (u ? listJobsByOwner(u.id) : []), [u, tick]);

  if (!u) return (
    <AppLayout>
      <Card className="p-6">Inicia sesión</Card>
    </AppLayout>
  );
  if (u.role !== "cafe") return (
    <AppLayout>
      <Card className="p-6">Solo cafeterías</Card>
    </AppLayout>
  );

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Mis vacantes</h1>

      {list.length === 0 ? (
        <Card className="p-6 text-sm text-gray-700">
          Aún no has publicado vacantes. Ve a <b>Publicar</b> para crear una.
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.map(j => {
            const count = listByJob(j.id).length;
            return (
              <Card key={j.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{j.title}</div>
                  <div className="text-sm text-gray-600">{j.location}</div>
                  <div className="text-xs mt-1">
                    Estado: <b>{j.active ? "Visible" : "Oculta"}</b> · Postulantes: <b>{count}</b>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/app/jobs/${j.id}/applications`}
                    className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-100"
                  >
                    Ver postulantes
                  </a>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      toggleJobActive(j.id, !j.active);
                      setTick(t => t + 1);
                    }}
                  >
                    {j.active ? "Ocultar" : "Mostrar"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (confirm("¿Eliminar vacante?")) {
                        removeJob(j.id);
                        setTick(t => t + 1);
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
