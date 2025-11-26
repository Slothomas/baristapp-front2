// src/api/auth.ts
import { http } from "./http";
import { sget, sset, sdel } from "../lib/secureStorage";

export type Role = "barista" | "cafe" | "academy" | "admin" | "worker" | "client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: Role;
  token?: string;
  user?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}


const AUTH_K = "auth.user.secure";
const TOKEN_K = "auth.token.secure";

// ---------------------------------------------------------
// Normalizador de roles (clave → role del frontend)
// ---------------------------------------------------------
function normalizeRole(value?: string | null): Role {
  if (!value) return "barista";

  const v = value.toLowerCase().trim();

  if (["barista", "worker"].includes(v)) return "barista";
  if (["cafe", "client", "cafeteria", "restaurant"].includes(v)) return "cafe";
  if (["academy", "academia"].includes(v)) return "academy";
  if (["admin"].includes(v)) return "admin";

  return "barista"; // fallback
}

// ===========================================================
// REGISTRO  → POST /users
// ===========================================================
export async function registerUser(payload: {
  user: string;
  email: string;
  password: string;
  clave?: string;
  is_active?: number;
}) {
  const res = await http.post("/users", {
    ...payload,
    is_active: payload.is_active ?? 1,
  });

  return res.data;
}

// ===========================================================
// LOGIN  → POST /login
// ===========================================================
export async function loginUser(email: string, password: string) {
  const res = await http.post("/login", {
    user: email,      // backend espera "user"
    password: password,
  });

  const raw = res.data;

  const normalizedRole = normalizeRole(raw.role || raw.clave);

  const user: AuthUser = {
    id: String(raw.user_id),
    name: raw.user,
    email: raw.email,
    role: normalizedRole,
  };

  // token dummy
  const token = "dummy-token";

  sset(AUTH_K, user);
  sset(TOKEN_K, token);

  return user;
}

export function loginMock(email: string, password: string) {
  return loginUser(email, password);
}

// ===========================================================
// LOGOUT
// ===========================================================
export function logout() {
  sdel(AUTH_K);
  sdel(TOKEN_K);
}

// ===========================================================
// GET USER (mock / real)
// ===========================================================
export function getCurrentUser(): AuthUser | null {
  const user = sget<AuthUser>(AUTH_K);
  if (!user) return null;

  return {
    ...user,
    role: normalizeRole(user.role), // normalizamos por si quedó viejo
  };
}

// Alias
export function getUserMock(): AuthUser | null {
  return getCurrentUser();
}

export function logoutMock() {
  logout();
}

// ===========================================================
// VALIDAR SESIÓN
// ===========================================================
export function isAuthed(): boolean {
  const token = sget<string>(TOKEN_K);
  return !!token && !!getCurrentUser();
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await http.post("/auth/change-password", payload);
}
