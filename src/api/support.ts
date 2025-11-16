// src/api/support.ts
import { http } from "./http";

/**
 * El 'payload' que espera nuestro endpoint de backend
 */
export interface SupportTicketPayload {
  user_email: string;
  subject: string;
  message: string;
}

/**
 * El 'payload' que devuelve el backend si todo sale bien
 */
export interface SupportResponse {
  message: string;
}

// ===========================================================
// POST /support
// (Enviar un ticket de soporte)
// ===========================================================
export async function sendSupportTicket(
  payload: SupportTicketPayload
): Promise<SupportResponse> {
  
  const res = await http.post<SupportResponse>("/support", payload);
  
  // Devuelve la respuesta (ej. {"message": "Ticket enviado..."})
  return res.data;
}