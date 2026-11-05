import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SkeletonTablaProps {
  /**
   * Ancho de cada columna, p. ej. `["w-48", "flex-1", "w-24"]`. Si se omite,
   * se reparte `columnas` de igual ancho.
   */
  anchos?: string[];
  /** Número de columnas, solo si no se pasa `anchos`. */
  columnas?: number;
  filas?: number;
  /**
   * Dibuja la primera columna como avatar + dos líneas de texto, que es como
   * se compone la fila de un listado de personas. Evita el salto de layout
   * al llegar los datos.
   */
  conAvatar?: boolean;
  className?: string;
}

/**
 * Esqueleto de tabla. Replica la estructura real (Table/TableHeader/TableBody)
 * para que la transición a los datos no cambie el layout.
 */
export function SkeletonTabla({
  anchos,
  columnas = 4,
  filas = 6,
  conAvatar = false,
  className,
}: SkeletonTablaProps) {
  const medidas = anchos ?? Array.from({ length: columnas }, () => "flex-1");

  return (
    <div
      className={cn(
        "hoja overflow-hidden rounded-[1.25rem]",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Cargando...</span>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {medidas.map((medida, indice) => (
              <TableHead key={indice} className={cn("px-4 md:px-6", medida)}>
                <Skeleton className="h-3 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: filas }, (_, fila) => (
            <TableRow key={fila} className="hover:bg-transparent">
              {medidas.map((medida, columna) => (
                <td
                  key={columna}
                  className={cn("px-4 py-3 align-middle md:px-6", medida)}
                >
                  {conAvatar && columna === 0 ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-2/5" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ) : (
                    <Skeleton
                      className={cn("h-3.5", columna === 0 ? "w-40" : "w-24")}
                    />
                  )}
                </td>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
