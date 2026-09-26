# Instrucciones para GitHub Copilot

1. **Uso de MCP Context7:** Cuando respondas sobre React, TanStack/React Query, TypeScript o Tailwind CSS, utiliza las herramientas del servidor MCP `context7` para verificar la documentación y sintaxis más reciente.
2. **Cero Deprecaciones:** No sugieras ni utilices funciones, hooks o utilidades marcadas como `@deprecated` según la documentación de Context7.
3. **Estándares del Proyecto:**
   - **TypeScript:** Tipado estricto (prohibido `any`). Los `id` son `string` (UUID v4) para compatibilidad con AWS DynamoDB.
   - **React Query (v5+):** Uso de sintaxis de objetos en `useQuery`/`useMutation` e invalidación de caché con `queryClient.invalidateQueries`.
   - **Tailwind CSS:** Diseño limpio inspirado en Material 3 (inputs con halos suaves en focus, toasts translúcidos sin emojis, tablas compactas agrupando contacto).
