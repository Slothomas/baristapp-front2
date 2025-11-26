// src/api/jobApplication.ts
import { http } from "./http";

// ---------------------------------------------------------------------------
// ENUMS / TIPOS BACKEND REALES
// ---------------------------------------------------------------------------

// Estados reales del backend (ApplicationStatus)
export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "interview_scheduled"
  | "interviewed"
  | "offered"
  | "hired" // ESTE ES EL VALOR QUE DEBE USAR 'ACEPTAR'
  | "rejected"

  // ✅ NUEVOS post-trabajo / reseñas
  | "completed_by_employer"
  | "completed_by_worker"
  | "completed_confirmed"
  | string;

/** PUT /job-applications/{application_id}/status */
export type RejectionReason =
  | "NO_CUMPLE_REQUISITOS"
  | "YA_CUBRIMOS_VACANTES"
  | "NO_DISPONIBILIDAD_HORARIA"
  | "EXPERIENCIA_INSUFICIENTE"
  | "OTRO";

// ✅ NUEVO: rol actor para completar
export type ActorRole = "employer" | "worker";

// ---------------------------------------------------------------------------
// PAYLOADS
// ---------------------------------------------------------------------------

// Payload para postular
export interface JobApplicationPayload {
  job_offer_id: number;
  cover_letter?: string;
}

// Payload para update status individual
export interface UpdateApplicationStatusPayload {
  status: ApplicationStatus;
  recruiter_notes?: string | null;
}

// Payload bulk (por lista)
export interface BulkUpdateStatusPayload {
  application_ids: Array<number | string>;
  status: ApplicationStatus;
  recruiter_notes?: string | null;
}

// Payload bulk por oferta
export interface BulkUpdateByJobOfferPayload {
  status: ApplicationStatus;
  recruiter_notes?: string | null;
}

// Extras para rechazo
export interface UpdateApplicationStatusExtras {
  rejection_reason?: RejectionReason;
  rejection_note?: string;
}

// ---------------------------------------------------------------------------
// INTERFACES DE RESPUESTA (ALINEADAS A LO QUE YA USAS + BACKEND)
// ---------------------------------------------------------------------------

// Interfaz para la lista de "Mis Postulaciones" (Barista)
export interface MyApplication {
  id: number;
  job_offer_id: number;
  user_id: number;

  cover_letter: string | null;
  status: ApplicationStatus;
  applied_at: string;

  // ✅ NUEVO: flags reales backend
  worker_reviewed?: boolean;
  employer_reviewed?: boolean;

  // Campos que backend entrega en listado "mis postulaciones"
  job_title: string;
  company: string;
  location: string;
}

// Interfaz para la lista de "Postulantes" (Restaurante/Cafetería)
export interface Applicant {
  id: number; // ID de la postulación
  job_offer_id: number;
  user_id: number; // ID del barista

  cover_letter: string | null;
  status: ApplicationStatus;
  applied_at: string;

  recruiter_notes: string | null;
  updated_at: string;

  // ✅ NUEVO: flags reales backend
  worker_reviewed?: boolean;
  employer_reviewed?: boolean;

  // opcionales si backend los manda
  rejection_reason?: RejectionReason | null;
  rejection_note?: string | null;
}

// Postulación completa (GET /job-applications/{id})
export interface JobApplication {
  id: number;
  job_offer_id: number;
  user_id: number;

  cover_letter: string | null;
  status: ApplicationStatus;

  recruiter_notes?: string | null;

  // ✅ flags reales backend también a nivel detalle
  worker_reviewed?: boolean;
  employer_reviewed?: boolean;

  applied_at: string;
  updated_at?: string;

  // Si backend incluye matching score al refrescar matching
  matching_score?: number | null;
}

// Respuesta de endpoints /with-user
export interface JobApplicationWithUser extends JobApplication {
  user?: any; // no invento shape, viene de backend (probablemente UserOut/Profile)
}

// Respuesta de endpoints /with-offer
export interface JobApplicationWithOffer extends JobApplication {
  job_offer?: any; // no invento shape, viene de backend (probablemente JobOfferOut)
}

// ---------------------------------------------------------------------------
// FUNCIONES DE API — YA EXISTENTES (NO SE TOCAN)
// ---------------------------------------------------------------------------

