// src/api/jobOffer.ts
import { http } from "./http";

// --- INTERFACES (basadas en los Schemas de tu compañero) ---

// El tipo de trabajo (importado del backend)
export type JobType = "full_time" | "part_time" | "replacement" | "urgent";

// La respuesta del backend para una oferta
export interface JobOffer {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type: JobType;
  description: string;
  salary_range: string | null;
  requirements: string | null;
  created_by: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// El payload para actualizar una oferta
export interface JobOfferUpdatePayload {
  title?: string;
  company?: string;
  location?: string;
  job_type?: JobType;
  description?: string;
  salary_range?: string | null;
  requirements?: string | null;
  is_active?: number;
}

// El payload para crear una oferta
export interface JobOfferCreatePayload {
  title: string;
  company: string;
  location: string;
  job_type: JobType;
  description: string;
  salary_range?: string | null;
  requirements?: string | null;
  is_active?: number; // Opcional, por defecto 1
}

// --- FUNCIONES DE API ---

/**
 * 1. POST /job-offers/
 * Crea una nueva oferta de trabajo.
 */
export async function createJobOffer(
  payload: JobOfferCreatePayload,
  userId: number | string // El ID del restaurante/café
): Promise<JobOffer> {
  // El backend de tu compañero pide el user_id como un Query Param
  const res = await http.post<JobOffer>(
    `/job-offers/?user_id=${userId}`, // <-- Con barra
    payload
  );
  return res.data;
}

/**
 * 2. GET /job-offers/
 * Obtiene la lista de todas las ofertas (para el muro de "Explorar")
 */
export async function getAllJobOffers(): Promise<JobOffer[]> {
  const res = await http.get<JobOffer[]>("/job-offers/"); // <-- Con barra
  return res.data;
}

/**
 * 3. GET /job-offers/user/{user_id}/
 * Obtiene solo las ofertas creadas por un restaurante específico
 */
export async function getJobsByRestaurant(
  userId: number | string
): Promise<JobOffer[]> {
  const res = await http.get<JobOffer[]>(`/job-offers/user/${userId}`);
  return res.data;
}

/**
 * 4. PUT /job-offers/{job_offer_id}/
 * Actualiza una oferta de trabajo.
 */
export async function updateJobOffer(
  jobOfferId: number | string,
  payload: JobOfferUpdatePayload
): Promise<JobOffer> {
  const res = await http.put<JobOffer>(
    `/job-offers/${jobOfferId}`, // <-- Añadida la barra
    payload
  );
  return res.data;
}

/**
 * 5. DELETE /job-offers/{job_offer_id}/
 * Elimina (desactiva) una oferta de trabajo.
 */
export async function deleteJobOffer(
  jobOfferId: number | string
): Promise<void> {
  // El backend de tu compañero usa un 'soft delete',
  // así que esto marcará 'is_active = 0'
  await http.delete(`/job-offers/${jobOfferId}`); // <-- Añadida la barra
  return;
}