// src/features/dashboard/DashboardBarista.tsx

import { useEffect, useMemo, useState } from "react";

// UI
import Card from "../../components/Card";
import Button from "../../components/Button";

// API
import { getUserMock } from "../../api/auth";
import { getMyApplications, type MyApplication } from "../../api/jobApplication";
import { getAssignmentsByWorker, type Assignment } from "../../api/assignments";
import { getReviewsByUser, type ReviewsByUserResponse } from "../../api/review";

// Utils
import { parseSalaryRange } from "../../lib/salary";
import { exportToExcel } from "../../lib/exportExcel";

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Small KPI Card
function KPICard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4 flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
    </Card>
  );
}

export default function DashboardBarista() {
  const u = getUserMock();
  const userId = u?.id ?? null;
  const baristaName = u?.name ?? "—";

  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reviews, setReviews] = useState<ReviewsByUserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------------
  // FETCH DATA
  // -------------------------------------------------------------------
  useEffect(() => {
    async function loadAll() {
      try {
        if (!userId) return;

        const apps = await getMyApplications(userId);
        setApplications(apps);

        const ass = await getAssignmentsByWorker(userId);
        setAssignments(ass);

        const rev = await getReviewsByUser(userId);
        setReviews(rev);
      } catch (e) {
        console.error("Dashboard barista error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [userId]);

  // -------------------------------------------------------------------
  // METRICS
  // -------------------------------------------------------------------
  const metrics = useMemo(() => {
    if (loading) return null;

    const totalApps = applications.length;
    const rejected = applications.filter((a) => a.status === "rejected").length;

    // activas = no rechazadas ni completadas
    const active = applications.filter(
      (a) => a.status !== "rejected" && a.status !== "completed_confirmed"
    ).length;

    // completadas
    const completed = applications.filter(
      (a) => a.status === "completed_confirmed"
    );

    // monto ganado (salary_range viene embebido)
    let montoGanado = 0;
    completed.forEach((a) => {
      const appAny = a as any;
      const sr =
        appAny?.job_offer_salary_range ??
        appAny?.salary_range ??
        appAny?.job_offer?.salary_range ??
        null;
      montoGanado += parseSalaryRange(sr);
    });

    const ratingAvg = reviews?.rating_avg ?? 0;
    const reviewsCount = reviews?.reviews_count ?? 0;

    return {
      totalApps,
      active,
      rejected,
      completedCount: completed.length,
      montoGanado,
      ratingAvg,
      reviewsCount,
    };
  }, [loading, applications, reviews]);

  // -------------------------------------------------------------------
  // CHART DATA (postulaciones por estado)
  // -------------------------------------------------------------------
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((a) => {
      const s = a.status ?? "unknown";
      counts[s] = (counts[s] ?? 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [applications]);

  if (loading || !metrics)
    return <div className="p-6">Cargando Dashboard Barista…</div>;

  // -------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-semibold">Dashboard Barista</h1>
      <p className="text-sm text-gray-500">Resumen de tu actividad</p>

      {/* KPI GRID */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <KPICard label="Postulaciones Totales" value={metrics.totalApps} />
        <KPICard label="Activas" value={metrics.active} />
        <KPICard label="Rechazadas" value={metrics.rejected} />
        <KPICard label="Completadas" value={metrics.completedCount} />
        <KPICard label="Monto Ganado" value={`$${metrics.montoGanado}`} />
        <KPICard label="Rating Promedio" value={metrics.ratingAvg.toFixed(1)} />
        <KPICard label="Reseñas Recibidas" value={metrics.reviewsCount} />
      </div>

      {/* GRÁFICO: Postulaciones por Estado */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Postulaciones por Estado</h2>
        <div className="text-xs text-gray-500 mb-3">
          Distribución de tus postulaciones según su estado actual.
        </div>

        {chartData.length === 0 ? (
          <div className="text-sm text-gray-500">Aún no tienes postulaciones.</div>
        ) : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Tabla de últimas postulaciones */}
      <Card className="p-4">
        <h2 className="font-semibold mb-3">Últimas Postulaciones</h2>

        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="py-2">Oferta</th>
              <th className="py-2">Empresa</th>
              <th className="py-2">Estado</th>
              <th className="py-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {applications.slice(0, 10).map((a) => {
              const appAny = a as any;
              return (
                <tr key={a.id} className="border-b">
                  <td className="py-2">
                    {appAny?.job_offer_title ??
                      appAny?.job_offer?.title ??
                      `Oferta #${a.job_offer_id}`}
                  </td>
                  <td className="py-2">
                    {appAny?.job_offer_company ??
                      appAny?.job_offer?.company ??
                      "—"}
                  </td>
                  <td className="py-2">{a.status}</td>
                  <td className="py-2">
                    {appAny?.applied_at
                      ? new Date(appAny.applied_at).toLocaleDateString("es-CL")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* EXPORT EXCEL */}
      <Button
        onClick={() => {
          const rows: any[] = applications.map((a) => {
            const appAny = a as any;
            const salario = appAny?.job_offer_salary_range ??
                            appAny?.salary_range ??
                            appAny?.job_offer?.salary_range ??
                            "";

            return {
              Barista: baristaName,
              AplicacionID: a.id,
              OfertaID: a.job_offer_id,
              Oferta: appAny?.job_offer_title ?? appAny?.job_offer?.title ?? "",
              Cafeteria: appAny?.job_offer_company ?? appAny?.job_offer?.company ?? "",
              Estado: a.status,
              FechaPostulacion: appAny?.applied_at ?? "",
              Salario: salario,
            };
          });

          exportToExcel(rows, "mis_postulaciones.xlsx");
        }}
      >
        Exportar Postulaciones a Excel
      </Button>
    </div>
  );
}
