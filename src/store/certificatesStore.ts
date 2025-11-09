export type Certificate = {
  id: string;
  baristaName: string;
  academyId: string;
  title: string;
  fileData: string;
  uploadedAt: number;
};

const KEY = "certificates.store";

function read(): Certificate[] {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Certificate[]) : [];
}
function write(list: Certificate[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addCertificate(c: Omit<Certificate, "id" | "uploadedAt">) {
  const list = read();
  list.push({ ...c, id: crypto.randomUUID(), uploadedAt: Date.now() });
  write(list);
}

export function listCertificatesForBarista(baristaName: string) {
  return read().filter(c => c.baristaName.toLowerCase() === baristaName.toLowerCase());
}

export function listCertificatesByAcademy(academyId: string) {
  return read().filter(c => c.academyId === academyId);
}

export function listCertificatesForUser(userId: string, userName?: string) {
  const all = read();
  const byId = all.filter(c => (c as any).baristaId === userId);
  if (byId.length > 0) return byId;
  if (!userName) return [];
  return all.filter(c => c.baristaName?.toLowerCase() === userName.toLowerCase());
}
