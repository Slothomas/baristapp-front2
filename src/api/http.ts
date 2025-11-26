// src/api/http.ts
import axios from "axios";
import { getUserMock } from "../api/auth";

let baseURL =
  import.meta.env.DEV
    ? "http://127.0.0.1:8000" // 🔧 local
    : "https://baristappback-axg6grb2ahaffnby.canadacentral-01.azurewebsites.net"; // 🔐 prod SIEMPRE https

// 🔒 Cinturón de seguridad extra: si por alguna env var o config
// quedara en http:// en producción, lo forzamos a https://
if (!import.meta.env.DEV && baseURL.startsWith("http://")) {
  baseURL = baseURL.replace("http://", "https://");
}

export const http = axios.create({
  baseURL,
});

// (solo para ver en consola de prod qué está usando realmente)
console.log("[HTTP] baseURL en runtime =", baseURL);

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const user = getUserMock();
  if (user?.id) {
    config.headers["X-UserID"] = user.id;
    config.headers["Authorization"] = `UserID ${user.id}`;
  }

  return config;
});
