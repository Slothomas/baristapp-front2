// src/lib/validateProfile.ts

type AppRole = "barista" | "cafe" | "admin" | "unknown";

export function validateProfile(user: any, role: AppRole) {
  const missing: string[] = [];

  if (!user) missing.push("usuario");

  // mínimos que sí existen en AuthUser
  if (!user?.name) missing.push("nombre");
  if (!user?.email) missing.push("email");
  if (!user?.role) missing.push("rol");

  // extras: SOLO se validan si el campo existe en user
  const checkIfExists = (key: string, label: string) => {
    if (key in (user ?? {}) && !user?.[key]) missing.push(label);
  };

  if (role === "barista") {
    checkIfExists("phone", "teléfono");
    checkIfExists("comuna", "comuna");
    checkIfExists("region", "región");
    checkIfExists("skills", "habilidades");
    checkIfExists("bio", "bio");
  }

  if (role === "cafe") {
    checkIfExists("phone", "teléfono");
    checkIfExists("comuna", "comuna");
    checkIfExists("region", "región");
    checkIfExists("business_name", "nombre cafetería");
    checkIfExists("description", "descripción negocio");
  }

  return {
    ok: missing.length === 0,
    missing,
  };
}
