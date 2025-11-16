import { http } from "./http";
import { sget, sset, sdel } from "../lib/secureStorage";

export type Role = "barista" | "cafe" | "academy" | "admin";

export interface AuthUser {
  id: string;      // lo que usa el front en todas partes
  name: string;    // usado por Navbar, Dashboard, Profile
  email: string;
  role?: string;
  token?: string;
  user?: string;   // opcional, por compatibilidad
}

const AUTH_K = "auth.user.secure";
const TOKEN_K = "auth.token.secure";

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

  return res.data; // la respuesta viene en formato UserResponse
}

// ===========================================================
// LOGIN  → POST /login
// Backend espera: { user: string, password: string }
// Respuesta: { success, message, user_id, email, user }
// ===========================================================
export async function loginUser(email: string, password: string) {
  // 👇 OJO: el backend espera "user", no "email"
  const res = await http.post("/login", {
    user: email,
    password: password,
  });

  const raw = res.data; // LoginResponse

  const user: AuthUser = {
    id: String(raw.user_id),
    name: raw.user,
    email: raw.email,
    role: undefined,
  };

  // Por ahora el backend no devuelve token.
  // Guardamos un token dummy para que isAuthed() funcione.
  const token = "dummy-token";

  sset(AUTH_K, user);
  sset(TOKEN_K, token);

  return user;
}

// Alias para mantener compatibilidad con código viejo
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
// OBTENER USUARIO ACTUAL
// ===========================================================
export function getCurrentUser(): AuthUser | null {
  return sget<AuthUser>(AUTH_K);
}

// Alias de compatibilidad (Navbar, Profile, etc.)
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
