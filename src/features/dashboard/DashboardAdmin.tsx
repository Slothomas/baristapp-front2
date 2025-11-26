import { useEffect, useState, useMemo } from "react";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";

// API
import {
  getAdminMetricsSummary,
  type AdminMetricsSummary,
} from "../../api/adminMetrics";

import {
  getGigPayments,
  type GigPayment,
} from "../../api/gigPayments";

import {
  getJobOfferById,
  type JobOffer,
} from "../../api/jobOffer";

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type DateRange = "all" | "30d" | "90d";

// =========================
// KPI CARD estilo A
// =========================
function KPICard({
  label,
  value,
  subtitle,
  tone = "default",
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  tone?: "default" | "primary" | "success" | "warning" | "info";
}) {
  const toneClasses: Record<string, string> = {
    default: "border-gray-200",
    primary: "border-purple-500 bg-purple-50/40",
    success: "border-emerald-500 bg-emerald-50/40",
    warning: "border-amber-500 bg-amber-50/40",
    info: "border-blue-500 bg-blue-50/40",
  };

  return (
    <Card
      className={`p-4 flex flex-col gap-1 border-t-4 ${toneClasses[tone]} transition`}
    >
      <span className="text-xs uppercase tracking-wide text-gray-600">
        {label}
      </span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
    </Card>
  );
}

