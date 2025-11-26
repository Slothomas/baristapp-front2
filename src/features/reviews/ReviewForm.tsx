// src/features/reviews/ReviewForm.tsx
import { useState } from "react";
import Stars from "../../components/Stars";
import Button from "../../components/Button";
import { createReview, type CreateReviewPayload } from "../../api/review";

type Props = {
  jobId: number | string;
  applicationId: number | string;
  fromUserId: number | string;   // reviewer (quien escribe la reseña)
  toUserId?: number | string;    // reviewee (opcional — backend lo infiere)
  role: "barista" | "cafe";
  onDone?: () => void;
};

const TOPICS = [
  { value: "general", label: "General" },
  { value: "puntualidad", label: "Puntualualidad" },
  { value: "actitud", label: "Actitud" },
  { value: "habilidades", label: "Habilidades" },
  { value: "comunicacion", label: "Comunicación" },
];

export default function ReviewForm({
  jobId,
  applicationId,
  fromUserId,
  toUserId,
  onDone,
}: Props) {
  const [stars, setStars] = useState<number>(5);
  const [topic, setTopic] = useState<string>("general");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;

    try {
      setSending(true);

      const payload: CreateReviewPayload = {
        application_id: Number(applicationId),
        job_offer_id: Number(jobId),
        rating: stars,
        topic: topic || "general",
        comment: comment.trim() || null,
      };

      // ---------------------------------------
      // 🔵 LOGS AVANZADOS para capturar error 422
      // ---------------------------------------
      console.log("📤 Enviando reseña...");
      console.log("📦 Payload ENVIADO:", JSON.stringify(payload, null, 2));
      console.log("👤 reviewer_id (query):", Number(fromUserId));
      console.log("🎯 toUserId (reviewee):", toUserId);
      console.log("⭐ rating:", stars);
      console.log("🏷️ topic:", topic);
      console.log("📝 comment:", comment);
      console.log("🔗 Endpoint final:", `/reviews/?reviewer_id=${Number(fromUserId)}`);
      // ---------------------------------------

      const reviewerIdNum = Number(fromUserId);

      await createReview(payload, reviewerIdNum);

      onDone?.();
    } catch (err: any) {
      console.error("❌ ERROR COMPLETO:", err);
      console.log("❌ BACK DETAIL:", err?.response?.data);
      console.log("❌ STATUS:", err?.response?.status);
      console.log("❌ HEADERS:", err?.response?.headers);

      const detail = err?.response?.data?.detail;

      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg).join(". ")
        : detail || "No se pudo enviar la reseña";

      alert(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="text-sm text-gray-700">Calificación</label>
      <Stars value={stars} onChange={setStars} />

      <label className="text-sm text-gray-700 mt-2">Tópico</label>
      <select
        className="w-full border rounded-lg p-2"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      >
        {TOPICS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <label className="text-sm text-gray-700 mt-2">Comentario (opcional)</label>
      <textarea
        rows={3}
        className="w-full border rounded-lg p-2"
        placeholder="¿Cómo fue el turno? ¿Qué destacarías?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <div className="mt-2">
        <Button type="submit" disabled={sending}>
          {sending ? "Enviando..." : "Enviar evaluación"}
        </Button>
      </div>
    </form>
  );
}
