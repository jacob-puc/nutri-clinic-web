import { apiClient } from "@/lib/api-client";
import type { Nutricionista } from "@/types/api";

export const nutricionistasApi = {
  listar: async (): Promise<Nutricionista[]> => {
    const { data } = await apiClient.get<Nutricionista[]>(
      "/api/nutricionistas",
    );
    return data;
  },
};
