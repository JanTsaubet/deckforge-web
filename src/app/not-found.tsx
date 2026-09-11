import { Compass } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-lg place-items-center px-4">
      <EmptyState
        icon={Compass}
        title="Esta página ha sido exiliada"
        description="La ruta que buscas no existe o ha cambiado de sitio."
        action={
          <Link href={routes.home} className={buttonStyles()}>
            Volver al inicio
          </Link>
        }
      />
    </main>
  );
}
