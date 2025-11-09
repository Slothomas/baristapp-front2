import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useToast } from "../../components/Toast";
import { isApplied, addApplication } from "../../store/applyStore";
import { listActiveJobs, type Job } from "../../store/jobsStore";
import { getUserMock } from "../../api/auth";

function fmtCLP(n?: number) {
  const v = n ?? 0;
  return v.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}
function fmtDT(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
}

export default function JobsList() {
  const u = getUserMock();
  const toast = useToast();
  const [data, setData] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setVersion] = useState(0);

  useEffect(() => {
    setData(listActiveJobs());
    setLoading(false);
  }, []);

  const visible = useMemo(() => {
    // solo los baristas lo ven y postulan
    if (u?.role === "barista") return data;
    return [];
  }, [data, u?.role]);

  function apply(jobId: string) {
    if (!u) return toast.push("Debes iniciar sesión");
    if (isApplied(jobId, u.id)) return toast.push("Ya postulaste a esta vacante");
    addApplication(jobId, u.id);
    toast.push("Postulación enviada (demo)");
    setVersion((v) => v + 1);
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Vacantes</h1>

      {u?.role !== "barista" && (
        <Card className="p-4 mb-4 text-sm text-gray-700">
          Esta vista está pensada para <b>baristas</b>. Inicia sesión como barista para ver y postular.
        </Card>
      )}

      {loading ? (
        <Card className="p-6">Cargando…</Card>
      ) : visible.length === 0 ? (
        <Card className="p-6 text-sm text-gray-700">No hay vacantes activas por ahora.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((j) => {
            const applied = u ? isApplied(j.id, u.id) : false;
            return (
              <Card key={j.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-medium">{j.title}</h2>
                    <p className="text-sm text-gray-600">{j.location ?? "—"}</p>
                    {j.description && <p className="text-sm mt-2">{j.description}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      {fmtDT(j.startISO)} — {fmtDT(j.endISO)}
                    </div>
                    <div className="font-semibold">{fmtCLP(j.payCLP)}</div>
                  </div>
                </div>
                {j.requirements && (
                  <p className="text-xs text-gray-600 mt-2">Req: {j.requirements}</p>
                )}
                <div className="mt-4">
                  <Button
                    variant={applied ? "secondary" : "primary"}
                    disabled={applied}
                    onClick={() => apply(j.id)}
                  >
                    {applied ? "Postulado" : "Postular"}
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
