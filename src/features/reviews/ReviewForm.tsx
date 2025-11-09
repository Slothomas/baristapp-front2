import { useState } from "react";
import Stars from "../../components/Stars";
import Button from "../../components/Button";
import { addReview } from "../../store/reviewsStore";

type Props = {
  jobId: string;
  fromUserId: string;     // quien evalua (usuario logeado)
  toUserId: string;       // quien recibe la evaluación
  role: "barista" | "cafe"; // rol del evaluado
  onDone?: () => void;
};

export default function ReviewForm({ jobId, fromUserId, toUserId, role, onDone }: Props) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    addReview({ jobId, fromUserId, toUserId, role, stars, comment: comment.trim() });
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="text-sm text-gray-700">Calificación</label>
      <Stars value={stars} onChange={setStars} />
      <label className="text-sm text-gray-700 mt-2">Comentario (opcional)</label>
      <textarea
        rows={3}
        className="w-full border rounded-lg p-2"
        placeholder="¿Cómo fue el turno? ¿Qué destacarías?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="mt-2">
        <Button type="submit">Enviar evaluación</Button>
      </div>
    </form>
  );
}
