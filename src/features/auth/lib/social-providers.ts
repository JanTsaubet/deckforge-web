import type { components } from "@/lib/api/openapi";

export type SocialProvider = components["schemas"]["AuthProvidersDto"]["social"][number];

export const SOCIAL_PROVIDER_LABELS: Record<SocialProvider, string> = {
  google: "Google",
  discord: "Discord",
};

/**
 * Códigos de error con los que Better Auth vuelve de un acceso con OAuth (`?error=`), en
 * palabras que se entienden. El proveedor también puede mandar los suyos (`access_denied`
 * cuando se cancela en su pantalla).
 */
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  account_not_linked:
    "Ya tienes una cuenta con ese email. Entra con tu contraseña: por seguridad, no se une a otra forma de acceso sin verificar antes que el email es tuyo.",
  access_denied: "Has cancelado el acceso. Puedes volver a intentarlo cuando quieras.",
  email_not_found:
    "El proveedor no nos ha dado tu email, y hace falta para crear la cuenta. Revisa sus permisos.",
  email_not_verified:
    "Tu email en ese proveedor no está verificado. Verifícalo allí y vuelve a probar.",
  state_mismatch:
    "El acceso ha caducado o se empezó en otra pestaña. Vuelve a pulsar el botón del proveedor.",
  account_already_linked_to_different_user: "Esa cuenta ya está unida a otro usuario de DeckForge.",
};

/** Mensaje para el `?error=` de la vuelta de OAuth, o `undefined` si no hay error. */
export function describeOAuthError(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return (
    OAUTH_ERROR_MESSAGES[code] ??
    "No se ha podido entrar con ese proveedor. Inténtalo de nuevo o entra con tu email."
  );
}
