import axios from "axios";

const baseURL = import.meta.env.DEV
  ? "http://127.0.0.1:8000" // Backend local FastAPI
  : "https://baristappback-axg6grb2ahaffnby.canadacentral-01.azurewebsites.net"; // Backend Azure

export const http = axios.create({
  baseURL,
});

// Añadir token si existe
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
