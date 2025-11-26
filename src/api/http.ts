// src/api/http.ts
import axios from "axios";
import { getUserMock } from "../api/auth";

const baseURL = import.meta.env.DEV
  ? "http://127.0.0.1:8000"
  : "https://baristappback-axg6grb2ahaffnby.canadacentral-01.azurewebsites.net";

export const http = axios.create({
  baseURL,
});

http.interceptors.request.use((config) => {
  // Enviar token si existe
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const user = getUserMock();
  if (user?.id) {
    config.headers["X-UserID"] = user.id;         // por seguridad
    config.headers["Authorization"] = `UserID ${user.id}`; // requerido por backend
  }

  return config;
});
