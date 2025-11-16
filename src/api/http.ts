import axios from "axios";

export const http = axios.create({
  baseURL: "https://baristappback-axg6grb2ahaffnby.canadacentral-01.azurewebsites.net"
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
