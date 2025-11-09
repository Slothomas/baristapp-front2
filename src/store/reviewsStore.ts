export type Review = {
  id: string;
  jobId: string;
  fromUserId: string;
  toUserId: string;
  role: "barista" | "cafe";
  stars: number;
  comment?: string;
  createdAt: number;
};

const KEY = "reviews.store";

function read(): Review[] {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Review[]) : [];
}
function write(list: Review[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addReview(input: Omit<Review, "id" | "createdAt">) {
  const list = read();
  list.unshift({ ...input, id: crypto.randomUUID(), createdAt: Date.now() });
  write(list);
}

export function listForUser(userId: string) {
  return read().filter(r => r.toUserId === userId);
}

export function avgForUser(userId: string) {
  const rs = listForUser(userId);
  if (rs.length === 0) return 0;
  return rs.reduce((s, r) => s + r.stars, 0) / rs.length;
}
