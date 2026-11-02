import type { UseFormReturn } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ValoresDatosPersona } from "@/features/nutricionistas/lib/equipo";

/**
 * Datos de contacto y profesionales. Recepcion no lleva especialidad ni
 * cedula, asi que esos campos se ocultan con `profesional={false}`.
 */
export function CamposPersona({
  form,
  profesional = true,
}: {
  form: UseFormReturn<ValoresDatosPersona>;
  profesional?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="nombreCompleto"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Nombre completo</FormLabel>
            <FormControl>
              <Input placeholder="Ana Ruiz Martínez" maxLength={100} autoComplete="off" className="bg-card h-10" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="correoElectronico"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Correo (para iniciar sesión)</FormLabel>
            <FormControl>
              <Input type="email" placeholder="ana@clinica.mx" maxLength={200} autoComplete="off" className="bg-card h-10" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="telefono"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
            </FormLabel>
            <FormControl>
              <Input type="tel" inputMode="tel" placeholder="8112345678" maxLength={20} className="bg-card h-10" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {profesional && (
        <>
          <FormField
            control={form.control}
            name="especialidad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Especialidad <span className="text-muted-foreground font-normal">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Nutrición clínica" maxLength={100} className="bg-card h-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numeroColegiatura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Cédula profesional <span className="text-muted-foreground font-normal">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="12345678" maxLength={50} className="bg-card h-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}
