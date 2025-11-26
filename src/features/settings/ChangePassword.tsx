// src/features/settings/ChangePassword.tsx
import { useState, type FormEvent } from "react";
import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useToast } from "../../components/Toast";
import { changePassword, getUserMock } from "../../api/auth";

export default function ChangePassword() {
  const toast = useToast(); // ⬅️ devuelve un Ctx con .push()
  const user = getUserMock();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.push("Por favor completa todos los campos.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.push("La nueva clave y su confirmación no coinciden.");
      return;
    }

    if (newPassword.length < 8) {
      toast.push("La nueva clave debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setLoading(true);

      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.push("Clave actualizada correctamente ✅");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "No se pudo actualizar la clave. Intenta nuevamente.";
      toast.push(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Cambiar contraseña</h1>

        {user && (
          <p className="text-sm text-gray-600">
            Usuario: <span className="font-medium">{user.email ?? user.name}</span>
          </p>
        )}

        <Card className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirmar nueva contraseña"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Actualizar contraseña"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
