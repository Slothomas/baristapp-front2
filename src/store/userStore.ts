export type User = {
  id: string;
  name: string;
  email: string;
  role: "barista" | "cafe" | "academy" | "admin";
};

const KEY = "users.store";

function read(): User[] {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as User[]) : [];
}
function write(list: User[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function listUsers() {
  return read();
}

export function addUser(u: Omit<User, "id">) {
  const list = read();
  const newU = { ...u, id: crypto.randomUUID() };
  list.push(newU);
  write(list);
}

export function updateUser(id: string, patch: Partial<User>) {
  const list = read().map((u) => (u.id === id ? { ...u, ...patch } : u));
  write(list);
}

export function deleteUser(id: string) {
  const list = read().filter((u) => u.id !== id);
  write(list);
}
