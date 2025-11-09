import { signJWT, verifyJWT } from "../lib/jwt";
import { sget, sset, sdel } from "../lib/secureStorage";

type Role = "barista" | "cafe" | "academy" | "admin";
type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

const AUTH_K = "auth.user.secure";
const TOKEN_K = "auth.token.secure";
const USERS_K = "users.store.secure";

// base de datos
const catalog: Record<string, User> = {
  "barista@demo.cl": { id: "u-barista", name: "Barista Demo", email: "barista@demo.cl", role: "barista" },
  "cafe@demo.cl":    { id: "u-cafe",    name: "Cafetería Demo", email: "cafe@demo.cl", role: "cafe" },
  "academy@demo.cl": { id: "u-acad",    name: "Academia Demo", email: "academy@demo.cl", role: "academy" },
  "admin@demo.cl":   { id: "u-admin",   name: "Administrador",  email: "admin@demo.cl", role: "admin" },
};

// login
export function loginMock(email: string, _password: string): User {

  const usersRaw = localStorage.getItem(USERS_K);
  const users = usersRaw ? (JSON.parse(usersRaw) as User[]) : [];
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  const u = user || catalog[email.toLowerCase()];
  if (!u) throw new Error("Usuario o contraseña incorrectos");

  // crear token
  const token = signJWT(
    { sub: u.id, role: u.role, name: u.name, email: u.email },
    60 * 60 * 24
  );

  // guardar sesion segura
  sset(AUTH_K, u);
  sset(TOKEN_K, token);
  return u;
}

// registro
export function registerMock(input: { name: string; email: string; password: string; role: Role }) {
  const usersRaw = localStorage.getItem(USERS_K);
  const users = usersRaw ? (JSON.parse(usersRaw) as any[]) : [];

  // verifica duplicado
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("Ese correo ya está registrado");
  }

  const newUser: User & { password?: string } = {
    id: `u-${crypto.randomUUID()}`,
    name: input.name,
    email: input.email.toLowerCase(),
    role: input.role,
    password: input.password,
  };

  users.push(newUser);
  localStorage.setItem(USERS_K, JSON.stringify(users));

  // crea token y deja sesion activa
  const token = signJWT(
    { sub: newUser.id, role: newUser.role, name: newUser.name, email: newUser.email },
    60 * 60 * 24
  );
  sset(AUTH_K, newUser);
  sset(TOKEN_K, token);

  return newUser;
}

// el logout
export function logoutMock() {
  sdel(AUTH_K);
  sdel(TOKEN_K);
}

// obtener usuario actual
export function getUserMock(): User | null {
  return sget<User>(AUTH_K);
}

// validar token
export function isAuthed(): boolean {
  const token = sget<string>(TOKEN_K);
  const valid = token ? !!verifyJWT(token) : false;
  return !!getUserMock() && valid;
}
