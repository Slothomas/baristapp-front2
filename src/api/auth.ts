import { http } from "./http";          // 👈 AQUÍ el cliente correcto
import { sget, sset, sdel } from "../lib/secureStorage";

// Roles disponibles (coinciden con tu UI)
export type Role = "barista" | "cafe" | "academy" | "admin";

export interface AuthUser {
  id: number;
  user: string;
  email: string;
  role?: string;
  token?: string;
}

const AUTH_K = "auth.user.secure";
const TOKEN_K = "auth.token.secure";

// ===========================================================
// 🔹 REGISTRO — POST /users
// ===========================================================

export async function registerUser(payload: {
  user: string;
  email: string;
  password: string;
  clave?: string;   // aquí guardamos el ROL desde el front
  is_active?: number;
}) {
  const res = await http.post("/users", {
    ...payload,
    is_active: payload.is_active ?? 1,
  });

  return res.data;
}

// ===========================================================
// 🔹 LOGIN — POST /login
// ===========================================================

export async function loginUser(email: string, password: string) {
  const res = await http.post("/login", { email, password });

  const user: AuthUser = res.data.user;
  const token: string = res.data.token;

  // Guardamos sesión segura
  sset(AUTH_K, user);
  sset(TOKEN_K, token);

  return user;
}

// 👇 Alias para no romper imports antiguos que usaban loginMock
export function loginMock(email: string, password: string) {
  return loginUser(email, password);
}

// ===========================================================
// 🔹 LOGOUT
// ===========================================================

export function logout() {
  sdel(AUTH_K);
  sdel(TOKEN_K);
}

// ===========================================================
// 🔹 OBTENER USUARIO ACTUAL
// ===========================================================

export function getCurrentUser(): AuthUser | null {
  return sget<AuthUser>(AUTH_K);
}

// Alias de compatibilidad con código viejo (NavBar, Profile, etc.)
export function getUserMock(): AuthUser | null {
  return getCurrentUser();
}

export function logoutMock() {
  logout();
}

// ===========================================================
// 🔹 VALIDAR SESIÓN
// ===========================================================

export function isAuthed(): boolean {
  const token = sget<string>(TOKEN_K);
  return !!token && !!getCurrentUser();
}
