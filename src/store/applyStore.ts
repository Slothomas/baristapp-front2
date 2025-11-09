import { pushNotification } from "./notifyStore";

export type Application = {
  id: string;
  jobId: string;
  userId: string; // barista
  status: "pendiente" | "aceptado" | "rechazado";
  createdAt: number;
};

const KEY = "applications.store";

function read(): Application[] {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Application[]) : [];
}
function write(list: Application[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getApplications(): Application[] {
  return read();
}

export function getApplicationsByUser(userId: string): Application[] {
  return read().filter((a) => a.userId === userId);
}

export function addApplication(jobId: string, userId: string) {
  const list = read();
  if (list.find((a) => a.jobId === jobId && a.userId === userId)) return;

  const app: Application = {
    id: crypto.randomUUID(),
    jobId,
    userId,
    status: "pendiente",
    createdAt: Date.now(),
  };
  list.push(app);
  write(list);

  pushNotification({ message: `Has postulado al turno #${jobId}.`, type: "success" });
}

export function isApplied(jobId: string, userId: string) {
  return read().some((a) => a.jobId === jobId && a.userId === userId);
}

export function listByJob(jobId: string) {
  return read().filter((a) => a.jobId === jobId);
}

export function updateApplicationStatus(id: string, status: "aceptado" | "rechazado") {
  const list = read().map((a) => (a.id === id ? { ...a, status } : a));
  write(list);

  pushNotification({
    message: status === "aceptado" ? "Tu postulación fue aceptada ✅" : "Tu postulación fue rechazada ❌",
    type: status === "aceptado" ? "info" : "warning",
  });
}

export function removeApplication(id: string) {
  const list = read().filter((a) => a.id !== id);
  write(list);
}
