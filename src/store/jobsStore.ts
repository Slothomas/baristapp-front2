export type Job = {
  id: string;
  ownerId: string;
  title: string;
  location?: string;
  description?: string;
  requirements?: string;
  startISO?: string;
  endISO?: string;
  payCLP?: number;
  active: boolean;
  createdAt: number;
};

const KEY = "jobs.store";

function read(): Job[] {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Job[]) : [];
}
function write(list: Job[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

/** helpers base */
export function listJobs(): Job[] {
  return read();
}
export function getJobById(id: string) {
  return read().find((j) => j.id === id);
}
export function listActiveJobs(): Job[] {
  return read().filter((j) => j.active);
}
export function listJobsByOwner(ownerId: string): Job[] {
  return read().filter((j) => j.ownerId === ownerId);
}

/** crear/editar */
export function addJob(input: Omit<Job, "id" | "createdAt" | "active">) {
  const list = read();
  list.unshift({
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    active: true,
  });
  write(list);
}
export function toggleJobActive(id: string, active: boolean) {
  const list = read().map((j) => (j.id === id ? { ...j, active } : j));
  write(list);
}
export function removeJob(id: string) {
  const list = read().filter((j) => j.id !== id);
  write(list);
}
