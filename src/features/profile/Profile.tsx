// src/features/profile/Profile.tsx
import AppLayout from "../../components/AppLayout";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import CertificateUpload from "../../components/CertificateUpload";

import { useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { getUserMock } from "../../api/auth";

import { fetchUserByEmail, updateUserProfile } from "../../api/users";
import { fetchProfile, upsertProfile, uploadAvatar } from "../../api/profile";

type ProfileRole = "barista" | "cafe" | "academy" | "admin";

type ProfileData = {
  name: string;
  role: ProfileRole;
  contact_number: string; // ✅ NUEVO (snake_case recomendado)
  avatar?: string;
  years?: number;
  skills: string[];
  bio: string;

  // gig-economy
  region?: string;
  comuna?: string;
  availability_json?: any; // puede ser objeto o string temporal
  rate_hour?: number;
  min_shift_rate?: number;
  business_name?: string;
  business_type?: string;

  // calculados backend
  rating_avg?: number | null;
  reviews_count?: number | null;
};

// helper para normalizar rol desde backend
function normalizeRole(raw: any): ProfileRole {
  const r = (raw ?? "").toString().toLowerCase().trim();
  if (r === "barista" || r === "worker" || r === "freelancer") return "barista";
  if (r === "cafe" || r === "client" || r === "restaurant" || r === "cafeteria")
    return "cafe";
  if (r === "academy" || r === "escuela" || r === "training_center")
    return "academy";
  if (r === "admin" || r === "administrator") return "admin";
  return "barista";
}

// helper: si es objeto JSON válido lo devuelve, si es string inválido => undefined
function safeJsonForBackend(value: any) {
  if (value == null || value === "") return undefined;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function validatePhone(phoneRaw: string): boolean {
  const clean = (phoneRaw ?? "").replace(/[^0-9+]/g, "");
  const digitsOnly = clean.replace(/\D/g, "");
  return digitsOnly.length >= 8;
}

export default function Profile() {
  const toast = useToast();
  const u = getUserMock();

  const email = u?.email || null;
  const userId = u?.id && !isNaN(Number(u.id)) ? Number(u.id) : null;

  const [form, setForm] = useState<ProfileData>({
    name: "",
    role: "barista",
    contact_number: "", // ✅ NUEVO
    avatar: undefined,
    years: undefined,
    skills: [],
    bio: "",

    region: "",
    comuna: "",
    availability_json: null,
    rate_hour: undefined,
    min_shift_rate: undefined,
    business_name: "",
    business_type: "",

    rating_avg: null,
    reviews_count: null,
  });

  const [errors, setErrors] = useState<{ name?: string; contact_number?: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // =========================================================
  // Cargar datos desde backend: app_user + app_user_profile
  // =========================================================
  useEffect(() => {
    async function loadProfile() {
      if (!email || !userId) {
        setLoading(false);
        return;
      }

      try {
        const [userRes, profileRes] = await Promise.allSettled([
          fetchUserByEmail(email),
          fetchProfile(userId),
        ]);

        let nameFromUser = "";
        let roleFromUser: ProfileRole = "barista";
        let contactFromUser = ""; // ✅ NUEVO

        if (userRes.status === "fulfilled") {
          const user = userRes.value;
          nameFromUser = user.user ?? "";
          roleFromUser = normalizeRole(user.clave ?? user.clave);

          // ✅ si backend trae contact_number / contactNumber / phone
          contactFromUser =
            (user as any).contact_number ??
            (user as any).contactNumber ??
            (user as any).phone ??
            "";
        }

        let years: number | undefined = undefined;
        let skills: string[] = [];
        let bio = "";
        let avatar: string | undefined = undefined;

        let region = "";
        let comuna = "";
        let availability_json: any = null;
        let rate_hour: number | undefined = undefined;
        let min_shift_rate: number | undefined = undefined;
        let business_name = "";
        let business_type = "";
        let rating_avg: number | null = null;
        let reviews_count: number | null = null;

        if (profileRes.status === "fulfilled") {
          const p = profileRes.value;

          years = p.years_experience ?? undefined;
          skills = p.skills ?? [];
          bio = p.bio ?? "";
          avatar = p.avatar_url ?? undefined;

          region = p.region ?? "";
          comuna = p.comuna ?? "";
          availability_json = p.availability_json ?? null;
          rate_hour = p.rate_hour != null ? Number(p.rate_hour) : undefined;
          min_shift_rate =
            p.min_shift_rate != null ? Number(p.min_shift_rate) : undefined;
          business_name = p.business_name ?? "";
          business_type = p.business_type ?? "";
          rating_avg = p.rating_avg != null ? Number(p.rating_avg) : null;
          reviews_count =
            p.reviews_count != null ? Number(p.reviews_count) : null;

          if (!nameFromUser && p.full_name) {
            nameFromUser = p.full_name;
          }
        }

        setForm({
          name: nameFromUser,
          role: roleFromUser,
          contact_number: contactFromUser, // ✅ NUEVO
          years,
          skills,
          bio,
          avatar,

          region,
          comuna,
          availability_json,
          rate_hour,
          min_shift_rate,
          business_name,
          business_type,
          rating_avg,
          reviews_count,
        });
      } catch (err) {
        console.error("Error cargando perfil:", err);
        toast.push("No se pudo cargar el perfil.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [email, userId, toast]);

  // =========================================================
  // Subir avatar
  // =========================================================
  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      toast.push("Por favor, selecciona un archivo de imagen.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const updatedProfile = await uploadAvatar(userId, file);
      setForm((f) => ({
        ...f,
        avatar: updatedProfile.avatar_url ?? undefined,
      }));
      toast.push("Avatar actualizado.");
    } catch (err: any) {
      console.error("Error subiendo avatar:", err);
      toast.push(err.message || "No se pudo subir el avatar.");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  }

  // =========================================================
  // Guardar perfil: app_user + app_user_profile
  // =========================================================
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};

    if (!form.name.trim()) errs.name = "Ingresa un nombre";

    // ✅ Validación contacto
    if (!form.contact_number.trim())
      errs.contact_number = "Ingresa tu número de contacto";
    else if (!validatePhone(form.contact_number.trim()))
      errs.contact_number = "Número inválido (mín. 8 dígitos)";

    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!email || !userId) {
      toast.push("No se encontró el usuario autenticado.");
      return;
    }

    try {
      setSaving(true);

      await updateUserProfile(email, {
        name: form.name.trim(),
        role: form.role,
        contact_number: form.contact_number.trim(), // ✅ NUEVO
      });

      await upsertProfile(userId, {
        full_name: form.name.trim(),
        bio: form.bio || undefined,
        years_experience:
          typeof form.years === "number" ? form.years : undefined,
        skills: form.skills ?? [],
        avatar_url: form.avatar || undefined,

        region: form.region || undefined,
        comuna: form.comuna || undefined,

        // ✅ solo mandamos JSON válido
        availability_json: safeJsonForBackend(form.availability_json),

        rate_hour:
          typeof form.rate_hour === "number" ? form.rate_hour : undefined,
        min_shift_rate:
          typeof form.min_shift_rate === "number"
            ? form.min_shift_rate
            : undefined,
        business_name: form.business_name || undefined,
        business_type: form.business_type || undefined,
      });

      toast.push("Perfil guardado correctamente");
    } catch (err) {
      console.error("Error guardando perfil:", err);
      toast.push("No se pudo guardar el perfil en el servidor.");
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // Render
  // =========================================================
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">
          Mi Perfil
        </h1>

        <Card className="p-6 shadow-md">
          {loading ? (
            <div className="text-sm text-gray-600">Cargando perfil...</div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-5">
              <div className="flex items-center gap-5">
                <div className="h-24 w-24 rounded-full bg-gray-200 overflow-hidden grid place-items-center ring-2 ring-brand-500">
                  {isUploadingAvatar ? (
                    <span className="text-xs text-gray-500 p-2 text-center">
                      Cargando...
                    </span>
                  ) : form.avatar ? (
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
                    disabled={isUploadingAvatar}
                    className="text-sm"
                  />
                </label>
              </div>

              {/* Rating / reviews (solo lectura) */}
              <Card className="p-4 bg-gray-50">
                <div className="text-sm text-gray-700">
                  Rating promedio:{" "}
                  <b>
                    {form.rating_avg != null
                      ? form.rating_avg.toFixed(1)
                      : "—"}
                  </b>{" "}
                  / 5
                </div>
                <div className="text-sm text-gray-700">
                  Reseñas recibidas:{" "}
                  <b>{form.reviews_count != null ? form.reviews_count : 0}</b>
                </div>
              </Card>

              <Input
                label="Nombre completo"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                error={errors?.name}
                required
              />

              {/* ✅ NUEVO CONTACTO */}
              <Input
                label="Número de contacto"
                placeholder="+56912345678"
                value={form.contact_number}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    contact_number: e.target.value.replace(/[^0-9+]/g, ""),
                  }))
                }
                error={errors?.contact_number}
                required
              />

              <label className="block space-y-1">
                <span className="text-sm text-gray-700 font-medium">Rol</span>
                <select
                  className="w-full border rounded-lg p-2"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as ProfileRole,
                    }))
                  }
                >
                  <option value="barista">Barista</option>
                  <option value="cafe">Cafetería</option>
                  <option value="academy">Academia</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>

              {/* Ubicación */}
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-sm text-gray-700 font-medium">
                    Región
                  </span>
                  <input
                    className="w-full border rounded-lg p-2"
                    value={form.region ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, region: e.target.value }))
                    }
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-sm text-gray-700 font-medium">
                    Comuna
                  </span>
                  <input
                    className="w-full border rounded-lg p-2"
                    value={form.comuna ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, comuna: e.target.value }))
                    }
                  />
                </label>
              </div>

              {/* Datos gig-economy */}
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-sm text-gray-700 font-medium">
                    Tarifa por hora (CLP)
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="w-full border rounded-lg p-2"
                    value={form.rate_hour ?? 0}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        rate_hour: Math.max(0, Number(e.target.value || 0)),
                      }))
                    }
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-sm text-gray-700 font-medium">
                    Mínimo por turno (CLP)
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="w-full border rounded-lg p-2"
                    value={form.min_shift_rate ?? 0}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        min_shift_rate: Math.max(
                          0,
                          Number(e.target.value || 0)
                        ),
                      }))
                    }
                  />
                </label>
              </div>

              {/* Campos negocio */}
              {(form.role === "cafe" || form.role === "academy") && (
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block space-y-1">
                    <span className="text-sm text-gray-700 font-medium">
                      Nombre del negocio
                    </span>
                    <input
                      className="w-full border rounded-lg p-2"
                      value={form.business_name ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          business_name: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-sm text-gray-700 font-medium">
                      Tipo de negocio
                    </span>
                    <input
                      className="w-full border rounded-lg p-2"
                      placeholder="Cafetería / Academia"
                      value={form.business_type ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          business_type: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              )}

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

              {/* Disponibilidad JSON libre */}
              <label className="block space-y-1">
                <span className="text-sm text-gray-700 font-medium">
                  Disponibilidad (JSON)
                </span>
                <textarea
                  rows={3}
                  className="w-full border rounded-lg p-2 resize-none font-mono text-xs"
                  placeholder='{"days":["Mon","Tue"],"hours":["09:00-18:00"]}'
                  value={
                    form.availability_json
                      ? typeof form.availability_json === "string"
                        ? form.availability_json
                        : JSON.stringify(form.availability_json)
                      : ""
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      availability_json: e.target.value,
                    }))
                  }
                />
                {typeof form.availability_json === "string" &&
                  form.availability_json.trim() !== "" &&
                  safeJsonForBackend(form.availability_json) === undefined && (
                    <span className="text-xs text-red-600">
                      JSON inválido. Corrígelo para poder guardarlo.
                    </span>
                  )}
              </label>

              <div className="flex gap-3 justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => history.back()}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Certificados */}
        <div className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-800">
            Certificados (PDF)
          </h2>
          <p className="text-sm text-gray-600">
            Sube tus certificados o diplomas en formato PDF.
          </p>
          <Card className="p-6 shadow-sm">
            {userId ? (
              <CertificateUpload userId={userId} />
            ) : (
              <p className="text-sm text-gray-500">
                Cargando información de usuario...
              </p>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
