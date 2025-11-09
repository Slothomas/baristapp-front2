export type Cert = {
  id: string;
  name: string;
  fileName: string;
  dataUrl: string;
  uploadedAt: number;
};

const KEY = "profile.certificates";

export function getCerts(): Cert[] {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Cert[]) : [];
}

export function addCert(c: Omit<Cert, "id" | "uploadedAt">): Cert {
  const list = getCerts();
  const item: Cert = {
    id: crypto.randomUUID(),
    uploadedAt: Date.now(),
    ...c,
  };
  list.push(item);
  localStorage.setItem(KEY, JSON.stringify(list));
  return item;
}

export function removeCert(id: string) {
  const list = getCerts().filter((c) => c.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}
