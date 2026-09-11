# Justificación del stack tecnológico

Cada decisión responde a las necesidades concretas de un constructor de mazos: **SEO** para mazos y cartas públicos,
**listas grandes** de cartas con imágenes, un **editor muy interactivo** con cambios constantes y **animaciones fluidas**.

---

## Frontend (este repositorio)

### Next.js 16 (App Router) + React 19

**Por qué:**

- **SEO y enlaces compartibles.** Los mazos y las cartas públicos deben indexarse y mostrar una buena vista previa al
  compartirse en Discord o Reddit. El renderizado en servidor y `generateMetadata` / `opengraph-image` lo resuelven de serie.
- **Server Components.** Las páginas de mazos y de detalle de carta muestran mucho contenido estático; renderizarlo en el
  servidor reduce el JavaScript que descarga el navegador. Solo lo interactivo (editor, pestañas, animaciones) va al cliente.
- **Streaming con Suspense.** `loading.tsx` muestra _skeletons_ al instante mientras llegan los datos.
- **BFF integrado.** Los Route Handlers hacen de proxy cacheado hacia Scryfall. Así cumplimos su límite de peticiones y la
  cabecera `User-Agent` obligatoria sin exponer esa lógica al navegador.
- **React 19:** `useOptimistic` y Actions para la edición optimista de mazos; `<ViewTransition>` para transiciones entre rutas.
- **Turbopack** por defecto: arranque y recarga en caliente muy rápidos.
- **Rutas tipadas** (`typedRoutes`): un enlace a una ruta que no existe es un error de compilación.

**Alternativas descartadas:**

| Alternativa            | Motivo                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| React Router 7 / Remix | Muy válida, pero con menos ecosistema en RSC, generación de imágenes OG y despliegue integrado.       |
| SvelteKit              | Excelente rendimiento, pero con un ecosistema menor de librerías (dnd, virtualización, UI accesible). |
| Astro                  | Pensado para webs de contenido; el editor sería casi entero una isla de cliente.                      |
| SPA con Vite           | Sin SSR, así que el SEO y las vistas previas de los mazos compartidos salen perjudicados.             |

### TypeScript 5.9 (estricto)

- Modelar el dominio (cartas, zonas, formatos, legalidades) con tipos evita toda una clase de errores.
- `strict` + `noUncheckedIndexedAccess`: acceder a un array o a un diccionario obliga a contemplar `undefined`.
- **¿Por qué no TypeScript 7?** La versión nativa (reescrita en Go) es muy reciente. Next.js y typescript-eslint dependen
  de la API de JavaScript del compilador, así que migraremos cuando el ecosistema confirme compatibilidad.

### Tailwind CSS v4

- **Design tokens en CSS** (`@theme`): colores de maná, superficies y curvas de animación definidos una sola vez.
- **Cero coste en tiempo de ejecución**, compatible con Server Components (a diferencia de CSS-in-JS como styled-components).
- Estilos junto al marcado: iterar sobre la UI es rápido y no quedan hojas de estilo huérfanas.
- `prettier-plugin-tailwindcss` ordena las clases de forma consistente.

### Motion (antes Framer Motion)

- **Animaciones de layout** (`layoutId`): indicadores que se deslizan entre pestañas y cartas que se reordenan suavemente
  al moverlas entre zonas del mazo. Hacerlo a mano con CSS sería frágil.
- **Gestos y springs:** arrastrar cartas, giros de cartas de doble cara y micro-interacciones con física natural.
- Respeta `prefers-reduced-motion` de forma global con `MotionConfig reducedMotion="user"`.
- Alternativas: **CSS puro** (se usa para lo simple: _hover_, _shimmer_) y **GSAP** (potente, pero imperativo y menos
  integrado con el ciclo de vida de React).

### TanStack Query 5 (estado de servidor)

- Caché, deduplicación y reintentos de las peticiones de cartas y mazos.
- `useInfiniteQuery` para el scroll infinito de resultados.
- Mutaciones optimistas con _rollback_ para el guardado automático del editor.
- Frente a SWR: API de mutaciones e invalidación más completa y mejores DevTools.

