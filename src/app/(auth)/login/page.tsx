import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/config/routes";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Entrar" };

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Bienvenido de nuevo</h1>
      <LoginForm next={next} />
      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href={routes.register} className="text-accent hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
