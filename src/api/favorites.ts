// src/api/favorites.ts
import { http } from "./http";

// ---------------------------------------------------------------------------
// TIPOS DE RESPUESTA (no invento campos; dejo flexible)
// ---------------------------------------------------------------------------

// Favoritos de ofertas (backend devuelve lista de JobOfferOut o algo equivalente)
export type FavoriteOffer = any;

// Favoritos de workers (backend devuelve lista de UserOut/ProfileOut o equivalente)
export type FavoriteWorker = any;

// ---------------------------------------------------------------------------
// OFERTAS FAVORITAS
// ---------------------------------------------------------------------------

/**
 * POST /favorites/offers/{job_offer_id}?user_id=...
 * Agrega una oferta a favoritos del usuario barista.
 */
export async function addOfferToFavorites(
  jobOfferId: number | string,
  userId: number | string
): Promise<any> {
  const res = await http.post(
    `/favorites/offers/${jobOfferId}?user_id=${userId}`
  );
  return res.data;
}

/**
 * DELETE /favorites/offers/{job_offer_id}?user_id=...
 * Quita una oferta de favoritos del usuario barista.
 */
export async function removeOfferFromFavorites(
  jobOfferId: number | string,
  userId: number | string
): Promise<void> {
  await http.delete(
    `/favorites/offers/${jobOfferId}?user_id=${userId}`
  );
  return;
}

/**
 * GET /favorites/offers?user_id=...
 * Lista todas las ofertas favoritas de un barista.
 */
export async function getFavoriteOffers(
  userId: number | string
): Promise<FavoriteOffer[]> {
  const res = await http.get<FavoriteOffer[]>(
    `/favorites/offers?user_id=${userId}`
  );
  return res.data;
}

// ---------------------------------------------------------------------------
// WORKERS FAVORITOS (CAFETERÍA/CLIENTE)
// ---------------------------------------------------------------------------

/**
 * POST /favorites/workers/{worker_user_id}?client_user_id=...
 * Agrega un barista a favoritos de la cafetería/cliente.
 */
export async function addWorkerToFavorites(
  workerUserId: number | string,
  clientUserId: number | string
): Promise<any> {
  const res = await http.post(
    `/favorites/workers/${workerUserId}?client_user_id=${clientUserId}`
  );
  return res.data;
}

/**
 * DELETE /favorites/workers/{worker_user_id}?client_user_id=...
 * Quita un barista de favoritos de la cafetería/cliente.
 */
export async function removeWorkerFromFavorites(
  workerUserId: number | string,
  clientUserId: number | string
): Promise<void> {
  await http.delete(
    `/favorites/workers/${workerUserId}?client_user_id=${clientUserId}`
  );
  return;
}

/**
 * GET /favorites/workers?client_user_id=...
 * Lista todos los baristas favoritos del cliente/cafetería.
 */
export async function getFavoriteWorkers(
  clientUserId: number | string
): Promise<FavoriteWorker[]> {
  const res = await http.get<FavoriteWorker[]>(
    `/favorites/workers?client_user_id=${clientUserId}`
  );
  return res.data;
}
