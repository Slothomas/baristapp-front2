import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { addJob } from "../../store/jobsStore";
import { getUserMock } from "../../api/auth";
import { useToast } from "../../components/Toast";
import { useNavigate } from "react-router-dom";

export default function PostJob() {
  const u = getUserMock();
  const toast = useToast();
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startISO, setStartISO] = useState("");
  const [endISO, setEndISO] = useState("");
  const [payCLP, setPayCLP] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!u) return toast.push("Debes iniciar sesión");
    if (u.role !== "cafe") return toast.push("Solo cafeterías pueden publicar");
    if (!title || !location || !startISO || !endISO || payCLP === "") {
      return toast.push("Completa los campos obligatorios");
    }
    addJob({
      title,
      location,
      startISO,
      endISO,
      payCLP: Number(payCLP),
      description,
      requirements,
      ownerId: u.id,
      active: true,
    });
    toast.push("Vacante publicada");
    nav("/app/jobs"); // redirige a la lista que verán baristas
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Publicar vacante</h1>
      <form onSubmit={onSubmit} className="grid gap-3 max-w-2xl">
        <Input label="Título*" placeholder="Barista turno mañana" value={title} onChange={e=>setTitle(e.target.value)} required />
        <Input label="Ubicación*" placeholder="Providencia" value={location} onChange={e=>setLocation(e.target.value)} required />

        <div className="grid md:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm text-gray-700">Inicio*</span>
            <input type="datetime-local" className="w-full border rounded-lg p-2" value={startISO} onChange={e=>setStartISO(e.target.value)} required />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-gray-700">Fin*</span>
            <input type="datetime-local" className="w-full border rounded-lg p-2" value={endISO} onChange={e=>setEndISO(e.target.value)} required />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-sm text-gray-700">Pago (CLP)*</span>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg p-2"
            placeholder="45000"
            value={payCLP}
            onChange={e=>setPayCLP(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-gray-700">Descripción</span>
          <textarea rows={4} className="w-full border rounded-lg p-2" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Tareas del turno, dress code, caja/espresso, etc." />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-gray-700">Requisitos</span>
          <textarea rows={3} className="w-full border rounded-lg p-2" value={requirements} onChange={e=>setRequirements(e.target.value)} placeholder="Certificados deseables, experiencia mínima..." />
        </label>

        <div className="flex gap-2">
          <Button type="submit">Publicar</Button>
          <Button type="button" variant="secondary" onClick={()=>history.back()}>Cancelar</Button>
        </div>
      </form>
    </AppLayout>
  );
}
