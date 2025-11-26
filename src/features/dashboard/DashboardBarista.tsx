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

// -------------------------------------------------------------------
// Small KPI Card con colores
// -------------------------------------------------------------------
function KPICard({
  label,
  value,
  color = "blue",
}: {
  label: string;
  value: string | number;
  color?: "blue" | "green" | "orange" | "gray";
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    gray: "bg-gray-50 border-gray-200 text-gray-700",
  };

  return (
    <Card className={`p-4 flex flex-col border shadow ${colorMap[color]}`}>
      <span className="text-sm">{label}</span>
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

  // filtros de fecha
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

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
  // APLICAR FILTRO DE FECHA A LAS POSTULACIONES
  // -------------------------------------------------------------------
  const filteredApps = useMemo(() => {
    if (!dateFrom && !dateTo) return applications;

    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return applications.filter((a) => {
      const appAny = a as any;
      const appliedRaw = appAny?.applied_at ?? (a as any).applied_at;
      if (!appliedRaw) return true;

      const applied = new Date(appliedRaw);

      if (from && applied < from) return false;
      if (to && applied > to) return false;

      return true;
    });
  }, [applications, dateFrom, dateTo]);

  // -------------------------------------------------------------------
  // METRICS
  // -------------------------------------------------------------------
  const metrics = useMemo(() => {
    if (loading) return null;

    const totalApps = filteredApps.length;
    const rejected = filteredApps.filter((a) => a.status === "rejected").length;

    const active = filteredApps.filter(
      (a) => a.status !== "rejected" && a.status !== "completed_confirmed"
    ).length;

    const completed = filteredApps.filter(
      (a) => a.status === "completed_confirmed"
    );

    // monto ganado
    let montoGanado = 0;
    completed.forEach((a) => {
      const appAny = a as any;

      const raw =
        appAny?.job_offer_salary_range ??
        appAny?.salary_range ??
        appAny?.job_offer?.salary_range ??
        0;

      const numero = Number(raw);
      if (!Number.isNaN(numero)) {
        montoGanado += numero;
      }
    });

    return {
      totalApps,
      active,
      rejected,
      completedCount: completed.length,
      montoGanado,
      ratingAvg: reviews?.rating_avg ?? 0,
      reviewsCount: reviews?.reviews_count ?? 0,
    };
  }, [loading, filteredApps, reviews]);

  // -------------------------------------------------------------------
  // CHART DATA
  // -------------------------------------------------------------------
  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    under_review: "En revisión",
    interview_scheduled: "Entrevista agendada",
    interviewed: "Entrevistado",
    offered: "Oferta enviada",
    hired: "Contratado",
    rejected: "Rechazado",
    completed_by_employer: "Completado por empleador",
    completed_by_worker: "Completado por barista",
    completed_confirmed: "Trabajo completado",
    unknown: "Desconocido",
  };

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredApps.forEach((a) => {
      const s = a.status ?? "unknown";
      counts[s] = (counts[s] ?? 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      status: statusLabels[status] ?? status,
      count,
    }));
  }, [filteredApps]);

  if (loading || !metrics)
    return <div className="p-6">Cargando Dashboard Barista…</div>;

  // -------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------
  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard Barista</h1>
          <p className="text-sm text-gray-500">Resumen de tu actividad</p>
        </div>

        {/* Filtros de fecha */}
        <div className="flex gap-4">
          <div className="flex flex-col text-sm">
            <label className="text-gray-600 mb-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col text-sm">
            <label className="text-gray-600 mb-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <KPICard
          label="Postulaciones Totales"
          value={metrics.totalApps}
          color="blue"
        />
        <KPICard label="Activas" value={metrics.active} color="green" />
        <KPICard
          label="Rechazadas"
          value={metrics.rejected}
          color="orange"
        />
        <KPICard
          label="Completadas"
          value={metrics.completedCount}
          color="green"
        />
        <KPICard
          label="Monto Ganado"
          value={
            metrics.montoGanado > 0
              ? `$${metrics.montoGanado.toLocaleString("es-CL")}`
              : "$0"
          }
          color="green"
        />
        <KPICard
          label="Rating Promedio"
          value={metrics.ratingAvg.toFixed(1)}
          color="gray"
        />
        <KPICard
          label="Reseñas Recibidas"
          value={metrics.reviewsCount}
          color="blue"
        />
      </div>

      {/* GRÁFICO */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Postulaciones por Estado</h2>
        <div className="text-xs text-gray-500 mb-3">
          Distribución de tus postulaciones según su estado actual
          {dateFrom || dateTo ? " (filtradas por fecha)." : "."}
        </div>

        {chartData.length === 0 ? (
          <div className="text-sm text-gray-500">
            Aún no tienes postulaciones en el rango seleccionado.
          </div>
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

      {/* Tabla */}
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
            {filteredApps.slice(0, 10).map((a) => {
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
                      appAny?.company ??
                      appAny?.job_offer?.company ??
                      "Sin info"}
                  </td>

                  <td className="py-2">
                    {statusLabels[a.status] ?? a.status}
                  </td>

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

      {/* Export Excel */}
      <Button
        onClick={() => {
          const rows: any[] = filteredApps.map((a) => {
            const appAny = a as any;

            const rawSalario =
              appAny?.job_offer_salary_range ??
              appAny?.salary_range ??
              appAny?.job_offer?.salary_range ??
              0;

            return {
              Barista: baristaName,
              AplicacionID: a.id,
              OfertaID: a.job_offer_id,
              Oferta:
                appAny?.job_offer_title ?? appAny?.job_offer?.title ?? "",
              Cafeteria:
                appAny?.job_offer_company ??
                appAny?.company ??
                appAny?.job_offer?.company ??
                "",
              Estado: statusLabels[a.status] ?? a.status,
              FechaPostulacion: appAny?.applied_at ?? "",
              Salario: rawSalario,
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
