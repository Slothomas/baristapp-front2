import { http } from "./http";

export interface UserRegisterPayload {
  user: string;
  email: string;
  password: string;
  clave?: string;
  question1_id?: number;
  question1_answ?: string;
  question2_id?: number;
  question2_answ?: string;
  is_active?: number;
}

export async function registerUser(data: UserRegisterPayload) {
  const res = await http.post("/users", data);
  return res.data;
}
