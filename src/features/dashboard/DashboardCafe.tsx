import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { getUserMock } from "../../api/auth";

// APIs provisionales
import { getAllJobOffers } from "../../api/jobOffer";
import { getApplicationWithOffer } from "../../api/jobApplication";
import { getAssignmentsByClient } from "../../api/assignments";
import { getReviewsByUser } from "../../api/review";

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

// MINI COMPONENTE KPICard
function KPICard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4 flex flex-col">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </Card>
  );
}

export default function DashboardCafe() {
  const u = getUserMock();
  const cafeName = u?.name ?? "—";
  const userId = u?.id ?? null;

  const [offers, setOffers] = useState<any[]>([]);
  const [appsByOffer, setAppsByOffer] = useState<Record<number, any[]>>({});
  const [assignments, setAssignments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------------------------
  // FETCH
  // ----------------------------------------------------------------------------
  useEffect(() => {
    async function loadAll() {
      try {
        if (!userId) return;

        // 1) Traer todas y filtrar solo las del café logueado
        const allOffers = await getAllJobOffers();
        const offersData = allOffers.filter(
          (o: any) => o.created_by === userId
        );
        setOffers(offersData);

        // 2) Postulaciones por oferta en paralelo
        const results = await Promise.all(
          offersData.map(async (o: any) => {
            // TODO: cuando exista endpoint real por oferta:
            // getApplicationsByJobOffer(o.id)
            const x = await getApplicationWithOffer(o.id);
            return [o.id, x ? [x] : []] as const;
          })
        );
        const dict = Object.fromEntries(results);
        setAppsByOffer(dict);

        // 3) Assignments por cliente (cafetería)
        const a = await getAssignmentsByClient(userId);
        setAssignments(a);

        // 4) Reseñas recibidas por cafetería
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

  // ----------------------------------------------------------------------------
  // METRICS
  // ----------------------------------------------------------------------------
  const metrics = useMemo(() => {
    if (loading) return null;

    const totalOffers = offers.length;
    const activeOffers = offers.filter((o) => o.is_active).length;

    let totApps = 0;
    let hired = 0;

    offers.forEach((o) => {
      const apps = appsByOffer[o.id] ?? [];
      totApps += apps.length;
      hired += apps.filter((a) => a.status === "hired").length;
    });

    const completed = assignments.filter((a) => a.status === "completed");
    const completedCount = completed.length;

    let gastoCompletado = 0;
    completed.forEach((as: any) => {
      const off = offers.find((o) => o.id === as.job_offer_id);
      gastoCompletado += parseSalaryRange(off?.salary_range);
    });

    let montoPotencial = 0;
    offers.forEach((o) => {
      const apps = appsByOffer[o.id] ?? [];
      apps
        .filter((a) => a.status === "hired")
        .forEach(() => {
          montoPotencial += parseSalaryRange(o.salary_range);
        });
    });

    return {
      totalOffers,
      activeOffers,
      totApps,
      hired,
      completedCount,
      gastoCompletado,
      montoPotencial,
      ratingAvg: reviews?.rating_avg ?? 0,
      reviewsCount: reviews?.reviews_count ?? 0,
    };
  }, [loading, offers, appsByOffer, assignments, reviews]);

  // ----------------------------------------------------------------------------
  // CHART DATA
  // ----------------------------------------------------------------------------
  const chartData = useMemo(() => {
    return offers.map((o) => ({
      name: o.title,
      postulaciones: (appsByOffer[o.id] ?? []).length,
    }));
  }, [offers, appsByOffer]);

  if (loading || !metrics) return <div className="p-6">Cargando…</div>;

  // ----------------------------------------------------------------------------
  // UI
  // ----------------------------------------------------------------------------
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-semibold">Dashboard Cafetería</h1>
      <p className="text-sm text-gray-500">Resumen general</p>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <KPICard label="Ofertas" value={metrics.totalOffers} />
        <KPICard label="Activas" value={metrics.activeOffers} />
        <KPICard label="Postulaciones" value={metrics.totApps} />
        <KPICard label="Contrataciones" value={metrics.hired} />
        <KPICard label="Completados" value={metrics.completedCount} />
        <KPICard
          label="Gasto Completado"
          value={`$${metrics.gastoCompletado}`}
        />
        <KPICard label="Monto Pot." value={`$${metrics.montoPotencial}`} />
        <KPICard label="Rating Prom." value={metrics.ratingAvg.toFixed(1)} />
      </div>

      {/* FUNNEL SIMPLE */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Funnel de Conversión</h2>
        <ul className="text-sm space-y-1">
          <li>Publicadas: {metrics.totalOffers}</li>
          <li>Recibidas: {metrics.totApps}</li>
          <li>Contratadas (hired): {metrics.hired}</li>
          <li>Hechas (completed): {metrics.completedCount}</li>
        </ul>
      </Card>

      {/* GRÁFICO: Postulaciones por Oferta */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Postulaciones por Oferta</h2>
        <div className="text-xs text-gray-500 mb-3">
          Cantidad de postulaciones recibidas por cada oferta publicada.
        </div>

        {chartData.length === 0 ? (
          <div className="text-sm text-gray-500">Aún no hay ofertas.</div>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={70}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="postulaciones" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* TABLA */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Ofertas publicadas</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th>Oferta</th>
              <th>Activa</th>
              <th>Postulantes</th>
              <th>Vacantes</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => {
              const apps = appsByOffer[o.id] ?? [];
              return (
                <tr key={o.id} className="border-b">
                  <td className="py-2">{o.title}</td>
                  <td>{o.is_active ? "Sí" : "No"}</td>
                  <td>{apps.length}</td>
                  <td>
                    {o.vacancies_filled ?? 0} / {o.vacancies_total ?? 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* RESEÑAS */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Últimas Reseñas</h2>
        {!reviews?.reviews?.length ? (
          <p className="text-sm text-gray-500">No tienes reseñas aún.</p>
        ) : (
          reviews.reviews.slice(0, 3).map((r: any) => (
            <div key={r.id} className="border-b pb-2 mb-2">
              <div className="font-semibold">{r.rating} ★</div>
              <p className="text-gray-600 text-sm">{r.comment}</p>
              <p className="text-xs text-gray-400">{r.created_at}</p>
            </div>
          ))
        )}
      </Card>

      {/* EXPORT EXCEL */}
      <Button
        onClick={() => {
          const rows: any[] = [];

          offers.forEach((offer) => {
            const apps = appsByOffer[offer.id] ?? [];
            apps.forEach((a) => {
              rows.push({
                Oferta: offer.title,
                Cafeteria: cafeName,
                PostulanteID: a.user_id,
                Estado: a.status,
                FechaPostulacion: a.applied_at,
                Salario: offer.salary_range,
              });
            });
          });

          exportToExcel(rows, "postulantes.xlsx");
        }}
      >
        Exportar Excel
      </Button>
    </div>
  );
}
