// src/api/eventLogs.ts
import { http } from "./http";

// ---------------------------------------------------------------------------
// TIPOS (el backend devuelve metadata, no payload / action / description)
// ---------------------------------------------------------------------------

export interface EventLog {
  id: number;

  event_type: string;
  actor_id?: number | null;

  entity_type: string;
  entity_id: number;

  metadata?: any;
  created_at: string;

  [key: string]: any;
}

// ---------------------------------------------------------------------------
// FORMATO FLEXIBLE QUE USA EL FRONT
// ---------------------------------------------------------------------------

export interface CreateEventLogPayload {
  entity_type: string;
  entity_id: number;

  actor_id?: number;

  action?: string;          // front
  description?: string;     // front
  payload?: any;            // front

  event_type?: string;      // backend opcional
  metadata?: Record<string, any>; // backend opcional
}

// ---------------------------------------------------------------------------
// POST /event-log/   (OJO: singular en backend!!!)
// Transforma action/description/payload al schema real del backend
// ---------------------------------------------------------------------------

export async function createEventLog(
  input: CreateEventLogPayload
): Promise<EventLog> {
  const {
    entity_type,
    entity_id,
    actor_id,
    action,
    description,
    payload,
    event_type,
    metadata,
  } = input;

  // Transformación automática al schema real de FastAPI
  const body = {
    event_type: event_type ?? action ?? "event",

    actor_id: actor_id ?? null,

    entity_type,
    entity_id,

    metadata: metadata ?? {
      description: description ?? null,
      payload: payload ?? null,
    },
  };

  // 🔥 FIX: backend usa /event-log/ (NO /event-logs/)
  const res = await http.post<EventLog>(`/event-log/`, body);
  return res.data;
}

// ---------------------------------------------------------------------------
// GET /event-log/entity
// ---------------------------------------------------------------------------

export async function getEventLogsByEntity(
  entityType: string,
  entityId: number | string
): Promise<EventLog[]> {
  const res = await http.get<EventLog[]>(
    `/event-log/entity?entity_type=${entityType}&entity_id=${entityId}`
  );
  return res.data;
}

// ---------------------------------------------------------------------------
// GET /event-log/actor/{actor_id}
// ---------------------------------------------------------------------------

export async function getEventLogsByActor(
  actorId: number | string
): Promise<EventLog[]> {
  const res = await http.get<EventLog[]>(`/event-log/actor/${actorId}`);
  return res.data;
}
