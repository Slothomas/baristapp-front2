// src/api/users.ts
import { http } from "./http";

export interface ApiUser {
  id: number;
  user: string;
  email: string;
  clave?: string | null;
}

// ===========================================================
// GET /users/{email} → obtener usuario por email
// ===========================================================
export async function fetchUserByEmail(email: string): Promise<ApiUser> {
  const res = await http.get<ApiUser>(`/users/${encodeURIComponent(email)}`);
  return res.data;
}

// ===========================================================
// PUT /users/{email} → actualizar nombre y rol (clave)
// ===========================================================
export async function updateUserProfile(
  email: string,
  data: { name: string; role: string }
): Promise<ApiUser> {
  const payload = {
    user: data.name,   // nombre en la tabla
    clave: data.role,  // rol en la columna 'clave'
  };

  const res = await http.put<ApiUser>(
    `/users/${encodeURIComponent(email)}`,
    payload
  );
  return res.data;
}
