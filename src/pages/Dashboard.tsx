import AppLayout from "../components/AppLayout";
import { getUserMock } from "../api/auth";
import DashboardBarista from "../features/dashboard/DashboardBarista";
import DashboardCafe from "../features/dashboard/DashboardCafe";
//import DashboardAdmin from "../features/dashboard/DashboardAdmin";
import { normalizeRole } from "../lib/roles";

export default function Dashboard() {
  const u = getUserMock();
  const role = normalizeRole(u);

  return (
    <AppLayout>
      {role === "barista" && <DashboardBarista />}
      {role === "cafe" && <DashboardCafe />}
      {role === "unknown" && (
        <div className="p-6 text-gray-600">
          No pudimos detectar tu rol. Contáctanos.
        </div>
      )}
    </AppLayout>
  );
}
