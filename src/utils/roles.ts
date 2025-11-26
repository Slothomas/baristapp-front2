// src/utils/roles.ts

export type AppRole = "barista" | "cafe" | "academy" | "admin" | "unknown";

/**
 * Normaliza los roles que vienen del backend.
 * Evita que el FE se rompa si backend usa worker/client/restaurant/etc.
 */
export function normalizeRole(user: any): AppRole {
  const raw =
    (user?.role ?? user?.clave ?? user?.user_type ?? user?.tipo ?? "")
      .toString()
      .toLowerCase()
      .trim();

  if (raw === "barista" || raw === "worker" || raw === "freelancer") return "barista";
  if (raw === "cafe" || raw === "client" || raw === "restaurant" || raw === "cafeteria")
    return "cafe";
  if (raw === "academy" || raw === "escuela" || raw === "training_center")
    return "academy";
  if (raw === "admin" || raw === "administrator") return "admin";

  return "unknown";
}