// =========================
// Helpers
// =========================
function formatCLP(value: number): string {
  if (!value) return "$0";
  return value.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// =========================
// Agrupar pagos por mes
// =========================
function buildMonthlyChartData(payments: GigPayment[]) {
  const map = new Map<
    string,
    { month: string; plataforma: number; baristas: number }
  >();

  for (const p of payments) {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    if (!map.has(key)) {
      map.set(key, { month: key, plataforma: 0, baristas: 0 });
    }

    const item = map.get(key)!;
    const plataformaFee = p.fee_amount_cafe + p.fee_amount_barista;

    item.plataforma += plataformaFee;
    item.baristas += p.net_amount_barista;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
}

// =========================
// Filtros de fecha
// =========================
function getDateRange(range: DateRange): { from?: string; to?: string } {
  if (range === "all") return {};

  const now = new Date();
  const to = now.toISOString();

  const fromDate = new Date(now);
  if (range === "30d") fromDate.setDate(fromDate.getDate() - 30);
  if (range === "90d") fromDate.setDate(fromDate.getDate() - 90);

  return { from: fromDate.toISOString(), to };
}

// =========================
// COMPONENTE PRINCIPAL
// =========================
export default function DashboardAdmin() {
  const [data, setData] = useState<AdminMetricsSummary | null>(null);
  const [payments, setPayments] = useState<GigPayment[]>([]);
  const [offerTitles, setOfferTitles] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("all");

  const chartData = useMemo(
    () => buildMonthlyChartData(payments),
    [payments]
  );

  const latestPayments = useMemo(
    () =>
      [...payments]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        .slice(0, 8),
    [payments]
  );

  // =========================
  // CARGAR TITULOS DE OFERTAS
  // =========================
  useEffect(() => {
    const loadTitles = async () => {
      const ids = [...new Set(latestPayments.map((p) => p.job_offer_id))];
      const cache: Record<number, string> = {};

      await Promise.all(
        ids.map(async (id) => {
          try {
            const offer = await getJobOfferById(id);
            cache[id] = offer.title ?? `Oferta #${id}`;
          } catch {
            cache[id] = `Oferta #${id}`;
          }
        })
      );

      setOfferTitles(cache);
    };

    if (latestPayments.length > 0) loadTitles();
  }, [latestPayments]);

  // =========================
  // CARGAR METRICAS + PAGOS
  // =========================
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { from, to } = getDateRange(dateRange);

        const [summaryRes, paymentsRes] = await Promise.all([
          getAdminMetricsSummary(
            from || to ? { date_from: from, date_to: to } : undefined
          ),
          getGigPayments(
            from || to ? { date_from: from, date_to: to } : undefined
          ),
        ]);

        setData(summaryRes);
        setPayments(paymentsRes);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las métricas del administrador.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dateRange]);

  return (
    <AppLayout>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Administrador</h1>
          <p className="text-gray-500 text-sm">
            Visión general de usuarios, actividad y monetización.
          </p>
        </div>

        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-1 bg-white"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
        >
          <option value="all">Todo el histórico</option>
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
        </select>
      </div>

      {loading && <div className="text-gray-500 text-sm">Cargando…</div>}
      {error && <div className="text-red-500 text-sm">{error}</div>}

      {data && !loading && !error && (
        <div className="space-y-8">

          {/* =======================
              BLOQUE 1: COMUNIDAD
          ======================= */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Comunidad BaristApp</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KPICard
                label="Usuarios registrados"
                value={data.total_users}
                subtitle="Todos los roles"
                tone="primary"
              />
              <KPICard
                label="Baristas"
                value={data.total_baristas}
                subtitle="Activos"
                tone="success"
              />
              <KPICard
                label="Cafeterías"
                value={data.total_cafes}
                subtitle="Negocios registrados"
                tone="warning"
              />
            </div>
          </section>

          {/* =======================
              BLOQUE 2: ACTIVIDAD
          ======================= */}
          <section>
            <h2 className="text-lg font-semibold mb-3">
              Actividad de la plataforma
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <KPICard
                label="Ofertas totales"
                value={data.offers_total}
                subtitle="Histórico completo"
                tone="info"
              />
              <KPICard
                label="Publicadas"
                value={data.offers_published}
                tone="info"
              />
              <KPICard
                label="Con postulaciones"
                value={data.offers_with_applications}
                tone="info"
              />
              <KPICard
                label="Turnos asignados"
                value={data.assignments_total}
                tone="info"
              />
              <KPICard
                label="Turnos completados"
                value={data.completed_shifts}
                tone="info"
              />
            </div>
          </section>

          {/* =======================
              BLOQUE 3: MONETIZACIÓN
          ======================= */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Monetización</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPICard
                label="Monto bruto total (GTV)"
                value={formatCLP(data.gtv_total)}
                subtitle="Total transaccionado"
                tone="primary"
              />
              <KPICard
                label="Ingresos plataforma"
                value={formatCLP(data.platform_earnings_total)}
                subtitle="10% total"
                tone="success"
              />
              <KPICard
                label="Ingresos desde cafeterías"
                value={formatCLP(data.platform_earnings_from_cafes)}
                subtitle="Fee 7%"
                tone="warning"
              />
              <KPICard
                label="Ingresos desde baristas"
                value={formatCLP(data.platform_earnings_from_baristas)}
                subtitle="Fee 3%"
                tone="warning"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <KPICard
                label="Monto pagado a baristas"
                value={formatCLP(data.baristas_earnings_total)}
                subtitle="Pago neto"
                tone="success"
              />
              <KPICard
                label="Porcentaje retenido"
                value={`${(data.take_rate * 100).toFixed(1)}%`}
                subtitle="Comisión sobre monto bruto"
                tone="primary"
              />
            </div>
          </section>

          {/* ========================
              BLOQUE 4: GRÁFICO
          ======================== */}
          <section>
            <h2 className="text-lg font-semibold mb-3">
              Evolución mensual de ingresos
            </h2>

            <Card className="p-4 h-72">
              {chartData.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  Aún no hay datos para mostrar.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="plataforma"
                      name="Ingresos plataforma"
                      fill="#7C3AED"
                    />
                    <Bar
                      dataKey="baristas"
                      name="Pagado a baristas"
                      fill="#059669"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </section>

          {/* ========================
              BLOQUE 5: TABLA FINAL
          ======================== */}
          <section>
            <h2 className="text-lg font-semibold mb-3">
              Últimos pagos generados
            </h2>

            <Card className="p-0 overflow-hidden">
              {latestPayments.length === 0 ? (
                <div className="p-4 text-gray-500 text-sm">
                  No hay pagos generados aún.
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-left">Cafetería</th>
                      <th className="px-4 py-2 text-right">Monto bruto</th>
                      <th className="px-4 py-2 text-right">Monto barista</th>
                      <th className="px-4 py-2 text-right">Fee cafetería (7%)</th>
                      <th className="px-4 py-2 text-right">Fee barista (3%)</th>
                      <th className="px-4 py-2 text-right">Fee total (10%)</th>
                    </tr>
                  </thead>
                    <tbody>
                      {latestPayments.map((p) => {
                        const feeCafe = p.fee_amount_cafe;
                        const feeBarista = p.fee_amount_barista;
                        const feeTotal = feeCafe + feeBarista;

                        return (
                          <tr key={p.id} className="border-t border-gray-100">
                            <td className="px-4 py-2">{fmtDate(p.created_at)}</td>

                            <td className="px-4 py-2">
                              {offerTitles[p.job_offer_id] ?? `Oferta #${p.job_offer_id}`}
                            </td>

                            <td className="px-4 py-2 text-right">
                              {formatCLP(p.gross_amount)}
                            </td>

                            <td className="px-4 py-2 text-right">
                              {formatCLP(p.net_amount_barista)}
                            </td>

                            <td className="px-4 py-2 text-right">
                              {formatCLP(feeCafe)}
                            </td>

                            <td className="px-4 py-2 text-right">
                              {formatCLP(feeBarista)}
                            </td>

                            <td className="px-4 py-2 text-right">
                              {formatCLP(feeTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                </table>
              )}
            </Card>
          </section>
        </div>
      )}
    </AppLayout>
  );
}
