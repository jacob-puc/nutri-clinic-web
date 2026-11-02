import { apiClient } from "@/lib/api-client";
import { abrirPdf } from "@/lib/pdf";
import type {
  ActualizarMedidaDto,
  ActualizarObjetivoPacienteDto,
  CrearMedidaDto,
  CrearPacienteDto,
  ExpedienteCompleto,
  FotoSeguimiento,
  DocumentoPaciente,
  Guid,
  MedidaAntropometrica,
  Paciente,
  SubirDocumentoDto,
  SubirFotoDto,
} from "@/types/api";

export const pacientesApi = {
  listar: async (): Promise<Paciente[]> => {
    const { data } = await apiClient.get<Paciente[]>("/api/pacientes");
    return data;
  },

  obtenerPorId: async (id: Guid): Promise<Paciente> => {
    const { data } = await apiClient.get<Paciente>(`/api/pacientes/${id}`);
    return data;
  },

  obtenerExpediente: async (id: Guid): Promise<ExpedienteCompleto> => {
    const { data } = await apiClient.get<ExpedienteCompleto>(
      `/api/pacientes/${id}/expediente`,
    );
    return data;
  },

  crear: async (paciente: CrearPacienteDto): Promise<Paciente> => {
    const { data } = await apiClient.post<Paciente>("/api/pacientes", paciente);
    return data;
  },

  actualizar: async (
    id: Guid,
    cambios: Partial<CrearPacienteDto>,
  ): Promise<Paciente> => {
    const { data } = await apiClient.put<Paciente>(
      `/api/pacientes/${id}`,
      cambios,
    );
    return data;
  },

  /** Va a su propio endpoint: el alta del paciente no toca el objetivo. */
  actualizarObjetivo: async (
    id: Guid,
    objetivo: ActualizarObjetivoPacienteDto,
  ): Promise<Paciente> => {
    const { data } = await apiClient.put<Paciente>(
      `/api/pacientes/${id}/objetivo`,
      objetivo,
    );
    return data;
  },

  /** Baja logica: el backend marca `IsActive = false` y conserva el historial. */
  darDeBaja: async (id: Guid): Promise<void> => {
    await apiClient.delete(`/api/pacientes/${id}`);
  },

  /** La estatura va en cm y el IMC lo calcula la API. */
  registrarMedida: async (
    pacienteId: Guid,
    medida: CrearMedidaDto,
  ): Promise<MedidaAntropometrica> => {
    const { data } = await apiClient.post<MedidaAntropometrica>(
      `/api/pacientes/${pacienteId}/medidas`,
      medida,
    );
    return data;
  },

  /** `PUT`: reemplaza la medicion completa y el backend recalcula el IMC. */
  actualizarMedida: async (
    pacienteId: Guid,
    medidaId: Guid,
    medida: ActualizarMedidaDto,
  ): Promise<MedidaAntropometrica> => {
    const { data } = await apiClient.put<MedidaAntropometrica>(
      `/api/pacientes/${pacienteId}/medidas/${medidaId}`,
      medida,
    );
    return data;
  },

  /**
   * `POST /api/pacientes/{id}/fotos/subir` recibe `multipart/form-data`
   * (`[FromForm] SubirFotoDto`). El cliente global fija `application/json` y
   * axios 1.20 serializaría el `FormData` a JSON, perdiendo el archivo: hay que
   * forzar el tipo de contenido por petición para que el navegador ponga el
   * boundary.
   */
  subirFoto: async (pacienteId: Guid, foto: SubirFotoDto): Promise<FotoSeguimiento> => {
    const formulario = new FormData();
    formulario.append("archivo", foto.archivo, foto.archivo.name);
    formulario.append("tipo", foto.tipo);
    if (foto.consultaId) formulario.append("consultaId", foto.consultaId);
    if (foto.notas) formulario.append("notas", foto.notas);

    const { data } = await apiClient.post<FotoSeguimiento>(
      `/api/pacientes/${pacienteId}/fotos/subir`,
      formulario,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  /** Igual que `subirFoto`, pero al endpoint de documentos. */
  subirDocumento: async (
    pacienteId: Guid,
    documento: SubirDocumentoDto,
  ): Promise<DocumentoPaciente> => {
    const formulario = new FormData();
    formulario.append("archivo", documento.archivo, documento.archivo.name);
    formulario.append("tipo", documento.tipo);
    if (documento.consultaId) formulario.append("consultaId", documento.consultaId);
    if (documento.observaciones) formulario.append("observaciones", documento.observaciones);

    const { data } = await apiClient.post<DocumentoPaciente>(
      `/api/pacientes/${pacienteId}/documentos/subir`,
      formulario,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  /** PDF del historial clinico (datos, alergias, medidas, consultas). */
  abrirHistorialPdf: (pacienteId: Guid) => abrirPdf(`/api/pacientes/${pacienteId}/historial-clinico/pdf`),

  /** Borrado definitivo: el backend elimina el registro y el archivo del bucket. */
  eliminarFoto: async (pacienteId: Guid, fotoId: Guid): Promise<void> => {
    await apiClient.delete(`/api/pacientes/${pacienteId}/fotos/${fotoId}`);
  },

  eliminarDocumento: async (pacienteId: Guid, documentoId: Guid): Promise<void> => {
    await apiClient.delete(`/api/pacientes/${pacienteId}/documentos/${documentoId}`);
  },
};
