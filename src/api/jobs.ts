
// cambiar los mocks por http.get/post (backend)

export type Job = {
  id: string;
  title: string;
  location: string;
  shiftDate: string;
  pay: string;
};

export async function listJobs(): Promise<Job[]> {
  return [
    { id: "1", title: "Barista turno mañana", location: "Providencia", shiftDate: "2025-10-25 08:00-14:00", pay: "$20.000" },
    { id: "2", title: "Evento corporativo", location: "Las Condes",     shiftDate: "2025-10-27 18:00-23:00", pay: "$45.000" },
  ];
}

export async function createJob(form: Omit<Job, "id">): Promise<Job> {
  return { id: crypto.randomUUID(), ...form };
}
