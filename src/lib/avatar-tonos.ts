/* Tonos de avatar tomados del sistema semántico en vez de la paleta cruda de
   Tailwind: así el avatar se recolorea con el tema y los seis pares ya están
   verificados a 4.5:1 en claro y en oscuro.

   Vive en `lib/` para que tanto `AvatarPaciente` (features) como el avatar del
   menú de usuario (components) compartan una única copia: si se añade un tono
   o se cambia un par, cambia en los dos sitios. */
export const TONES_AVATAR = [
  "bg-primary-soft text-primary-soft-foreground",
  "bg-accent-soft text-accent-soft-foreground",
  "bg-success-soft text-success-soft-foreground",
  "bg-info-soft text-info-soft-foreground",
  "bg-warning-soft text-warning-soft-foreground",
  "bg-secondary text-secondary-foreground",
] as const;
