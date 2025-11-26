// src/features/profile/PublicProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import { fetchProfile } from "../../api/profile";

import {
  getReviewsByUser,
  type Review,
  type ReviewsByUserResponse,
} from "../../api/review";

import {
  getCertificates,
  getCertificateDownloadUrl,
  type ApiCertificate,
} from "../../api/certificate";

function Stars({ value = 0 }: { value?: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= v ? "text-yellow-500" : "text-gray-300"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const numericUserId =
    userId && !isNaN(Number(userId)) ? Number(userId) : null;

  const [profile, setProfile] = useState<any | null>(null);
  const [reviewsData, setReviewsData] =
    useState<ReviewsByUserResponse | null>(null);
  const [certificates, setCertificates] = useState<ApiCertificate[]>([]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingCerts, setLoadingCerts] = useState(true);

  useEffect(() => {
    async function load() {
      if (!numericUserId) {
        setLoadingProfile(false);
        setLoadingReviews(false);
        setLoadingCerts(false);
        return;
      }

      try {
        setLoadingProfile(true);
        setLoadingReviews(true);
        setLoadingCerts(true);

        const [p, r, c] = await Promise.allSettled([
          fetchProfile(numericUserId),
          getReviewsByUser(numericUserId),
          getCertificates(numericUserId),
        ]);

        if (p.status === "fulfilled") setProfile(p.value);
        else setProfile(null);

        if (r.status === "fulfilled") setReviewsData(r.value);
        else setReviewsData(null);

        if (c.status === "fulfilled") setCertificates(c.value);
        else setCertificates([]);
      } catch (e) {
        console.error("Error cargando PublicProfile:", e);
        setProfile(null);
        setReviewsData(null);
        setCertificates([]);
      } finally {
        setLoadingProfile(false);
        setLoadingReviews(false);
        setLoadingCerts(false);
      }
    }

    load();
  }, [numericUserId]);

  const displayName = useMemo(() => {
    if (!profile) return `Usuario ${userId}`;
    return (
      profile.full_name ||
      profile.business_name ||
      `Usuario ${profile.user_id ?? userId}`
    );
  }, [profile, userId]);

  const displayRole = useMemo(() => {
    if (!profile) return "—";
    if (profile.business_name || profile.business_type) return "cafe";
    return "barista";
  }, [profile]);

  // ✅ NOMBRES REALES BACKEND
  const avg =
    reviewsData?.rating_avg != null
      ? Number(reviewsData.rating_avg)
      : profile?.rating_avg != null
      ? Number(profile.rating_avg)
      : 0;

  const count =
    reviewsData?.reviews_count != null
      ? Number(reviewsData.reviews_count)
      : profile?.reviews_count != null
      ? Number(profile.reviews_count)
      : 0;

  const reviews: Review[] = reviewsData?.reviews ?? [];

  async function handleDownload(certId: number) {
    try {
      const res = await getCertificateDownloadUrl(certId);
      if (res?.download_url) {
        window.open(res.download_url, "_blank");
      }
    } catch (err) {
      console.error("Error al descargar certificado:", err);
      alert("No se pudo descargar el certificado.");
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto grid gap-6">
        {/* HEADER */}
        <Card className="p-6 flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gray-200 overflow-hidden grid place-items-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-500">Sin avatar</span>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-semibold">
              {loadingProfile ? "Cargando..." : displayName}
            </h1>

            <div className="text-sm text-gray-600 capitalize">
              Rol:{" "}
              {displayRole === "cafe"
                ? profile?.business_type || "Cafetería"
                : "Barista"}
            </div>

            {(profile?.region || profile?.comuna) && (
              <div className="text-sm text-gray-600">
                {profile?.comuna ? `${profile.comuna}, ` : ""}
                {profile?.region || ""}
              </div>
            )}

            {/* RATING */}
            <div className="mt-2 flex items-center gap-2">
              <Stars value={avg} />
              <span className="text-sm text-gray-700">
                {avg ? avg.toFixed(1) : "—"} / 5 · {count} reseña
                {count === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <a
            href="/app/support"
            className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-100"
          >
            Contactar
          </a>
        </Card>

        {/* INFO */}
        {!loadingProfile && profile && (
          <section>
            <h2 className="text-lg font-semibold mb-2">Información</h2>

            <div className="grid gap-3 md:grid-cols-2">
              {profile.rate_hour != null && (
                <Card className="p-4 text-sm">
                  <div className="text-gray-600">Tarifa por hora</div>
                  <div className="font-semibold">
                    ${Number(profile.rate_hour).toLocaleString("es-CL")} CLP
                  </div>
                </Card>
              )}

              {profile.min_shift_rate != null && (
                <Card className="p-4 text-sm">
                  <div className="text-gray-600">Mínimo por turno</div>
                  <div className="font-semibold">
                    ${Number(profile.min_shift_rate).toLocaleString("es-CL")} CLP
                  </div>
                </Card>
              )}

              {profile.years_experience != null && (
                <Card className="p-4 text-sm">
                  <div className="text-gray-600">Experiencia</div>
                  <div className="font-semibold">
                    {profile.years_experience} año
                    {profile.years_experience === 1 ? "" : "s"}
                  </div>
                </Card>
              )}

              {profile.skills?.length > 0 && (
                <Card className="p-4 text-sm">
                  <div className="text-gray-600">Especialidades</div>
                  <div className="font-semibold">
                    {profile.skills.join(", ")}
                  </div>
                </Card>
              )}

              {profile.business_name && (
                <Card className="p-4 text-sm">
                  <div className="text-gray-600">Nombre del negocio</div>
                  <div className="font-semibold">{profile.business_name}</div>
                </Card>
              )}
            </div>

            {profile.bio && (
              <Card className="p-4 text-sm mt-3">
                <div className="text-gray-600 mb-1">Bio</div>
                <div>{profile.bio}</div>
              </Card>
            )}

            {profile.availability_json && (
              <Card className="p-4 text-xs font-mono mt-3 whitespace-pre-wrap">
                <div className="text-gray-600 text-sm font-sans mb-1">
                  Disponibilidad
                </div>
                {typeof profile.availability_json === "string"
                  ? profile.availability_json
                  : JSON.stringify(profile.availability_json, null, 2)}
              </Card>
            )}
          </section>
        )}

        {/* CERTIFICADOS */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Certificados</h2>

          {loadingCerts ? (
            <Card className="p-4 text-sm text-gray-600">Cargando...</Card>
          ) : certificates.length === 0 ? (
            <Card className="p-4 text-sm text-gray-600">
              Sin certificados visibles.
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {certificates.map((cert) => (
                <Card key={cert.id} className="p-4 text-sm">
                  <div className="font-semibold mb-1">
                    {cert.file_name_original}
                  </div>

                  <div className="text-xs text-gray-500">
                    Subido: {fmtDate(cert.uploaded_at)}
                  </div>

                  <button
                    className="mt-3 inline-flex text-sm underline text-brand-600"
                    onClick={() => handleDownload(cert.id)}
                  >
                    Descargar / Ver PDF
                  </button>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* RESEÑAS */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Reseñas</h2>

          {loadingReviews ? (
            <Card className="p-4 text-sm text-gray-600">
              Cargando reseñas...
            </Card>
          ) : count === 0 ? (
            <Card className="p-4 text-sm text-gray-600">
              Sin reseñas todavía.
            </Card>
          ) : (
            <div className="grid gap-3">
              {reviews.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <Stars value={r.rating} />
                    <span className="text-xs text-gray-500">
                      {fmtDate(r.created_at)}
                    </span>
                  </div>

                  {r.topic && (
                    <div className="text-xs mt-2 text-gray-600 font-medium">
                      Tema: {r.topic}
                    </div>
                  )}

                  {r.comment && (
                    <p className="text-sm mt-2 text-gray-800">{r.comment}</p>
                  )}

                  {(r.reviewer_name || r.reviewer_id) && (
                    <div className="text-xs text-gray-500 mt-2">
                      Por: {r.reviewer_name ?? `Usuario #${r.reviewer_id}`}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
