import AppLayout from "../../components/AppLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { useState, useEffect } from "react";
import { useToast } from "../../components/Toast";
import { getUserMock } from "../../api/auth";
import CertificateUpload from "../../components/CertificateUpload";
import { sget, sset } from "../../lib/secureStorage"; // 🔒 cifrado AES local

type ProfileData = {
  name: string;
  role: "barista" | "cafe" | "academy" | "admin";
  avatar?: string;
  years?: number;
  skills?: string[];
  bio?: string;
};

const KEY = "profile.data.secure";

export default function Profile() {
  const toast = useToast();
  const u = getUserMock();
  const [form, setForm] = useState<ProfileData>({
    name: u?.name || "",
    role: (u?.role as any) || "barista",
    avatar: undefined,
    years: 0,
    skills: [],
    bio: "",
  });
  const [errors, setErrors] = useState<{ name?: string }>();

  // cargar datos guardados
  useEffect(() => {
    const saved = sget<ProfileData>(KEY);
    if (saved) setForm((f) => ({ ...f, ...saved }));
  }, []);

  // subir foto de perfil
  function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => setForm((f) => ({ ...f, avatar: rd.result as string }));
    rd.readAsDataURL(file);
  }

  // guardar perfil
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "Ingresa un nombre";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    sset(KEY, form);
    toast.push("Perfil guardado correctamente");
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">Mi Perfil</h1>

        {/* Datos personales */}
        <Card className="p-6 shadow-md">
          <form onSubmit={onSubmit} className="grid gap-5">
            <div className="flex items-center gap-5">
              <div className="h-24 w-24 rounded-full bg-gray-200 overflow-hidden grid place-items-center ring-2 ring-brand-500">
                {form.avatar ? (
                  <img
                    src={form.avatar}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-500">Sin avatar</span>
                )}
              </div>
              <label className="text-sm">
                <span className="block mb-1 font-medium text-gray-700">
                  Cambiar avatar
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onAvatar}
                  className="text-sm"
                />
              </label>
            </div>

            <Input
              label="Nombre completo"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={errors?.name}
              required
            />

            <label className="block space-y-1">
              <span className="text-sm text-gray-700 font-medium">Rol</span>
              <select
                className="w-full border rounded-lg p-2"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as any }))
                }
              >
                <option value="barista">Barista</option>
                <option value="cafe">Cafetería</option>
                <option value="academy">Academia</option>
                <option value="admin">Administrador</option>
              </select>
            </label>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-sm text-gray-700 font-medium">
                  Años de experiencia
                </span>
                <input
                  type="number"
                  min={0}
                  className="w-full border rounded-lg p-2"
                  value={form.years ?? 0}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      years: Math.max(0, Number(e.target.value || 0)),
                    }))
                  }
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm text-gray-700 font-medium">
                  Especialidades (separadas por coma)
                </span>
                <input
                  className="w-full border rounded-lg p-2"
                  placeholder="Latte art, Cold brew, Métodos de extracción"
                  value={(form.skills ?? []).join(", ")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      skills: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-sm text-gray-700 font-medium">Bio</span>
              <textarea
                rows={4}
                className="w-full border rounded-lg p-2 resize-none"
                placeholder="Describe tu experiencia, certificaciones y disponibilidad."
                value={form.bio ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bio: e.target.value }))
                }
              />
            </label>

            <div className="flex gap-3 justify-end">
              <Button type="submit">Guardar cambios</Button>
              <Button type="button" variant="secondary" onClick={() => history.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>

        {/* Certificados */}
        <div className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-800">
            Certificados (PDF)
          </h2>
          <p className="text-sm text-gray-600">
            Sube tus certificados o diplomas. (Esta versión es solo demo, sin backend).
          </p>
          <Card className="p-6 shadow-sm">
            <CertificateUpload />
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
