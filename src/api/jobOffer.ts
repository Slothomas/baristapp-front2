// src/api/jobOffer.ts
import { http } from "./http";

// ---------------------------------------------------------------------------
// ENUMS BASADOS 100% EN EL BACKEND REAL
// ---------------------------------------------------------------------------

export type JobType = "FULL_TIME" | "PART_TIME" | "REPLACEMENT" | "URGENT";
export type UrgencyType = "NORMAL" | "URGENT";
export type JobOfferStatus = "PUBLICADO" | "PAUSADO" | "CERRADO";

// ---------------------------------------------------------------------------
// INTERFACES BASADAS EN EL SCHEMA REAL DEL BACKEND
// ---------------------------------------------------------------------------

export interface JobOffer {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type: JobType;
  description: string;

  salary_range?: number | null;

  requirements?: string | null;
  required_skills?: string | null;

  urgency: UrgencyType;
  status: JobOfferStatus;

  region?: string | null;
  comuna?: string | null;
  date_start?: string | null;
  date_end?: string | null;

  created_by: number;
  selected_application_id?: number | null;
  filled_at?: string | null;

  vacancies_filled: number;
  vacancies_total: number;

  business_id?: number | null;
  location_id?: number | null;

  is_active: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// PAYLOADS PARA CREAR / ACTUALIZAR OFERTAS
// ---------------------------------------------------------------------------

export interface JobOfferCreatePayload {
  title: string;
  company: string;
  location: string;
  job_type: JobType;
  description: string;

  salary_range?: number | null;

  requirements?: string | null;
  required_skills?: string | null;

  urgency?: UrgencyType;
  status?: JobOfferStatus;

  region?: string | null;
  comuna?: string | null;
  date_start?: string | null;
  date_end?: string | null;

  vacancies_total?: number;

  business_id?: number | null;
  location_id?: number | null;
}

export interface JobOfferUpdatePayload {
  title?: string;
  company?: string;
  location?: string;
  job_type?: JobType;

  description?: string;

  salary_range?: number | null;

  requirements?: string | null;
  required_skills?: string | null;

  urgency?: UrgencyType;
  region?: string | null;
  comuna?: string | null;

  date_start?: string | null;
  date_end?: string | null;

  status?: JobOfferStatus;
  is_active?: number;

  business_id?: number | null;
  location_id?: number | null;
}

// ---------------------------------------------------------------------------
// ENDPOINTS DE OFERTAS — CRUD BÁSICO
// ---------------------------------------------------------------------------

export async function createJobOffer(
  payload: JobOfferCreatePayload,
  userId: number
): Promise<JobOffer> {
  const res = await http.post<JobOffer>(`/job-offers/?user_id=${userId}`, payload);
  return res.data;
}

export async function getAllJobOffers(): Promise<JobOffer[]> {
  const res = await http.get<JobOffer[]>("/job-offers/");
  return res.data;
}

export async function getJobsByRestaurant(
  userId: number | string
): Promise<JobOffer[]> {
  const res = await http.get<JobOffer[]>(`/job-offers/user/${userId}`);
  return res.data;
}

export async function getJobOfferById(
  jobOfferId: number | string
): Promise<JobOffer> {
  const res = await http.get<JobOffer>(`/job-offers/${jobOfferId}`);
  return res.data;
}

export async function updateJobOffer(
  jobOfferId: number | string,
  payload: JobOfferUpdatePayload
): Promise<JobOffer> {
  const res = await http.put<JobOffer>(`/job-offers/${jobOfferId}`, payload);
  return res.data;
}

export async function deleteJobOffer(
  jobOfferId: number | string
): Promise<void> {
  await http.delete(`/job-offers/${jobOfferId}`);
  return;
}

// ---------------------------------------------------------------------------
// ENDPOINTS ESPECIALES — MATCHING, SELECCIÓN, STATUS
// ---------------------------------------------------------------------------

export async function getMatchingWorkers(
  jobOfferId: number | string
): Promise<any[]> {
  const res = await http.get<any[]>(`/job-offers/${jobOfferId}/matching`);
  return res.data;
}

export async function getSelectedApplication(
  jobOfferId: number | string
): Promise<any> {
  const res = await http.get<any>(`/job-offers/${jobOfferId}/selected-application`);
  return res.data;
}

export async function selectCandidate(
  jobOfferId: number | string,
  applicationId: number | string,
  recruiterNotes: string = ""
): Promise<any> {
  const res = await http.post(
    `/job-offers/${jobOfferId}/select/${applicationId}?recruiter_notes=${encodeURIComponent(
      recruiterNotes
    )}`
  );
  return res.data;
}

export async function closeJobOffer(
  jobOfferId: number | string
): Promise<any> {
  const res = await http.put<any>(`/job-offers/${jobOfferId}/close`);
  return res.data;
}
