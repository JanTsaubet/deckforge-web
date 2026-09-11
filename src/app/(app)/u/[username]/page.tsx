import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";

export const metadata: Metadata = { title: "Perfil" };

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

/** Perfil público de un usuario. */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`@${username}`} description="Perfil público del usuario." />
      <div className="grid gap-4 md:grid-cols-3">
        <PlaceholderPanel
          title="Sobre el usuario"
          phase="Fase 5"
          description="Avatar, bio y estadísticas."
        />
        <PlaceholderPanel
          title="Mazos públicos"
          phase="Fase 5"
          className="min-h-64 md:col-span-2"
        />
      </div>
    </div>
  );
}
