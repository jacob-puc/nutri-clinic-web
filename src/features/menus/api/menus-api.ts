import { apiClient } from "@/lib/api-client";
import { traerTodasLasHojas } from "@/lib/paginacion";
import { abrirPdf } from "@/lib/pdf";
import type {
  Alimento,
  AlimentoFiltro,
  CrearAlimentoDto,
  ActualizarAlimentoDto,
  Plato,
  CrearPlatoDto,
  ActualizarPlatoDto,
  PlatoFiltro,
  DuplicarPlatoDto,
  PlantillaMenu,
  CrearPlantillaMenuDto,
  ActualizarPlantillaMenuDto,
  PlantillaMenuFiltro,
  DuplicarPlantillaMenuDto,
  MenuAsignado,
  CrearMenuAsignadoDto,
  ActualizarMenuAsignadoDto,
  MenuAsignadoFiltro,
  DuplicarMenuAsignadoDto,
  Guid,
} from "@/types/api";

/**
 * Cliente del módulo de Menús/Planes.
 * Agrupa Alimentos, Platos, Plantillas de Menú y Menús Asignados.
 * Hoy estos listados devuelven una lista plana; se piden con
 * `traerTodasLasHojas` para que sigan funcionando si el backend los pagina
 * como ya hizo con citas y consultas.
 */
