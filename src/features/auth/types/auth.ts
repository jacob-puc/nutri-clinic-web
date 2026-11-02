import type { Nutricionista, RolUsuario } from "@/types/api";

export interface LoginDto {
  correoElectronico: string;
  contrasena: string;
}

export interface TokenRespuestaDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiraEnSegundos: number;
  nutricionistaId: string;
  nombreCompleto: string;
  correoElectronico: string;
  rol: RolUsuario;
  debeCambiarContrasena: boolean;
}

/** La sesion es la propia ficha del equipo (GET /api/auth/yo). */
export type UsuarioAutenticado = Nutricionista;

export interface CambiarContrasenaDto {
  contrasenaActual: string;
  contrasenaNueva: string;
}
