import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/config/routes";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Crea tu cuenta</h1>
      <RegisterForm />
      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href={routes.login} className="text-accent hover:underline">
          Entra
        </Link>
      </p>
    </div>
  );
}
