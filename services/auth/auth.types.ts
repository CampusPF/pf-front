export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

/* TODO(campus): confirmar los nombres de campo con el back. Si el DTO de
   registro espera `fullName` en vez de `name`, se cambia acá y en el form. */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/** Lo que el front usa después de normalizar la respuesta. */
export interface AuthSession {
  user: AuthUser;
  token: string;
}

/* La forma cruda que devuelve el back todavía no está cerrada: distintos
   templates de Nest devuelven access_token, accessToken o token. Aceptamos las
   tres y normalizamos en el service, para que un rename del back no rompa la UI. */
export interface RawAuthResponse {
  user?: AuthUser;
  access_token?: string;
  accessToken?: string;
  token?: string;
}
