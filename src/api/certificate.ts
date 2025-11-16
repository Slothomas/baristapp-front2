// src/api/certificate.ts
import { http } from "./http";

// ===========================================================
// INTERFACES
// ===========================================================

/**
 * Lo que devuelve el backend desde la tabla `app_user_certificate`
 */
export interface ApiCertificate {
  id: number;
  user_id: number;
  file_name_original: string;
  uploaded_at: string; // El backend lo envía como Datetime, pero JSON lo convierte en string
}

/**
 * Lo que esperamos que devuelva el endpoint de descarga
 */
export interface ApiCertificateDownload {
  download_url: string;
}

// ===========================================================
// GET /users/{user_id}/certificates
// (Obtener la lista de certificados de un usuario)
// ===========================================================
export async function getCertificates(
  userId: number | string
): Promise<ApiCertificate[]> {
  const res = await http.get<ApiCertificate[]>(`/users/${userId}/certificates`);
  
  // No necesitamos normalización, el objeto de la API es limpio
  return res.data;
}

// ===========================================================
// POST /users/{user_id}/certificates
// (Subir un nuevo certificado)
// ===========================================================
export async function uploadCertificate(
  userId: number | string,
  file: File
): Promise<ApiCertificate> {
  
  const formData = new FormData();
  // La key "file" debe coincidir con el argumento en el backend:
  // file: UploadFile = File(...)
  formData.append("file", file);

  // Al usar axios con FormData, debemos setear el header manualmente
  const res = await http.post<ApiCertificate>(
    `/users/${userId}/certificates`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
}

// ===========================================================
// GET /certificates/{certificate_id}/download
// (Obtener un enlace de descarga temporal - **PENDIENTE EN BACKEND**)
// ===========================================================
export async function getCertificateDownloadUrl(
  certificateId: number | string
): Promise<ApiCertificateDownload> {
  
  const res = await http.get<ApiCertificateDownload>(
    `/certificates/${certificateId}/download`
  );
  
  return res.data;
}