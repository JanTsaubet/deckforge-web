/**
 * Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`…
 * Permite generar el CHANGELOG y las versiones automáticamente más adelante.
 */
const config = {
  extends: ["@commitlint/config-conventional"],
};

export default config;
