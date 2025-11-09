export type Ticket = {
  id: string;
  userId: string | null;
  subject: string;
  category: "Cuenta" | "Técnico" | "Pagos" | "Sugerencia" | "Otro";
  message: string;
  createdAt: number;
  status: "abierto" | "resuelto";
};

const KEY = "support.tickets";

function read(): Ticket[] {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Ticket[]) : [];
}
function write(list: Ticket[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function createTicket(input: Omit<Ticket, "id" | "createdAt" | "status">): Ticket {
  const list = read();
  const t: Ticket = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: "abierto",
    ...input,
  };
  list.push(t);
  write(list);
  return t;
}

export function listMyTickets(userId: string | null) {
  const all = read();
  return all.filter(t => t.userId === userId);
}
