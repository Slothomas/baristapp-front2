// src/lib/roles.ts

export type AppRole = "barista" | "cafe" | "admin" | "unknown";

/**
 * Normaliza el rol a los 3 que usaremos ahora:
 * - barista
 * - cafe
 * - admin
 *
 * Academy y otros quedan como unknown (omitidos por ahora)
 */
export function normalizeRole(user: any): AppRole {
  const raw =
    (user?.role ??
      user?.clave ??
      user?.user_type ??
      user?.tipo ??
      "")
      .toString()
      .toLowerCase()
      .trim();

  if (raw === "barista" || raw === "worker" || raw === "freelancer")
    return "barista";

  if (
    raw === "cafe" ||
    raw === "client" ||
    raw === "restaurant" ||
    raw === "cafeteria"
  )
    return "cafe";

  if (raw === "admin" || raw === "administrator")
    return "admin";

  return "unknown";
}
