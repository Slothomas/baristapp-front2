// src/api/profile.ts
import { http } from "./http";

// Lo que realmente devuelve el backend
export interface ApiProfileRaw {
  id: number;
  user_id: number;
  full_name: string | null;
  bio: string | null;
  years_experience: number | null;
  // OJO: en la BD es string, pero en el schema es List[str],
  // así que puede llegarte como string o como array raro.
  skills: string[] | string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Versión normalizada para el front
export interface ApiProfile {
  id: number;
  user_id: number;
  full_name: string | null;
  bio: string | null;
  years_experience: number | null;
  skills: string[];          // siempre array en el front
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdatePayload = {
  full_name?: string;
  bio?: string;
  years_experience?: number | null;
  skills?: string[];
  avatar_url?: string | null;
};

// Normaliza skills
function normalizeProfile(raw: ApiProfileRaw): ApiProfile {
  let skillsArray: string[] = [];

  if (Array.isArray(raw.skills)) {
    skillsArray = raw.skills.map((s) => String(s).trim()).filter(Boolean);
  } else if (typeof raw.skills === "string") {
    skillsArray = raw.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return {
    ...raw,
    skills: skillsArray,
  };
}

// GET /users/{user_id}/profile
export async function fetchProfile(userId: number): Promise<ApiProfile> {
  const res = await http.get<ApiProfileRaw>(`/users/${userId}/profile`);
  return normalizeProfile(res.data);
}

// PUT /users/{user_id}/profile
export async function upsertProfile(
  userId: number,
  payload: ProfileUpdatePayload
): Promise<ApiProfile> {
  const res = await http.put<ApiProfileRaw>(
    `/users/${userId}/profile`,
    payload
  );
  return normalizeProfile(res.data);
}
