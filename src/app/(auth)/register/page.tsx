import type { Metadata } from "next";
import Link from "next/link";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Crea tu cuenta</h1>
      <PlaceholderPanel
        title="Formulario de registro"
        phase="Fase 2"
        description="Nombre de usuario, email y contraseña, con validación en vivo."
        className="min-h-56"
      />
      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href={routes.login} className="text-accent hover:underline">
          Entra
        </Link>
      </p>
    </div>
  );
}
