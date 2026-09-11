import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";

interface DeckEditorLayoutProps {
  deckId: string;
}

/**
 * Estructura en tres columnas del editor:
 *  1. Buscador para añadir cartas (izquierda).
 *  2. Lista del mazo por zonas y agrupada por tipo o etiqueta (centro).
 *  3. Análisis y recomendaciones (derecha).
 * En pantallas pequeñas las columnas se apilan (en la Fase 3 pasarán a pestañas).
 */
export function DeckEditorLayout({ deckId }: DeckEditorLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Editor de mazo"
        description={`Editando ${deckId}. Los cambios se guardarán automáticamente.`}
        actions={
          <>
            <Button variant="ghost">Probar mano</Button>
            <Button variant="secondary">Exportar</Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr_300px]">
        <PlaceholderPanel
          title="Añadir cartas"
          phase="Fase 3"
          description="Autocompletado instantáneo, sintaxis de Scryfall y atajos de teclado."
          className="lg:min-h-[60vh]"
        />
        <PlaceholderPanel
          title="Lista del mazo"
          phase="Fase 3"
          description="Comandante, principal, banquillo y quizás. Arrastrar y soltar entre zonas."
          className="min-h-[60vh]"
        />
        <div className="flex flex-col gap-4">
          <PlaceholderPanel
            title="Estadísticas"
            phase="Fase 3"
            description="Curva de maná, fuentes de color y validación de legalidad."
            className="flex-1"
          />
          <PlaceholderPanel
            title="Recomendaciones"
            phase="Fase 6"
            description="Sinergias, combos (Commander Spellbook) y alternativas por presupuesto."
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
