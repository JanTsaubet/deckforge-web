import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";

export const metadata: Metadata = { title: "Ajustes" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Ajustes"
        description="Cuenta, preferencias de visualización y privacidad."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <PlaceholderPanel
          title="Cuenta"
          phase="Fase 2"
          description="Email, contraseña, proveedores OAuth y borrado de cuenta."
        />
        <PlaceholderPanel
          title="Preferencias"
          phase="Fase 4"
          description="Tema, idioma, moneda (USD/EUR) y vista por defecto del editor."
        />
      </div>
    </div>
  );
}
