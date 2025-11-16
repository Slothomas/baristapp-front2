// src/pages/support.tsx
import { useState } from "react";
import AppLayout from "../components/AppLayout";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { getUserMock } from "../api/auth";
import { useToast } from "../components/Toast";

// --- 1. Importa la función de la API real ---
import { sendSupportTicket } from "../api/support";
// --- (Eliminamos la importación de 'supportStore') ---


// --- 2. Definimos el tipo de categoría localmente ---
type SupportCategory = "Técnico" | "Cuenta" | "Pagos" | "Sugerencia" | "Otro";


export default function Support() {
  const user = getUserMock();
  const toast = useToast();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportCategory>("Técnico");
  const [message, setMessage] = useState("");
  
  // --- 3. Añadimos un estado de 'enviando' ---
  const [isSending, setIsSending] = useState(false);
  // --- (Eliminamos 'ticketId' porque ya no es relevante) ---


  // --- 4. Esta es la función principal que cambia ---
  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Validar que el usuario esté logueado
    if (!user || !user.email) {
      toast.push("Debes iniciar sesión para enviar un ticket de soporte.");
      return;
    }

    // Validar campos
    if (!subject.trim() || !message.trim()) {
      toast.push("Completa asunto y mensaje");
      return;
    }

    setIsSending(true);

    try {
      // Preparamos el mensaje para el backend.
      // Incluimos la categoría y los datos del usuario en el cuerpo
      // para que el admin de soporte tenga el contexto.
      const fullMessage = `
        Categoría: ${category}
        Usuario: ${user.name} (ID: ${user.id}, Email: ${user.email})
        ---------------------------------
        ${message.trim()}
      `;

      // Llamamos a la API real
      await sendSupportTicket({
        user_email: user.email,
        subject: subject.trim(),
        message: fullMessage,
      });

      // Éxito
      toast.push("Tu mensaje fue enviado. ¡Gracias!");
      setSubject("");
      setCategory("Técnico");
      setMessage("");

    } catch (err: any) {
      console.error("Error enviando soporte:", err);
      toast.push(err.message || "No se pudo enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  }

  // --- 5. Eliminamos la variable 'mailto' ---
  // (Ya no es necesaria, el botón de 'Enviar a soporte' es el real)

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
                onChange={(e) => setCategory(e.target.value as SupportCategory)}
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

            {/* --- 6. Actualizamos los botones --- */}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSending}>
                {isSending ? "Enviando..." : "Enviar a soporte"}
              </Button>
              {/* Eliminamos el botón 'mailto' */}
            </div>

            {/* --- 7. Eliminamos el mensaje de 'ticketId' --- */}
            
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