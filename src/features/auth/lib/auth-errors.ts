/** Error tal como lo devuelve el cliente de Better Auth. */
export interface AuthClientError {
  code?: string;
  message?: string;
  status?: number;
}

/** Mensajes en español para los códigos de error de Better Auth que ve un usuario. */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "El email o la contraseña no son correctos.",
  INVALID_USERNAME_OR_PASSWORD: "El usuario o la contraseña no son correctos.",
  USER_ALREADY_EXISTS: "Ya existe una cuenta con ese email.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Ya existe una cuenta con ese email.",
  USERNAME_IS_ALREADY_TAKEN: "Ese nombre de usuario ya está en uso.",
  USERNAME_TOO_SHORT: "El nombre de usuario es demasiado corto.",
  USERNAME_TOO_LONG: "El nombre de usuario es demasiado largo.",
  INVALID_USERNAME:
    "El nombre de usuario solo puede tener letras, números, puntos y guiones bajos.",
  PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres.",
  PASSWORD_TOO_LONG: "La contraseña es demasiado larga.",
  INVALID_EMAIL: "Ese email no es válido.",
};

/** Traduce un error de autenticación a un mensaje claro; nunca devuelve una cadena vacía. */
export function describeAuthError(error: AuthClientError): string {
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!;
  if (error.status === 429) return "Demasiados intentos. Espera un momento y vuelve a probar.";
  return "No se ha podido completar la operación. Inténtalo de nuevo.";
}
