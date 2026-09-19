/**
 * Estilos comunes de los diálogos construidos sobre <dialog>.
 *
 * La animación de apertura y cierre es CSS puro: `starting:` (@starting-style) da el
 * estado inicial al abrir, y `transition-discrete` permite animar el cambio de `display`
 * al cerrar. No hace falta JavaScript para que el diálogo entre y salga con suavidad.
 */
export const MODAL_CLASSES =
  "m-auto w-[calc(100%-2rem)] max-w-md scale-95 rounded-2xl border border-border bg-surface-raised p-6 text-foreground opacity-0 shadow-2xl transition-[opacity,scale,display,overlay] transition-discrete duration-200 ease-smooth backdrop:bg-black/60 backdrop:backdrop-blur-sm open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0";
