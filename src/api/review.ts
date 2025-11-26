// src/api/review.ts
import { http } from "./http";

// ---------------------------------------------------------------------------
// TIPOS ALINEADOS A BACKEND
// ---------------------------------------------------------------------------

export interface Review {
  id: number;
  application_id: number;
  job_offer_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  topic?: string | null;
  comment?: string | null;
  created_at: string;
  is_active?: boolean;

  [key: string]: any;
}

// ---------------------------------------------------------------------------
// PAYLOAD PARA CREAR UNA REVIEW
// reviewee_id AHORA ES OPCIONAL — lo infiere el backend
// ---------------------------------------------------------------------------

export interface CreateReviewPayload {
  application_id: number;
  job_offer_id: number;

  // ⚠️ Opcional (pero allowed si algún día lo usas)
  reviewee_id?: number | null;

  rating: number;           // 1..5
  topic?: string | null;
  comment?: string | null;

  // Compatibilidad. NO se envía.
  reviewer_id?: number | null;
}

export interface ReviewsByUserResponse {
  reviewee_id: number;
  rating_avg: number;
  reviews_count: number;
  reviews: Review[];
}

// ---------------------------------------------------------------------------
// ENDPOINTS REALES DEL BACKEND
// ---------------------------------------------------------------------------

/**
 * POST /reviews/?reviewer_id=XX
 * Envía una reseña.
 */

export async function createReview(
  payload: CreateReviewPayload,
  reviewerId: number | string
): Promise<Review> {
  const res = await http.post<Review>(`/reviews/?reviewer_id=${reviewerId}`, payload);
  return res.data;
}

/**
 * GET /reviews/user/{user_id}
 * Retorna rating_avg, reviews_count y lista de reseñas.
 */
export async function getReviewsByUser(
  userId: number | string
): Promise<ReviewsByUserResponse> {
  const res = await http.get<ReviewsByUserResponse>(`/reviews/user/${userId}`);
  return res.data;
}

/**
 * DELETE /reviews/{id}?requester_id=XX
 * Eliminación segura.
 */
export async function deleteReview(
  reviewId: number | string,
  requesterId: number | string
): Promise<void> {
  await http.delete(`/reviews/${reviewId}?requester_id=${requesterId}`);
}
