import { useState } from "react";
import AppLayout from "../components/AppLayout";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { createTicket, type Ticket } from "../store/supportStore";
import { getUserMock } from "../api/auth";
import { useToast } from "../components/Toast";

export default function Support() {
  const user = getUserMock();
  const toast = useToast();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Ticket["category"]>("Técnico");
  const [message, setMessage] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.push("Completa asunto y mensaje");
      return;
    }
    const t = createTicket({
      userId: user?.id ?? null,
      subject: subject.trim(),
      category,
      message: message.trim(),
    });
    setTicketId(t.id);
    toast.push("Tu caso fue registrado");
    setSubject("");
    setCategory("Técnico");
    setMessage("");
  }

  const mailto = `mailto:soporte@baristapp.cl?subject=${encodeURIComponent(
    `[BaristApp] ${subject || "Consulta/Soporte"}`
  )}&body=${encodeURIComponent(
    `Hola equipo BaristApp,\n\nCategoría: ${category}\nUsuario: ${user?.id ?? "anónimo"}\n\n${message}\n\nGracias.`
  )}`;

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Contacto / Soporte</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <form onSubmit={submit} className="grid gap-3">
            <Input
              label="Asunto"
              placeholder="No puedo iniciar sesión"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <label className="block space-y-1">
              <span className="text-sm text-gray-700">Categoría</span>
              <select
                className="w-full border rounded-lg p-2"
                value={category}
                onChange={(e) => setCategory(e.target.value as Ticket["category"])}
              >
                <option>Cuenta</option>
                <option>Técnico</option>
                <option>Pagos</option>
                <option>Sugerencia</option>
                <option>Otro</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-gray-700">Mensaje</span>
              <textarea
                rows={6}
                className="w-full border rounded-lg p-2"
                placeholder="Describe el problema o tu consulta con el mayor detalle posible."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </label>

            <div className="flex gap-2">
              <Button type="submit">Enviar a soporte</Button>
              <a
                className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-100"
                href={mailto}
              >
                Enviar por correo
              </a>
            </div>

            {ticketId && (
              <div className="text-sm text-green-700 mt-2">
                Caso creado: <b>{ticketId}</b> (guárdalo para seguimiento)
              </div>
            )}
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Consejos rápidos</h2>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Adjunta pasos para reproducir el problema.</li>
            <li>Indica si usas móvil o escritorio y el navegador.</li>
            <li>Si es sobre una vacante, copia el título/ID del turno.</li>
          </ul>
        </Card>
      </div>
    </AppLayout>
  );
}
