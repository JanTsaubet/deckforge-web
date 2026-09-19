import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/config/routes";
import { loadSocialProviders } from "@/features/auth/api/load-social-providers";
import { RegisterForm } from "@/features/auth/components/register-form";
import { SocialSignIn } from "@/features/auth/components/social-sign-in";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage() {
  const providers = await loadSocialProviders();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Crea tu cuenta</h1>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
        {/* Con un proveedor no hay registro aparte: la cuenta se crea al entrar la primera vez.
            Los errores se enseñan en la página de acceso, que es la que sabe explicarlos. */}
        <SocialSignIn providers={providers} errorPath={routes.login} />
        <RegisterForm />
      </div>
      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href={routes.login} className="text-accent hover:underline">
          Entra
        </Link>
      </p>
    </div>
  );
}
