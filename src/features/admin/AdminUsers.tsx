import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { getUserMock } from "../../api/auth";
import { listUsers, addUser, deleteUser, updateUser, type User } from "../../store/userStore";
import { useToast } from "../../components/Toast";

export default function AdminUsers() {
  const u = getUserMock();
  const toast = useToast();

  const [users, setUsers] = useState<User[]>(listUsers());
  const [form, setForm] = useState<Omit<User, "id">>({
    name: "",
    email: "",
    role: "barista",
  });

  if (!u) return <AppLayout><Card className="p-6">Inicia sesión</Card></AppLayout>;
  if (u.role !== "admin") return <AppLayout><Card className="p-6">Acceso solo para administradores</Card></AppLayout>;

  function refresh() {
    setUsers(listUsers());
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return toast.push("Completa todos los campos");
    addUser(form);
    toast.push("Usuario agregado");
    setForm({ name: "", email: "", role: "barista" });
    refresh();
  }

  function handleDelete(id: string) {
    if (confirm("¿Eliminar este usuario?")) {
      deleteUser(id);
      toast.push("Usuario eliminado");
      refresh();
    }
  }

  function handleRoleChange(id: string, role: User["role"]) {
    updateUser(id, { role });
    toast.push("Rol actualizado");
    refresh();
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Gestión de Usuarios</h1>

      <Card className="p-4 mb-6 max-w-3xl">
        <h2 className="font-semibold mb-2">Agregar nuevo usuario</h2>
        <form onSubmit={handleAdd} className="grid gap-2 md:grid-cols-3">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <label className="block text-sm">
            <span>Rol</span>
            <select
              className="w-full border rounded-lg p-2"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })}
            >
              <option>barista</option>
              <option>cafe</option>
              <option>academy</option>
              <option>admin</option>
            </select>
          </label>
          <div className="md:col-span-3">
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-2">Usuarios registrados</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Rol</th>
                <th className="p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">No hay usuarios registrados</td></tr>
              ) : (
                users.map(us => (
                  <tr key={us.id} className="border-t">
                    <td className="p-2">{us.name}</td>
                    <td className="p-2">{us.email}</td>
                    <td className="p-2">
                      <select
                        className="border rounded-lg p-1"
                        value={us.role}
                        onChange={(e) => handleRoleChange(us.id, e.target.value as User["role"])}
                      >
                        <option>barista</option>
                        <option>cafe</option>
                        <option>academy</option>
                        <option>admin</option>
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <Button variant="ghost" onClick={() => handleDelete(us.id)}>Eliminar</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  );
}
