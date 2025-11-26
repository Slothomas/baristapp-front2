// src/api/gigPayments.ts
import { http } from "./http";

export interface GigPayment {
  id: number;
  assignment_id: number;
  job_offer_id: number;
  barista_id: number;
  business_id: number | null;

  gross_amount: number;

  fee_pct_cafe: number;
  fee_pct_barista: number;

  fee_amount_cafe: number;
  fee_amount_barista: number;

  net_amount_barista: number;

  status: string;
  created_at: string;
  paid_at: string | null;
}

export async function getGigPayments(params?: {
  barista_id?: number;
  business_id?: number;
  date_from?: string;
  date_to?: string;
}): Promise<GigPayment[]> {
  const res = await http.get<GigPayment[]>("/gig-payments", { params });
  return res.data;
}
