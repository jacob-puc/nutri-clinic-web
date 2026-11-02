import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { menusApi } from "@/features/menus/api/menus-api";
import type {
  AlimentoFiltro,
  CrearAlimentoDto,
  ActualizarAlimentoDto,
  PlatoFiltro,
  CrearPlatoDto,
  ActualizarPlatoDto,
  DuplicarPlatoDto,
  PlantillaMenuFiltro,
  CrearPlantillaMenuDto,
  ActualizarPlantillaMenuDto,
  DuplicarPlantillaMenuDto,
  MenuAsignadoFiltro,
  CrearMenuAsignadoDto,
  ActualizarMenuAsignadoDto,
  DuplicarMenuAsignadoDto,
  Guid,
} from "@/types/api";

/* Query keys centralizadas para invalidaciones coherentes. */
export const menusKeys = {
  all: ["menus"] as const,
  /* Alimentos */
  alimentos: {
    all: ["menus", "alimentos"] as const,
    lista: (filtro: AlimentoFiltro) => [...menusKeys.alimentos.all, "lista", filtro] as const,
    detalle: (id: Guid) => [...menusKeys.alimentos.all, "detalle", id] as const,
  },
  /* Platos */
  platos: {
    all: ["menus", "platos"] as const,
    lista: (filtro: PlatoFiltro) => [...menusKeys.platos.all, "lista", filtro] as const,
    detalle: (id: Guid) => [...menusKeys.platos.all, "detalle", id] as const,
  },
  /* Plantillas de menú */
  plantillas: {
    all: ["menus", "plantillas"] as const,
    lista: (filtro: PlantillaMenuFiltro) => [...menusKeys.plantillas.all, "lista", filtro] as const,
    detalle: (id: Guid) => [...menusKeys.plantillas.all, "detalle", id] as const,
  },
  /* Menús asignados (planes de paciente) */
  menusAsignados: {
    all: ["menus", "menus-asignados"] as const,
    lista: (filtro: MenuAsignadoFiltro) => [...menusKeys.menusAsignados.all, "lista", filtro] as const,
    detalle: (id: Guid) => [...menusKeys.menusAsignados.all, "detalle", id] as const,
    porPaciente: (pacienteId: Guid) =>
      [...menusKeys.menusAsignados.all, "paciente", pacienteId] as const,
  },
};

/* ---------- ALIMENTOS ---------- */

export function useAlimentos(filtro: AlimentoFiltro = {}) {
  return useQuery({
    queryKey: menusKeys.alimentos.lista(filtro),
    queryFn: () => menusApi.listarAlimentos(filtro),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useAlimento(alimentoId: Guid | undefined) {
  return useQuery({
    queryKey: menusKeys.alimentos.detalle(alimentoId ?? ""),
    queryFn: () => menusApi.obtenerAlimento(alimentoId as Guid),
    enabled: Boolean(alimentoId),
    staleTime: 60_000,
  });
}

export function useCrearAlimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CrearAlimentoDto) => menusApi.crearAlimento(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.alimentos.all });
    },
  });
}

export function useActualizarAlimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alimentoId, dto }: { alimentoId: Guid; dto: ActualizarAlimentoDto }) =>
      menusApi.actualizarAlimento(alimentoId, dto),
    onSuccess: (_, { alimentoId }) => {
      qc.invalidateQueries({ queryKey: menusKeys.alimentos.all });
      qc.invalidateQueries({ queryKey: menusKeys.alimentos.detalle(alimentoId) });
    },
  });
}

export function useSubirImagenAlimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alimentoId, imagen }: { alimentoId: Guid; imagen: File }) =>
      menusApi.subirImagenAlimento(alimentoId, imagen),
    onSuccess: (_, { alimentoId }) => {
      qc.invalidateQueries({ queryKey: menusKeys.alimentos.all });
      qc.invalidateQueries({ queryKey: menusKeys.alimentos.detalle(alimentoId) });
    },
  });
}

export function useEliminarAlimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alimentoId: Guid) => menusApi.eliminarAlimento(alimentoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.alimentos.all });
    },
  });
}

export function useRestaurarAlimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alimentoId: Guid) => menusApi.restaurarAlimento(alimentoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.alimentos.all });
    },
  });
}

/* ---------- PLATOS ---------- */

export function usePlatos(filtro: PlatoFiltro = {}) {
  return useQuery({
    queryKey: menusKeys.platos.lista(filtro),
    queryFn: () => menusApi.listarPlatos(filtro),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function usePlato(platoId: Guid | undefined) {
  return useQuery({
    queryKey: menusKeys.platos.detalle(platoId ?? ""),
    queryFn: () => menusApi.obtenerPlato(platoId as Guid),
    enabled: Boolean(platoId),
    staleTime: 60_000,
  });
}

export function useCrearPlato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CrearPlatoDto) => menusApi.crearPlato(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.platos.all });
    },
  });
}