export const menusApi = {
  /* -------------------- ALIMENTOS -------------------- */

  /** `GET /api/alimentos` — lista paginada con filtros. */
  listarAlimentos: async (filtro: AlimentoFiltro = {}): Promise<Alimento[]> =>
    traerTodasLasHojas<Alimento>("/api/alimentos", { ...filtro }),

  /** `GET /api/alimentos/{id}` — detalle de un alimento. */
  obtenerAlimento: async (alimentoId: Guid): Promise<Alimento> => {
    const { data } = await apiClient.get<Alimento>(`/api/alimentos/${alimentoId}`);
    return data;
  },

  /** `POST /api/alimentos` — crea un alimento base. */
  crearAlimento: async (dto: CrearAlimentoDto): Promise<Alimento> => {
    const { data } = await apiClient.post<Alimento>("/api/alimentos", dto);
    return data;
  },

  /** `PUT /api/alimentos/{id}` — actualiza un alimento. */
  actualizarAlimento: async (alimentoId: Guid, dto: ActualizarAlimentoDto): Promise<void> => {
    await apiClient.put(`/api/alimentos/${alimentoId}`, dto);
  },

  /** `PATCH /api/alimentos/{id}/restaurar` — reactiva un alimento borrado lógicamente. */
  restaurarAlimento: async (alimentoId: Guid): Promise<void> => {
    await apiClient.patch(`/api/alimentos/${alimentoId}/restaurar`);
  },

  /** `DELETE /api/alimentos/{id}` — borrado lógico (IsActive = false). */
  /** `POST /api/alimentos/{id}/imagen` (multipart): JPEG, PNG o WEBP de hasta 5 MB. */
  subirImagenAlimento: async (alimentoId: Guid, imagen: File): Promise<Alimento> => {
    const formulario = new FormData();
    formulario.append("imagen", imagen, imagen.name);
    const { data } = await apiClient.post<Alimento>(`/api/alimentos/${alimentoId}/imagen`, formulario, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  eliminarAlimento: async (alimentoId: Guid): Promise<void> => {
    await apiClient.delete(`/api/alimentos/${alimentoId}`);
  },

  /* -------------------- PLATOS -------------------- */

  /** `GET /api/platos` — lista paginada con filtros y orden. */
  listarPlatos: async (filtro: PlatoFiltro = {}): Promise<Plato[]> =>
    traerTodasLasHojas<Plato>("/api/platos", { ...filtro }),

  /** `GET /api/platos/{id}` — detalle de un plato con macros calculadas. */
  obtenerPlato: async (platoId: Guid): Promise<Plato> => {
    const { data } = await apiClient.get<Plato>(`/api/platos/${platoId}`);
    return data;
  },

  /** `POST /api/platos` — crea un plato (simple o compuesto). */
  crearPlato: async (dto: CrearPlatoDto): Promise<Plato> => {
    const { data } = await apiClient.post<Plato>("/api/platos", dto);
    return data;
  },

  /** `PUT /api/platos/{id}` — actualiza plato y sus detalles (reemplaza). */
  actualizarPlato: async (platoId: Guid, dto: ActualizarPlatoDto): Promise<Plato> => {
    const { data } = await apiClient.put<Plato>(`/api/platos/${platoId}`, dto);
    return data;
  },

  /** `POST /api/platos/{id}/duplicar` — clona un plato con nuevo nombre opcional. */
  duplicarPlato: async (platoId: Guid, dto: DuplicarPlatoDto = {}): Promise<Plato> => {
    const { data } = await apiClient.post<Plato>(`/api/platos/${platoId}/duplicar`, dto);
    return data;
  },

  /** `PATCH /api/platos/{id}/restaurar` — reactiva un plato borrado lógicamente. */
  restaurarPlato: async (platoId: Guid): Promise<void> => {
    await apiClient.patch(`/api/platos/${platoId}/restaurar`);
  },

  /** `DELETE /api/platos/{id}` — borrado lógico (valida que no esté en plantillas/planes). */
  eliminarPlato: async (platoId: Guid): Promise<void> => {
    await apiClient.delete(`/api/platos/${platoId}`);
  },

  /* -------------------- PLANTILLAS DE MENÚ -------------------- */

  /** `GET /api/plantillas-menu` — lista paginada de plantillas semanales. */
  listarPlantillas: async (filtro: PlantillaMenuFiltro = {}): Promise<PlantillaMenu[]> =>
    traerTodasLasHojas<PlantillaMenu>("/api/plantillas-menu", { ...filtro }),

  /** `GET /api/plantillas-menu/{id}` — detalle con resumen nutricional por día/comida. */
  obtenerPlantilla: async (plantillaId: Guid): Promise<PlantillaMenu> => {
    const { data } = await apiClient.get<PlantillaMenu>(`/api/plantillas-menu/${plantillaId}`);
    return data;
  },

  /** `POST /api/plantillas-menu` — crea una plantilla semanal. */
  crearPlantilla: async (dto: CrearPlantillaMenuDto): Promise<PlantillaMenu> => {
    const { data } = await apiClient.post<PlantillaMenu>("/api/plantillas-menu", dto);
    return data;
  },

  /** `PUT /api/plantillas-menu/{id}` — actualiza plantilla y sus detalles. */
  actualizarPlantilla: async (
    plantillaId: Guid,
    dto: ActualizarPlantillaMenuDto,
  ): Promise<PlantillaMenu> => {
    const { data } = await apiClient.put<PlantillaMenu>(
      `/api/plantillas-menu/${plantillaId}`,
      dto,
    );
    return data;
  },

  /** `POST /api/plantillas-menu/{id}/duplicar` — clona una plantilla. */
  duplicarPlantilla: async (
    plantillaId: Guid,
    dto: DuplicarPlantillaMenuDto = {},
  ): Promise<PlantillaMenu> => {
    const { data } = await apiClient.post<PlantillaMenu>(
      `/api/plantillas-menu/${plantillaId}/duplicar`,
      dto,
    );
    return data;
  },

  /** `PATCH /api/plantillas-menu/{id}/restaurar` — reactiva plantilla. */
  restaurarPlantilla: async (plantillaId: Guid): Promise<void> => {
    await apiClient.patch(`/api/plantillas-menu/${plantillaId}/restaurar`);
  },

  /** `DELETE /api/plantillas-menu/{id}` — borrado lógico (con `forzar` para saltar validaciones). */
  eliminarPlantilla: async (plantillaId: Guid, forzar = false): Promise<void> => {
    await apiClient.delete(`/api/plantillas-menu/${plantillaId}`, { params: { forzar } });
  },

  /* -------------------- MENÚS ASIGNADOS (PLANES DE PACIENTE) -------------------- */

  /** `GET /api/menu-asignados` — lista paginada de planes de pacientes. */
  listarMenusAsignados: async (filtro: MenuAsignadoFiltro = {}): Promise<MenuAsignado[]> =>
    traerTodasLasHojas<MenuAsignado>("/api/menu-asignados", { ...filtro }),

  /** `GET /api/menu-asignados/{id}` — detalle del plan con resumen nutricional. */
  obtenerMenuAsignado: async (menuId: Guid): Promise<MenuAsignado> => {
    const { data } = await apiClient.get<MenuAsignado>(`/api/menu-asignados/${menuId}`);
    return data;
  },

  /** `POST /api/menu-asignados/asignar` — asigna plantilla a paciente (crea plan). */
  asignarPlantilla: async (dto: CrearMenuAsignadoDto): Promise<MenuAsignado> => {
    const { data } = await apiClient.post<MenuAsignado>("/api/menu-asignados/asignar", dto);
    return data;
  },

  /** `PUT /api/menu-asignados/{id}` — actualiza plan y sus detalles. */
  actualizarMenuAsignado: async (
    menuId: Guid,
    dto: ActualizarMenuAsignadoDto,
  ): Promise<MenuAsignado> => {
    const { data } = await apiClient.put<MenuAsignado>(`/api/menu-asignados/${menuId}`, dto);
    return data;
  },

  /** `POST /api/menu-asignados/{id}/duplicar` — duplica plan (mismo u otro paciente). */
  duplicarMenuAsignado: async (
    menuId: Guid,
    dto: DuplicarMenuAsignadoDto = {},
  ): Promise<MenuAsignado> => {
    const { data } = await apiClient.post<MenuAsignado>(
      `/api/menu-asignados/${menuId}/duplicar`,
      dto,
    );
    return data;
  },

  /** PDF del menu semanal del paciente, para imprimir o mandarle. */
  abrirMenuPdf: (menuId: Guid) => abrirPdf(`/api/menu-asignados/${menuId}/pdf`),

  /** `PATCH /api/menu-asignados/{id}/restaurar` — reactiva plan. */
  restaurarMenuAsignado: async (menuId: Guid): Promise<void> => {
    await apiClient.patch(`/api/menu-asignados/${menuId}/restaurar`);
  },

  /** `DELETE /api/menu-asignados/{id}` — borrado lógico del plan. */
  eliminarMenuAsignado: async (menuId: Guid): Promise<void> => {
    await apiClient.delete(`/api/menu-asignados/${menuId}`);
  },
};