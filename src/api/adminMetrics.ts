// src/api/adminMetrics.ts
import { http } from "./http";

export interface AdminMetricsSummary {
  // Usuarios / cuentas
  total_users: number;
  total_baristas: number;
  total_cafes: number;

  // Ofertas y asignaciones
  offers_total: number;
  offers_published: number;
  offers_with_applications: number;
  assignments_total: number;
  completed_shifts: number;

  // Monetización
  gtv_total: number;
  platform_earnings_from_cafes: number;
  platform_earnings_from_baristas: number;
  platform_earnings_total: number;
  baristas_earnings_total: number;

  // 0..1 (ej: 0.1 = 10%)
  take_rate: number;
}

export async function getAdminMetricsSummary(
  params?: { date_from?: string; date_to?: string }
): Promise<AdminMetricsSummary> {
  const res = await http.get<AdminMetricsSummary>("/admin/metrics/summary", {
    params,
  });
  return res.data;
}