export function useActualizarPlato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ platoId, dto }: { platoId: Guid; dto: ActualizarPlatoDto }) =>
      menusApi.actualizarPlato(platoId, dto),
    onSuccess: (_, { platoId }) => {
      qc.invalidateQueries({ queryKey: menusKeys.platos.all });
      qc.invalidateQueries({ queryKey: menusKeys.platos.detalle(platoId) });
    },
  });
}

export function useDuplicarPlato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ platoId, dto }: { platoId: Guid; dto?: DuplicarPlatoDto }) =>
      menusApi.duplicarPlato(platoId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.platos.all });
    },
  });
}

export function useEliminarPlato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platoId: Guid) => menusApi.eliminarPlato(platoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.platos.all });
    },
  });
}

export function useRestaurarPlato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platoId: Guid) => menusApi.restaurarPlato(platoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.platos.all });
    },
  });
}

/* ---------- PLANTILLAS DE MENÚ ---------- */

export function usePlantillasMenu(filtro: PlantillaMenuFiltro = {}) {
  return useQuery({
    queryKey: menusKeys.plantillas.lista(filtro),
    queryFn: () => menusApi.listarPlantillas(filtro),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function usePlantillaMenu(plantillaId: Guid | undefined) {
  return useQuery({
    queryKey: menusKeys.plantillas.detalle(plantillaId ?? ""),
    queryFn: () => menusApi.obtenerPlantilla(plantillaId as Guid),
    enabled: Boolean(plantillaId),
    staleTime: 60_000,
  });
}

export function useCrearPlantillaMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CrearPlantillaMenuDto) => menusApi.crearPlantilla(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.plantillas.all });
    },
  });
}

export function useActualizarPlantillaMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plantillaId, dto }: { plantillaId: Guid; dto: ActualizarPlantillaMenuDto }) =>
      menusApi.actualizarPlantilla(plantillaId, dto),
    onSuccess: (_, { plantillaId }) => {
      qc.invalidateQueries({ queryKey: menusKeys.plantillas.all });
      qc.invalidateQueries({ queryKey: menusKeys.plantillas.detalle(plantillaId) });
    },
  });
}

export function useDuplicarPlantillaMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plantillaId, dto }: { plantillaId: Guid; dto?: DuplicarPlantillaMenuDto }) =>
      menusApi.duplicarPlantilla(plantillaId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.plantillas.all });
    },
  });
}

export function useEliminarPlantillaMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plantillaId, forzar }: { plantillaId: Guid; forzar?: boolean }) =>
      menusApi.eliminarPlantilla(plantillaId, forzar),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.plantillas.all });
    },
  });
}

export function useRestaurarPlantillaMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plantillaId: Guid) => menusApi.restaurarPlantilla(plantillaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.plantillas.all });
    },
  });
}

/* ---------- MENÚS ASIGNADOS (PLANES DE PACIENTE) ---------- */

export function useMenusAsignados(filtro: MenuAsignadoFiltro = {}) {
  return useQuery({
    queryKey: menusKeys.menusAsignados.lista(filtro),
    queryFn: () => menusApi.listarMenusAsignados(filtro),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useMenusAsignadosPorPaciente(pacienteId: Guid | undefined) {
  return useQuery({
    queryKey: menusKeys.menusAsignados.porPaciente(pacienteId ?? ""),
    queryFn: () => menusApi.listarMenusAsignados({ pacienteId: pacienteId as Guid }),
    enabled: Boolean(pacienteId),
    staleTime: 30_000,
  });
}

export function useMenuAsignado(menuId: Guid | undefined) {
  return useQuery({
    queryKey: menusKeys.menusAsignados.detalle(menuId ?? ""),
    queryFn: () => menusApi.obtenerMenuAsignado(menuId as Guid),
    enabled: Boolean(menuId),
    staleTime: 60_000,
  });
}

export function useAsignarPlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CrearMenuAsignadoDto) => menusApi.asignarPlantilla(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.menusAsignados.all });
    },
  });
}

export function useActualizarMenuAsignado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, dto }: { menuId: Guid; dto: ActualizarMenuAsignadoDto }) =>
      menusApi.actualizarMenuAsignado(menuId, dto),
    onSuccess: (_, { menuId }) => {
      qc.invalidateQueries({ queryKey: menusKeys.menusAsignados.all });
      qc.invalidateQueries({ queryKey: menusKeys.menusAsignados.detalle(menuId) });
    },
  });
}

export function useDuplicarMenuAsignado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, dto }: { menuId: Guid; dto?: DuplicarMenuAsignadoDto }) =>
      menusApi.duplicarMenuAsignado(menuId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.menusAsignados.all });
    },
  });
}

export function useEliminarMenuAsignado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (menuId: Guid) => menusApi.eliminarMenuAsignado(menuId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.menusAsignados.all });
    },
  });
}

export function useRestaurarMenuAsignado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (menuId: Guid) => menusApi.restaurarMenuAsignado(menuId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menusKeys.menusAsignados.all });
    },
  });
}