export type Notification = {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
  read: boolean;
  createdAt: number;
};

const KEY = "notify.store";

function read(): Notification[] {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Notification[]) : [];
}
function write(list: Notification[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function pushNotification(n: Omit<Notification, "id" | "read" | "createdAt">) {
  const list = read();
  const item: Notification = {
    id: crypto.randomUUID(),
    read: false,
    createdAt: Date.now(),
    ...n,
  };
  list.unshift(item);
  write(list);
}

export function listNotifications() {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function markAsRead(id: string) {
  const list = read();
  const idx = list.findIndex(n => n.id === id);
  if (idx >= 0) list[idx].read = true;
  write(list);
}

export function clearNotifications() {
  localStorage.removeItem(KEY);
}
