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

  // ---------------------------
  // NUEVOS CAMPOS gig-economy
  // ---------------------------
  region?: string | null;
  comuna?: string | null;
  availability_json?: any | null;

  rate_hour?: number | string | null;
  min_shift_rate?: number | string | null;

  business_name?: string | null;
  business_type?: string | null;

  rating_avg?: number | string | null;
  reviews_count?: number | string | null;
}

// Versión normalizada para el front
export interface ApiProfile {
  id: number;
  user_id: number;
  full_name: string | null;
  bio: string | null;
  years_experience: number | null;
  skills: string[]; // siempre array en el front
  avatar_url: string | null;
  created_at: string;
  updated_at: string;

  // ---------------------------
  // NUEVOS CAMPOS gig-economy
  // ---------------------------
  region?: string | null;
  comuna?: string | null;
  availability_json?: any | null;

  rate_hour?: number | null;
  min_shift_rate?: number | null;

  business_name?: string | null;
  business_type?: string | null;

  rating_avg?: number | null;
  reviews_count?: number | null;
}

export type ProfileUpdatePayload = {
  full_name?: string;
  bio?: string;
  years_experience?: number | null;
  skills?: string[];
  avatar_url?: string | null;

  // nuevos campos editables
  region?: string | null;
  comuna?: string | null;
  availability_json?: any | null;

  rate_hour?: number | null;
  min_shift_rate?: number | null;

  business_name?: string | null;
  business_type?: string | null;

  // calculados backend: normalmente no los mandas,
  // pero los tipamos por si backend los acepta/ignora
  rating_avg?: number | null;
  reviews_count?: number | null;
};

// Normaliza skills + números
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

  const toNumOrNull = (v: any): number | null => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  return {
    ...raw,
    skills: skillsArray,

    // casteos numéricos seguros
    rate_hour: toNumOrNull(raw.rate_hour),
    min_shift_rate: toNumOrNull(raw.min_shift_rate),
    rating_avg: toNumOrNull(raw.rating_avg),
    reviews_count: toNumOrNull(raw.reviews_count),
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

// POST /users/{user_id}/avatar
export async function uploadAvatar(
  userId: number | string,
  file: File
): Promise<ApiProfile> {
  const formData = new FormData();
  formData.append("file", file); // La key "file"

  const res = await http.post<ApiProfileRaw>(
    `/users/${userId}/avatar`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return normalizeProfile(res.data);
}
