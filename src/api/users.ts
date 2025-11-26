// src/api/users.ts
import { http } from "./http";

export interface ApiUser {
  id: number;
  user: string;
  email: string;
  clave?: string | null;

  // ✅ NUEVO: contacto (opcionales para no romper nada)
  contact_number?: string | null; // snake_case recomendado
  contactNumber?: string | null;  // camelCase por si backend devuelve así
  phone?: string | null;          // por compatibilidad legacy
}

// ===========================================================
// GET /users/{email} → obtener usuario por email
// ===========================================================
export async function fetchUserByEmail(email: string): Promise<ApiUser> {
  const res = await http.get<ApiUser>(`/users/${encodeURIComponent(email)}`);
  return res.data;
}

// ===========================================================
// PUT /users/{email} → actualizar nombre, rol y contacto opcional
// ===========================================================
export async function updateUserProfile(
  email: string,
  data: {
    name: string;
    role: string;
    contact_number?: string | null; // ✅ recomendado
    contactNumber?: string | null;  // compat
    phone?: string | null;          // compat
  }
): Promise<ApiUser> {
  const payload: any = {
    user: data.name,   // nombre en la tabla
    clave: data.role,  // rol en la columna 'clave'
  };

  // ✅ manda 1 solo campo si viene (prioridad snake_case)
  const contact =
    data.contact_number ?? data.contactNumber ?? data.phone ?? null;

  if (contact != null && String(contact).trim() !== "") {
    payload.contact_number = String(contact).trim();
  }

  const res = await http.put<ApiUser>(
    `/users/${encodeURIComponent(email)}`,
    payload
  );
  return res.data;
}
