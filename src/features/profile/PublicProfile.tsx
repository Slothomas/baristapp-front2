import { useParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";

function Stars({ value = 0 }: { value?: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= v ? "text-yellow-500" : "text-gray-300"}>★</span>
      ))}
    </div>
  );
}

// helpers seguros de lectura
function safeParse<T = any>(raw: string | null): T | null {
  try { return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();

  const users = safeParse<{ id: string; name: string; role: string; avatar?: string }[]>(
    localStorage.getItem("users.store")
  ) || [];
  const user =
    users.find((u) => u.id === userId) ||
    { id: userId || "—", name: `Usuario ${userId}`, role: "—" };

  const reviews =
    (safeParse<{ toUserId: string; stars: number; comment?: string; createdAt?: number }[]>(
      localStorage.getItem("reviews.store")
    ))?.filter((r) => r.toUserId === userId) || [];
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + (Number(r.stars) || 0), 0) / reviews.length
      : 0;

  const certsAll =
    safeParse<{ id: string; baristaId?: string; baristaName?: string; title?: string; fileData?: string; uploadedAt?: number }[]>(
      localStorage.getItem("certificates.store")
    ) || [];
  let certs = certsAll.filter((c) => c.baristaId === userId);
  if (certs.length === 0 && user.name) {
    certs = certsAll.filter(
      (c) => (c.baristaName || "").toLowerCase() === user.name.toLowerCase()
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto grid gap-6">
        {/* header */}
        <Card className="p-6 flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gray-200 overflow-hidden grid place-items-center">
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-gray-500">Sin avatar</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{user.name}</h1>
            <div className="text-sm text-gray-600 capitalize">Rol: {user.role}</div>
            <div className="mt-2 flex items-center gap-2">
              <Stars value={avg} />
              <span className="text-sm text-gray-700">
                {avg ? avg.toFixed(1) : "—"} / 5 · {reviews.length} reseña
                {reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <a href="/app/support" className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-100">
            Contactar
          </a>
        </Card>

        {/* certificados */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Certificados</h2>
          {certs.length === 0 ? (
            <Card className="p-4 text-sm text-gray-600">Sin certificados visibles.</Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {certs.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="font-medium">{c.title || "Certificado"}</div>
                  {c.uploadedAt && (
                    <div className="text-xs text-gray-500">
                      Subido {new Date(c.uploadedAt).toLocaleString("es-CL")}
                    </div>
                  )}
                  {c.fileData && (
                    <a
                      className="mt-3 inline-flex text-sm underline"
                      href={c.fileData}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver PDF
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* reseñas */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Reseñas</h2>
          {reviews.length === 0 ? (
            <Card className="p-4 text-sm text-gray-600">Sin reseñas todavía.</Card>
          ) : (
            <div className="grid gap-3">
              {reviews.map((r, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center justify-between">
                    <Stars value={r.stars} />
                    {r.createdAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(r.createdAt).toLocaleString("es-CL")}
                      </span>
                    )}
                  </div>
                  {r.comment && <p className="text-sm mt-2">{r.comment}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
