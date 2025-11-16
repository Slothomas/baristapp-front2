// src/components/CertificateUpload.tsx
import { useEffect, useState } from "react";
import { useToast } from "./Toast"; // Usamos el Toast
import {
  getCertificates,
  uploadCertificate,
  getCertificateDownloadUrl,
  type ApiCertificate, // Importamos el tipo desde la API
} from "../api/certificate";
import Button from "./Button";

// 1. EL COMPONENTE AHORA NECESITA EL user_id
interface Props {
  userId: number;
}

// 2. Estado para los botones de descarga
type DownloadStatus = { [key: number]: boolean };

export default function CertificateUpload({ userId }: Props) {
  const [list, setList] = useState<ApiCertificate[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState<string>("empty"); // Para resetear el input

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({});

  const toast = useToast();

  // 3. CARGAR LA LISTA DESDE LA API (no desde certStore)
  useEffect(() => {
    // No hacer nada si no tenemos el userId
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
  // ¡¡CAMBIO IMPORTANTE!! Se quitó 'toast' del array para evitar el bucle infinito.
  }, [userId]);

  // 4. MANEJAR LA SELECCIÓN DE ARCHIVO
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Mantenemos tu validación de PDF (¡es buena!)
    if (f.type !== "application/pdf") {
      toast.push("Solo se admiten archivos PDF.");
      e.target.value = "";
      setSelectedFile(null);
      return;
    }
    setSelectedFile(f);
  };

  // 5. SUBIR EL ARCHIVO A LA API (reemplaza tu onSubmit)
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
      // Llamamos a la API
      const newCert = await uploadCertificate(userId, selectedFile);

      // Añadimos el nuevo certificado a la lista local (más rápido que recargar)
      setList((currentList) => [...currentList, newCert]);
      toast.push(`Certificado "${newCert.file_name_original}" subido.`);

      // Limpiar el input
      setSelectedFile(null);
      setFileInputKey(`key-${Date.now()}`); // Forzar reseteo del input
    } catch (err: any) {
      console.error("Error subiendo:", err);
      toast.push(err.message || "No se pudo subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  // 6. MANEJAR LA DESCARGA (reemplaza tu "Ver")
  const onFileDownload = async (cert: ApiCertificate) => {
    setDownloadStatus((prev) => ({ ...prev, [cert.id]: true }));
    try {
      const { download_url } = await getCertificateDownloadUrl(cert.id);

      // Abrir el enlace seguro en una nueva pestaña
      window.open(download_url, "_blank");
    } catch (err: any) {
      console.error("Error descargando:", err);
      toast.push(err.message || "No se pudo generar el enlace.");
    } finally {
      setDownloadStatus((prev) => ({ ...prev, [cert.id]: false }));
    }
  };

  // 7. RENDER (Simplificado y conectado a la API)
  if (!userId) {
    return null; // No mostrar nada si no hay usuario
  }

  return (
    <div className="space-y-4">
      {/* Formulario de subida (simplificado) */}
      <div className="grid gap-3 md:grid-cols-3">
        <input
          key={fileInputKey} // Truco para resetear
          ref={null} // Ya no usamos ref
          type="file"
          accept="application/pdf"
          onChange={onFileChange}
          className="md:col-span-2 w-full border rounded-lg p-2 text-sm"
          required
        />
        <Button
          type="button" // Ya no es un form submit
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
                {/* Usamos el nombre original, ya no hay "nombre" manual */}
                <div className="font-medium">{c.file_name_original}</div>
                <div className="text-xs text-gray-600">
                  Subido: {new Date(c.uploaded_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => onFileDownload(c)}
                disabled={downloadStatus[c.id]}
                className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-100 disabled:opacity-50"
              >
                {downloadStatus[c.id] ? "..." : "Descargar"}
              </button>
              {/* El botón de eliminar se quita, ya que no hicimos ese endpoint */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}