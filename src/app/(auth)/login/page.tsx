import type { Metadata, Route } from "next";
import Link from "next/link";
import { FormError } from "@/components/ui/form-field";
import { routes } from "@/config/routes";
import { loadSocialProviders } from "@/features/auth/api/load-social-providers";
import { LoginForm } from "@/features/auth/components/login-form";
import { SocialSignIn } from "@/features/auth/components/social-sign-in";
import { describeOAuthError } from "@/features/auth/lib/social-providers";

export const metadata: Metadata = { title: "Entrar" };

interface LoginPageProps {
  /** `error` llega cuando un acceso con Google o Discord vuelve con un fallo. */
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ next, error }, providers] = await Promise.all([searchParams, loadSocialProviders()]);
  const oauthError = describeOAuthError(error);
  // Si el acceso con un proveedor falla, se vuelve aquí conservando a dónde se iba.
  const errorPath = (
    next ? `${routes.login}?next=${encodeURIComponent(next)}` : routes.login
  ) as Route;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Bienvenido de nuevo</h1>
      {oauthError && <FormError>{oauthError}</FormError>}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
        <SocialSignIn providers={providers} next={next} errorPath={errorPath} />
        <LoginForm next={next} />
      </div>
      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href={routes.register} className="text-accent hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
