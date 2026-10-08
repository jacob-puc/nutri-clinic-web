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
}

export interface UsuarioAutenticado {
  id: string;
  nombreCompleto: string;
  correoElectronico: string;
  telefono: string | null;
  numeroColegiatura: string | null;
  especialidad: string | null;
  isActive: boolean;
  fechaRegistro: string;
}
