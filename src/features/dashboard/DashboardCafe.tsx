import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { getUserMock } from "../../api/auth";

// APIs
import { getAllJobOffers, type JobOffer } from "../../api/jobOffer";
import { getAssignmentsByClient } from "../../api/assignments";
import { getReviewsByUser } from "../../api/review";

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

// -----------------------------------------------------------------------------
// MINI COMPONENTE KPI
// -----------------------------------------------------------------------------
function KPICard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <Card className={`p-4 flex flex-col justify-between ${className}`}>
      <span className="text-sm opacity-80">{label}</span>
      <span className="text-2xl font-semibold mt-1">{value}</span>
    </Card>
  );
}

// helpers para estados
function isCompletedStatus(raw: any): boolean {
  const st = String(raw ?? "").toLowerCase();
  return st === "completed" || st.includes("completado") || st.includes("cerrado");
}

function isHiredStatus(raw: any): boolean {
  const st = String(raw ?? "").toLowerCase();
  return (
    st === "assigned" ||
    st === "hired" ||
    st.includes("asignado") ||
    st.includes("contratado")
  );
}

// helper para fechas
function inRange(
  dateIso: string | null | undefined,
  from: Date | null,
  to: Date | null
) {
  if (!dateIso) return true;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return true;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export default function DashboardCafe() {
  const u = getUserMock();
  const cafeName = u?.name ?? "—";
  const userId = u?.id ?? null;

  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // filtro de fechas
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // ----------------------------------------------------------------------------
  // FETCH
  // ----------------------------------------------------------------------------
  useEffect(() => {
    async function loadAll() {
      try {
        if (!userId) return;

        const allOffers = await getAllJobOffers();
        setOffers(allOffers);

        const a = await getAssignmentsByClient(userId);
        setAssignments(a);

        const r = await getReviewsByUser(userId);
        setReviews(r);
      } catch (e) {
        console.error("Dashboard cafe error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [userId]);

  const fromDate = useMemo(
    () => (dateFrom ? new Date(dateFrom + "T00:00:00") : null),
    [dateFrom]
  );
  const toDate = useMemo(
    () => (dateTo ? new Date(dateTo + "T23:59:59") : null),
    [dateTo]
  );

  // ----------------------------------------------------------------------------
  // FILTROS POR CAFÉ + RANGO FECHAS
  // ----------------------------------------------------------------------------

  // 1) assignments filtrados por fecha
  const assignmentsFiltered = useMemo(() => {
    if (!assignments?.length) return [];
    return assignments.filter((a: any) =>
      inRange(a.created_at ?? a.assigned_at ?? null, fromDate, toDate)
    );
  }, [assignments, fromDate, toDate]);

  // 2) ofertas relacionadas al café: todas las que aparecen en assignments
  const offersForClient = useMemo(() => {
    const ids = new Set<number>(
      assignments.map((a: any) => a.job_offer_id as number)
    );

    const base = offers.filter((o) => ids.has(o.id));

    return base.filter((o: any) =>
      inRange(o.date_start ?? o.created_at ?? null, fromDate, toDate)
    );
  }, [offers, assignments, fromDate, toDate]);

  // 3) assignments "contratados" (assigned o completed)
  const hiredAssignments = useMemo(
    () =>
      assignmentsFiltered.filter(
        (a: any) => isHiredStatus(a.status) || isCompletedStatus(a.status)
      ),
    [assignmentsFiltered]
  );

  // ----------------------------------------------------------------------------
  // MÉTRICAS
  // ----------------------------------------------------------------------------
  const metrics = useMemo(() => {
    if (loading) return null;

    const totalOffers = offersForClient.length;

    const ofertasAbiertas = offersForClient.filter((o: any) => {
      const st = String(o.status ?? "").toUpperCase();
      return st === "PUBLICADO";
    }).length;

    const ofertasCerradas = offersForClient.filter((o: any) => {
      const st = String(o.status ?? "").toUpperCase();
      return st === "CERRADO";
    }).length;

    const totalPostulaciones = assignmentsFiltered.length;

    const contratados = hiredAssignments.length;

    let montoPagado = 0;
    hiredAssignments.forEach((as: any) => {
      const off = offersForClient.find((o: any) => o.id === as.job_offer_id);
      const raw = (off as any)?.salary_range ?? null;

      let valor = 0;
      if (typeof raw === "number") {
        valor = raw;
      } else if (typeof raw === "string") {
        const clean = raw.replace(/[^0-9]/g, "");
        const n = Number.parseInt(clean, 10);
        if (!Number.isNaN(n)) valor = n;
      }
      montoPagado += valor;
    });

    return {
      totalOffers,
      ofertasAbiertas,
      ofertasCerradas,
      totalPostulaciones,
      contratados,
      montoPagado,
      ratingAvg: reviews?.rating_avg ?? 0,
      reviewsCount: reviews?.reviews_count ?? 0,
      offersForClient,
      assignmentsFiltered,
      hiredAssignments,
    };
  }, [loading, offersForClient, assignmentsFiltered, hiredAssignments, reviews]);

  // ----------------------------------------------------------------------------
  // GRÁFICO: Contratados por día
  // ----------------------------------------------------------------------------
  const chartData = useMemo(() => {
    const counts = new Map<string, number>();

    metrics?.hiredAssignments.forEach((a: any) => {
      const iso = a.assigned_at ?? a.created_at ?? null;
      if (!iso) return;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return;

      const key = d.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
      });

      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    // ordenar por fecha real
    const arr = Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    arr.sort((a, b) => {
      const [da, ma] = a.name.split("/").map(Number);
      const [db, mb] = b.name.split("/").map(Number);
      const d1 = new Date(2025, (ma ?? 1) - 1, da ?? 1).getTime();
      const d2 = new Date(2025, (mb ?? 1) - 1, db ?? 1).getTime();
      return d1 - d2;
    });

    return arr;
  }, [metrics?.hiredAssignments]);

  if (loading || !metrics) return <div className="p-6">Cargando…</div>;

  const { offersForClient: offersClient } = metrics;

  // ----------------------------------------------------------------------------
  // UI
  // ----------------------------------------------------------------------------
  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard Cafetería</h1>
          <p className="text-sm text-gray-500">Resumen general</p>
        </div>

        {/* Filtro de fechas */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
          >
            Limpiar filtro
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <KPICard
          label="Ofertas totales"
          value={metrics.totalOffers}
          className="bg-sky-50 border-sky-100 text-sky-900"
        />
        <KPICard
          label="Ofertas abiertas"
          value={metrics.ofertasAbiertas}
          className="bg-emerald-50 border-emerald-100 text-emerald-900"
        />
        <KPICard
          label="Ofertas cerradas"
          value={metrics.ofertasCerradas}
          className="bg-slate-50 border-slate-200 text-slate-900"
        />
        <KPICard
          label="Contratados"
          value={metrics.contratados}
          className="bg-violet-50 border-violet-100 text-violet-900"
        />
        <KPICard
          label="Postulaciones totales"
          value={metrics.totalPostulaciones}
          className="bg-cyan-50 border-cyan-100 text-cyan-900"
        />
        <KPICard
          label="Monto pagado"
          value={
            metrics.montoPagado > 0
              ? `$${metrics.montoPagado.toLocaleString("es-CL")}`
              : "$0"
          }
          className="bg-amber-50 border-amber-100 text-amber-900"
        />
        <KPICard
          label="Rating promedio"
          value={
            metrics.ratingAvg && metrics.ratingAvg > 0
              ? metrics.ratingAvg.toFixed(1)
              : "—"
          }
          className="bg-rose-50 border-rose-100 text-rose-900"
        />
      </div>

      {/* GRÁFICO: Contratados por día */}
      <Card className="p-4">
        <h2 className="font-semibold mb-1">Contratados por día</h2>
        <p className="text-xs text-gray-500 mb-3">
          Cantidad de baristas contratados por día en el período seleccionado.
        </p>

        {chartData.length === 0 ? (
          <div className="text-sm text-gray-500">
            Aún no tienes baristas contratados en el período seleccionado.
          </div>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* TABLA: Ofertas asociadas a este café */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Ofertas relacionadas</h2>
        {offersClient.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no hay ofertas asociadas en el período seleccionado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Oferta</th>
                <th>Empresa</th>
                <th>Estado</th>
                <th>Vacantes</th>
              </tr>
            </thead>
            <tbody>
              {offersClient.map((o: any) => (
                <tr key={o.id} className="border-b">
                  <td className="py-2">{o.title}</td>
                  <td>{o.company}</td>
                  <td>{o.status}</td>
                  <td>
                    {o.vacancies_filled ?? 0} / {o.vacancies_total ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* RESEÑAS (al final) */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Últimas reseñas</h2>
        {!reviews?.reviews?.length ? (
          <p className="text-sm text-gray-500">No tienes reseñas aún.</p>
        ) : (
          reviews.reviews.slice(0, 3).map((r: any) => (
            <div key={r.id} className="border-b pb-2 mb-2">
              <div className="font-semibold">{r.rating} ★</div>
              <p className="text-gray-600 text-sm">{r.comment}</p>
              <p className="text-xs text-gray-400">
                {r.created_at
                  ? new Date(r.created_at).toLocaleString("es-CL", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : r.created_at}
              </p>
            </div>
          ))
        )}
      </Card>

      {/* EXPORT A EXCEL */}
      <Button
        onClick={() => {
          const rows: any[] = [];

          metrics.assignmentsFiltered.forEach((a: any) => {
            const off = offersClient.find((o: any) => o.id === a.job_offer_id);
            rows.push({
              Oferta: off?.title ?? a.job_offer_id,
              Empresa: off?.company ?? "",
              Cafeteria: cafeName,
              BaristaID: a.worker_id,
              EstadoTrabajo: a.status,
              Fecha: a.created_at,
              SalarioOferta: (off as any)?.salary_range ?? null,
            });
          });

          exportToExcel(rows, "trabajos_cafeteria.xlsx");
        }}
      >
        Exportar trabajos a Excel
      </Button>
    </div>
  );
}
