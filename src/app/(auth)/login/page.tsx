import type { Metadata } from "next";
import Link from "next/link";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Bienvenido de nuevo</h1>
      <PlaceholderPanel
        title="Formulario de acceso"
        phase="Fase 2"
        description="Email y contraseña, más OAuth (Google, Discord)."
        className="min-h-48"
      />
      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href={routes.register} className="text-accent hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
