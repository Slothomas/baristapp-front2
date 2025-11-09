import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { getUserMock } from "../../api/auth";
import { addCertificate } from "../../store/certificatesStore";
import { useToast } from "../../components/Toast";

export default function UploadCertificate() {
  const u = getUserMock();
  const toast = useToast();

  const [baristaName, setBaristaName] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  if (!u) return (
    <AppLayout><Card className="p-6">Inicia sesión</Card></AppLayout>
  );
  if (u.role !== "academy") return (
    <AppLayout><Card className="p-6">Solo academias pueden subir certificados</Card></AppLayout>
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !baristaName || !title) {
      toast.push("Completa todos los campos");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      addCertificate({
        baristaName,
        academyId: u.id,
        title,
        fileData: reader.result as string,
      });
      toast.push("Certificado subido correctamente");
      setBaristaName("");
      setTitle("");
      setFile(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Subir certificado</h1>
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Input
            label="Nombre del barista"
            placeholder="Ejemplo: Juan Pérez"
            value={baristaName}
            onChange={(e) => setBaristaName(e.target.value)}
            required
          />

          <Input
            label="Título del certificado"
            placeholder="Ejemplo: Curso avanzado de Latte Art"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label className="text-sm">
            <span className="block mb-1">Archivo PDF</span>
            <input type="file" accept="application/pdf" onChange={handleFile} />
          </label>

          <Button type="submit">Guardar certificado</Button>
        </form>
      </Card>
    </AppLayout>
  );
}