/** 1. POST /job-applications/?user_id= */
export async function applyToJob(
  payload: JobApplicationPayload,
  userId: number | string
): Promise<any> {
  const res = await http.post(
    `/job-applications/?user_id=${userId}`,
    payload
  );
  return res.data;
}

/** 2. GET /job-applications/user/{user_id} */
export async function getMyApplications(
  userId: number | string
): Promise<MyApplication[]> {
  const res = await http.get<MyApplication[]>(
    `/job-applications/user/${userId}`
  );
  return res.data;
}

/** 3. GET /job-applications/job-offer/{job_offer_id} */
export async function getApplicantsForJob(
  jobOfferId: number | string
): Promise<Applicant[]> {
  const res = await http.get<Applicant[]>(
    `/job-applications/job-offer/${jobOfferId}`
  );
  return res.data;
}

/** 4. PUT /job-applications/{application_id}/status */
export async function updateApplicationStatus(
  applicationId: number | string,
  newStatus: ApplicationStatus,
  recruiterNotes: string = "",
  extras: UpdateApplicationStatusExtras = {}
): Promise<any> {
  const payload: UpdateApplicationStatusPayload & UpdateApplicationStatusExtras = {
    status: newStatus,
    recruiter_notes: recruiterNotes,
    ...extras,
  };

  const res = await http.put(
    `/job-applications/${applicationId}/status`,
    payload
  );
  return res.data;
}

// ---------------------------------------------------------------------------
// NUEVOS ENDPOINTS REALES (FASE 1)
// ---------------------------------------------------------------------------

/** 5. GET /job-applications/{application_id} */
export async function getApplicationById(
  applicationId: number | string
): Promise<JobApplication> {
  const res = await http.get<JobApplication>(
    `/job-applications/${applicationId}`
  );
  return res.data;
}

/** 6. GET /job-applications/{application_id}/with-user */
export async function getApplicationWithUser(
  applicationId: number | string
): Promise<JobApplicationWithUser> {
  const res = await http.get<JobApplicationWithUser>(
    `/job-applications/${applicationId}/with-user`
  );
  return res.data;
}

/** 7. GET /job-applications/{application_id}/with-offer */
export async function getApplicationWithOffer(
  applicationId: number | string
): Promise<JobApplicationWithOffer> {
  const res = await http.get<JobApplicationWithOffer>(
    `/job-applications/${applicationId}/with-offer`
  );
  return res.data;
}

/** 8. PUT /job-applications/{application_id}/refresh-matching */
export async function refreshMatchingForApplication(
  applicationId: number | string
): Promise<JobApplication> {
  const res = await http.put<JobApplication>(
    `/job-applications/${applicationId}/refresh-matching`
  );
  return res.data;
}

/** 9. PUT /job-applications/bulk/update-status */
export async function bulkUpdateApplicationStatus(
  payload: BulkUpdateStatusPayload
): Promise<any> {
  const res = await http.put(
    `/job-applications/bulk/update-status`,
    payload
  );
  return res.data;
}

/** 10. PUT /job-applications/bulk/job-offer/{job_offer_id} */
export async function bulkUpdateStatusByJobOffer(
  jobOfferId: number | string,
  payload: BulkUpdateByJobOfferPayload
): Promise<any> {
  const res = await http.put(
    `/job-applications/bulk/job-offer/${jobOfferId}`,
    payload
  );
  return res.data;
}

/** 11. DELETE /job-applications/{application_id} */
export async function deleteApplication(
  applicationId: number | string
): Promise<void> {
  await http.delete(`/job-applications/${applicationId}`);
  return;
}

// ---------------------------------------------------------------------------
// ✅ NUEVO: MARCAR / CONFIRMAR COMPLETADO
// ---------------------------------------------------------------------------

/**
 * POST /job-applications/{application_id}/complete
 * params: actor_user_id, actor_role
 */
export async function completeApplication(
  applicationId: number | string,
  actorUserId: number | string,
  actorRole: ActorRole
): Promise<{ id: number; status: ApplicationStatus; message: string }> {
  const res = await http.post(
    `/job-applications/${applicationId}/complete`,
    null,
    {
      params: {
        actor_user_id: actorUserId,
        actor_role: actorRole,
      },
    }
  );
  return res.data;
}
