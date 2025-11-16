// src/components/CertificateUpload.tsx
import { useEffect, useState } from "react";
import { useToast } from "./Toast";
import {
  getCertificates,
  uploadCertificate,
  getCertificateDownloadUrl,
  deleteCertificate, // <-- 1. Importa la nueva función
  type ApiCertificate,
} from "../api/certificate";
import Button from "./Button";

interface Props {
  userId: number;
}

type DownloadStatus = { [key: number]: boolean };
// 2. Añade estado para los botones de eliminar
type DeleteStatus = { [key: number]: boolean };

export default function CertificateUpload({ userId }: Props) {
  const [list, setList] = useState<ApiCertificate[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState<string>("empty");

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({});
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>({}); // <-- 3. Inicializa el estado

  const toast = useToast();

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    async function fetchCertificates() {
      setIsLoading(true);
      try {
        const data = await getCertificates(userId);
        setList(data);
      } catch (err: any) {
        console.error("Error cargando certificados:", err);
        toast.push(err.message || "No se pudo cargar la lista.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCertificates();
  }, [userId]); // 'toast' se quita para evitar bucles

  // ... (onFileChange y onFileUpload se quedan igual) ...
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.push("Solo se admiten archivos PDF.");
      e.target.value = "";
      setSelectedFile(null);
      return;
    }
    setSelectedFile(f);
  };

  const onFileUpload = async () => {
    if (!selectedFile) {
      toast.push("Selecciona un PDF primero");
      return;
    }
    if (!userId) {
      toast.push("Error: No se ha identificado al usuario.");
      return;
    }
    setIsUploading(true);
    try {
      const newCert = await uploadCertificate(userId, selectedFile);
      setList((currentList) => [...currentList, newCert]);
      toast.push(`Certificado "${newCert.file_name_original}" subido.`);
      setSelectedFile(null);
      setFileInputKey(`key-${Date.now()}`);
    } catch (err: any) {
      console.error("Error subiendo:", err);
      toast.push(err.message || "No se pudo subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const onFileDownload = async (cert: ApiCertificate) => {
    setDownloadStatus((prev) => ({ ...prev, [cert.id]: true }));
    try {
      const { download_url } = await getCertificateDownloadUrl(cert.id);
      window.open(download_url, "_blank");
    } catch (err: any) {
      console.error("Error descargando:", err);
      toast.push(err.message || "No se pudo generar el enlace.");
    } finally {
      setDownloadStatus((prev) => ({ ...prev, [cert.id]: false }));
    }
  };

  // --- 4. AÑADE LA NUEVA FUNCIÓN DE BORRADO ---
  const onFileDelete = async (certToDelete: ApiCertificate) => {
    // Pedir confirmación
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${certToDelete.file_name_original}"?`)) {
      return;
    }

    setDeleteStatus((prev) => ({ ...prev, [certToDelete.id]: true }));
    try {
      // Llamar a la API
      await deleteCertificate(certToDelete.id);

      // Eliminar el certificado de la lista en el estado local
      setList((currentList) =>
        currentList.filter((cert) => cert.id !== certToDelete.id)
      );

      toast.push("Certificado eliminado.");
      
    } catch (err: any) {
      console.error("Error eliminando:", err);
      toast.push(err.message || "No se pudo eliminar el certificado.");
      // Volver a habilitar el botón si falla
      setDeleteStatus((prev) => ({ ...prev, [certToDelete.id]: false }));
    }
    // No necesitamos un 'finally' porque el elemento desaparece
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Formulario de subida */}
      <div className="grid gap-3 md:grid-cols-3">
        <input
          key={fileInputKey}
          ref={null}
          type="file"
          accept="application/pdf"
          onChange={onFileChange}
          className="md:col-span-2 w-full border rounded-lg p-2 text-sm"
          required
        />
        <Button
          type="button"
          onClick={onFileUpload}
          disabled={isUploading || !selectedFile}
          className="md:col-span-1"
        >
          {isUploading ? "Subiendo..." : "Subir PDF"}
        </Button>
      </div>

      {/* Lista de certificados */}
      {isLoading ? (
        <p className="text-sm text-gray-600">Cargando certificados...</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-gray-600">Aún no subes certificados.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-white">
          {list.map((c) => (
            <li key={c.id} className="p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-medium">{c.file_name_original}</div>
                <div className="text-xs text-gray-600">
                  Subido: {new Date(c.uploaded_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => onFileDownload(c)}
                disabled={downloadStatus[c.id] || deleteStatus[c.id]}
                className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-100 disabled:opacity-50"
              >
                {downloadStatus[c.id] ? "..." : "Descargar"}
              </button>
              
              {/* --- 5. AÑADE EL BOTÓN DE ELIMINAR --- */}
              <button
                onClick={() => onFileDelete(c)}
                disabled={deleteStatus[c.id] || downloadStatus[c.id]}
                className="text-sm px-3 py-1 rounded-lg border text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {deleteStatus[c.id] ? "..." : "Eliminar"}
              </button>
              
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}