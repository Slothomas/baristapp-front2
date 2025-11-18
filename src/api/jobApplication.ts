// src/api/jobApplication.ts
import { http } from "./http";

// --- INTERFACES (basadas en los Schemas de tu compañero) ---
// ... (después de la interfaz 'MyApplication')

// La respuesta de "Ver Postulantes" (para el restaurante)
// (Básicamente, la respuesta del backend)
export interface Applicant {
  id: number; // ID de la *postulación*
  job_offer_id: number;
  user_id: number; // ID del *barista*
  cover_letter: string | null;
  status: ApplicationStatus;
  applied_at: string;
  recruiter_notes: string | null;
  updated_at: string;
  // (Puedes añadir más campos si los necesitas)
}

export type ApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected" | string;

// El payload para postular a un trabajo
export interface JobApplicationPayload {
  job_offer_id: number;
  cover_letter?: string;
}

// La respuesta de "Mis Postulaciones" (para el barista)
export interface MyApplication {
  id: number;
  job_offer_id: number;
  user_id: number;
  cover_letter: string | null;
  status: ApplicationStatus;
  applied_at: string;
  // Campos extra del JOIN
  job_title: string;
  company: string;
  location: string;
}

// --- FUNCIONES DE API ---

/**
 * 1. POST /job-applications
 * Permite a un barista postular a una oferta
 */
export async function applyToJob(
  payload: JobApplicationPayload,
  userId: number | string // El ID del barista
): Promise<any> {
  
  // El backend pide el user_id como un Query Param
  const res = await http.post(
    `/job-applications/?user_id=${userId}`, // -> POST /job-applications/?user_id=4
    payload
  );
  return res.data;
}

/**
 * 2. GET /job-applications/user/{user_id}
 * Obtiene la lista de trabajos a los que un barista ha postulado
 */
export async function getMyApplications(
  userId: number | string
): Promise<MyApplication[]> {
  // Usamos el endpoint que nos da la info de la oferta (WithOffer)
  const res = await http.get<MyApplication[]>(`/job-applications/user/${userId}`);
  return res.data;
}

/**
 * 3. GET /job-applications/job-offer/{job_offer_id}
 * Obtiene la lista de candidatos que postularon a una oferta
 * (Para la vista del Restaurante)
 */
export async function getApplicantsForJob(
  jobOfferId: number | string
): Promise<any[]> { // Puedes crear una interfaz 'Applicant' para esto
  const res = await http.get<any[]>(`/job-applications/job-offer/${jobOfferId}`);
  return res.data;
}

/**
 * 4. PUT /job-applications/{application_id}/status
 * Permite a un restaurante aceptar o rechazar una postulación
 */
export async function updateApplicationStatus(
  applicationId: number | string,
  newStatus: ApplicationStatus,
  recruiterNotes: string = ""
): Promise<any> {
  
  const payload = {
    status: newStatus,
    recruiter_notes: recruiterNotes,
  };
  
  const res = await http.put(
    `/job-applications/${applicationId}/status`,
    payload
  );
  return res.data;
}