### Zustand 5 (estado de cliente)

- El editor tiene estado complejo con cambios muy frecuentes (cantidades, zonas, selección, deshacer/rehacer).
- Los **selectores** hacen que solo se vuelvan a renderizar los componentes afectados; con React Context se renderizaría
  todo el árbol del editor.
- Frente a Redux Toolkit: la misma previsibilidad con mucho menos código repetitivo.
- Separación clara: **TanStack Query = datos del servidor**; **Zustand = estado local de la UI**.

### Zod 4

- Validación en las **fronteras**: variables de entorno (`src/config/env.ts`), formularios y respuestas de APIs externas.
- Los esquemas generan los tipos TypeScript (`z.infer`), así que hay una única fuente de verdad.

### Utilidades y calidad

| Herramienta                     | Uso                                                       |
| ------------------------------- | --------------------------------------------------------- |
| `lucide-react`                  | Iconos SVG consistentes, con _tree-shaking_               |
| `clsx` + `tailwind-merge`       | Función `cn()` para combinar clases sin conflictos        |
| ESLint 9 + `eslint-config-next` | Reglas de React, Hooks, accesibilidad y Core Web Vitals   |
| Prettier                        | Formato automático y uniforme                             |
| Vitest + Testing Library        | Tests unitarios y de componentes                          |
| MSW                             | Simula Scryfall en los tests: ni red ni fallos aleatorios |
| Playwright                      | Pruebas de humo de los recorridos principales             |
| husky + lint-staged             | Formato y lint automáticos antes de cada commit           |
| commitlint                      | Mensajes de commit con Conventional Commits               |
| GitHub Actions                  | CI: formato, lint, tipos, tests y build en cada cambio    |

> ESLint se mantiene en la versión 9 porque varios plugins incluidos en `eslint-config-next`
> (`eslint-plugin-react`, `eslint-plugin-import`) aún no declaran soporte para ESLint 10.

### Se añadirán en su fase

| Librería                 | Fase | Para qué                                              |
| ------------------------ | ---- | ----------------------------------------------------- |
| Radix UI (vía shadcn/ui) | 1    | Primitivas accesibles: Dialog, Popover, Tabs, Tooltip |
| TanStack Virtual         | 1    | Virtualizar rejillas y listas con cientos de cartas   |
| React Hook Form          | 2    | Formularios de acceso, registro y ajustes (con Zod)   |
| Cliente de Better Auth   | 2    | Sesión en el frontend                                 |
| `cmdk`                   | 3    | Paleta de comandos del editor                         |
| dnd-kit                  | 3    | _Drag & drop_ accesible entre zonas del mazo          |
| Recharts                 | 3    | Gráficas de curva de maná y distribución de colores   |
| next-intl                | 4    | Internacionalización (es/en)                          |

---

## Backend propuesto (`deckforge-api`, Fase 2)

| Tecnología         | Motivo                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NestJS**         | Módulos e inyección de dependencias nativos: encaja con SOLID y con un dominio que crecerá (mazos, colección, recomendaciones). Genera OpenAPI automáticamente. |
| **PostgreSQL**     | Datos relacionales (usuarios, mazos, entradas, versiones) y JSONB para los datos de carta de Scryfall.                                                          |
| **Drizzle ORM**    | SQL tipado, ligero y con migraciones explícitas; permite consultas complejas para estadísticas y co-ocurrencias.                                                |
| **Better Auth**    | Autenticación en TypeScript, autoalojada, con email/contraseña y OAuth sin depender de un SaaS.                                                                 |
| **Redis + BullMQ** | Caché y colas de trabajos: sincronización diaria de _bulk data_ y cálculo de recomendaciones.                                                                   |
| **Meilisearch**    | Búsqueda de mazos tolerante a erratas y con facetas (formato, colores, comandante).                                                                             |

## Despliegue propuesto

| Pieza          | Opción inicial                      |
| -------------- | ----------------------------------- |
| deckforge-web  | Vercel                              |
| deckforge-api  | Railway, Fly.io o Render            |
| PostgreSQL     | Neon o Supabase                     |
| Observabilidad | Sentry (errores) + Vercel Analytics |
