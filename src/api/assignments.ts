// src/api/assignments.ts
import { http } from "./http";

// ---------------------------------------------------------------------------
// TIPOS FLEXIBLES (backend puede incluir campos extra)
// ---------------------------------------------------------------------------

export interface Assignment {
  id: number;

  job_offer_id: number;
  application_id?: number | null;

  worker_id: number;  // id usuario barista
  client_id: number;  // id usuario cafetería/cliente

  status?: string | null; // backend puede tener enum interno
  start_date?: string | null;
  end_date?: string | null;

  created_at: string;
  updated_at?: string;

  [key: string]: any;
}

export interface CreateAssignmentPayload {
  job_offer_id: number;
  worker_id: number;
  client_id: number;
  application_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
}

export interface UpdateAssignmentPayload {
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

// ---------------------------------------------------------------------------
// ENDPOINTS REALES BACKEND
// ---------------------------------------------------------------------------

/**
 * POST /assignments/
 * Crea asignación (cuando cafetería confirma trabajador seleccionado)
 */
export async function createAssignment(
  payload: CreateAssignmentPayload
): Promise<Assignment> {
  const res = await http.post<Assignment>(`/assignments/`, payload);
  return res.data;
}

/**
 * PATCH /assignments/{assignment_id}
 * Actualiza asignación (ej: cerrar, cambiar status)
 */
export async function updateAssignment(
  assignmentId: number | string,
  payload: UpdateAssignmentPayload
): Promise<Assignment> {
  const res = await http.patch<Assignment>(
    `/assignments/${assignmentId}`,
    payload
  );
  return res.data;
}

/**
 * GET /assignments/worker/{worker_id}
 * Asignaciones del barista
 */
export async function getAssignmentsByWorker(
  workerId: number | string
): Promise<Assignment[]> {
  const res = await http.get<Assignment[]>(
    `/assignments/worker/${workerId}`
  );
  return res.data;
}

/**
 * GET /assignments/client/{client_id}
 * Asignaciones de la cafetería/cliente
 */
export async function getAssignmentsByClient(
  clientId: number | string
): Promise<Assignment[]> {
  const res = await http.get<Assignment[]>(
    `/assignments/client/${clientId}`
  );
  return res.data;
}
