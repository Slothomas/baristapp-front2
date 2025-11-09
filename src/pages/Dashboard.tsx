import AppLayout from "../components/AppLayout";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { getApplications } from "../store/applyStore";
import { getUserMock } from "../api/auth";

function Stat({ label, value }: {label:string; value:string|number}) {
  return (
    <Card className="p-4">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}

export default function Dashboard() {
  const apps = getApplications();
  const u = getUserMock();
  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resumen</h1>
          <p className="text-sm text-gray-600">Estado general de tu cuenta</p>
        </div>
        <Badge>Demo</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-4">
        <Stat label="Usuario" value={u?.name ?? "—"} />
        <Stat label="Postulaciones" value={apps.length} />
        <Stat label="Estado" value="Activo" />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold">Próximos pasos</h2>
        <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
          <li>Completa tu <b>perfil</b> con foto y rol.</li>
          <li>Explora <b>Vacantes</b> y postula a oportunidades.</li>
          <li>Publica una vacante si eres <b>cafetería</b>.</li>
        </ul>
      </Card>
    </AppLayout>
  );
}
