import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Cliente de autenticación del navegador. Habla con /api/auth en el MISMO origen que la web:
 * Next.js reenvía esas peticiones a la API (ver `rewrites` en next.config.ts).
 * Solo debe importarse desde componentes de cliente.
 */
export const authClient = createAuthClient({
  plugins: [usernameClient()],
});
