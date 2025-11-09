import { useEffect, useRef, useState } from "react";
import { addCert, getCerts, removeCert, type Cert } from "../store/certStore";
import Button from "./Button";

export default function CertificateUpload() {
  const [list, setList] = useState<Cert[]>([]);
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setList(getCerts());
  }, []);

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    // solo pdf
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      alert("Solo se admiten archivos PDF.");
      e.target.value = "";
      return;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = fileRef.current;
    const f = input?.files?.[0];
    if (!f) return alert("Selecciona un PDF");
    if (!name.trim()) return alert("Escribe un nombre para el certificado");

    // leer pdf como dataURL (demo sin backend)
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const rd = new FileReader();
      rd.onload = () => resolve(rd.result as string);
      rd.onerror = (err) => reject(err);
      rd.readAsDataURL(f);
    });

    addCert({ name, fileName: f.name, dataUrl });
    setList(getCerts());
    setName("");
    if (input) input.value = "";
  }

  function del(id: string) {
    if (!confirm("¿Eliminar este certificado?")) return;
    removeCert(id);
    setList(getCerts());
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-5">
        <input
          className="md:col-span-2 w-full border rounded-lg p-2"
          placeholder="Nombre del certificado"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          onChange={onFilePick}
          className="md:col-span-2 w-full border rounded-lg p-2"
          required
        />
        <Button type="submit" className="md:col-span-1">Subir PDF</Button>
      </form>

      {list.length === 0 ? (
        <p className="text-sm text-gray-600">Aún no subes certificados.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-white">
          {list.map((c) => (
            <li key={c.id} className="p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-gray-600">{c.fileName}</div>
              </div>
              <a
                href={c.dataUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-100"
              >
                Ver
              </a>
              <button
                onClick={() => del(c.id)}
                className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-100"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
