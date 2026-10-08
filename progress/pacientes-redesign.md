# Rediseño del módulo Pacientes

## Contexto de diseño

El módulo Pacientes es la parte funcional actual de NutriClinica. La dirección visual busca alejarse de un CRUD genérico y presentar el sistema como una herramienta de seguimiento clínico: el usuario debe identificar rápidamente quién es el paciente, cuál es su objetivo, cuándo fue su última medición y qué acción puede realizar.

La base visual existente se conserva: tokens OKLCH, teal clínico, terracota para estados de atención, componentes UI reutilizables y soporte responsive. Los cambios se limitan a jerarquía, composición, etiquetas y acciones visibles.

## Tareas aplicadas

- [x] Documentar la dirección visual y el alcance.
- [x] Reforzar el encabezado del listado como seguimiento clínico.
- [x] Convertir el encabezado del expediente en una zona clínica con acción principal funcional.
- [x] Retirar de la interfaz acciones que todavía no tienen implementación.
- [x] Ocultar la pestaña de Planes mientras el flujo no exista.
- [x] Corregir el orden condicional de hooks en Fotos.
- [x] Validar tipos, build y lint.

## Validacion

- `npm run build` completado sin errores visibles.
- `npm run lint` completado sin errores visibles.
- Diagnosticos de las pantallas modificadas: sin errores.
- No se modificaron endpoints, tipos, hooks de React Query ni mutaciones.

## Restricciones

- No modificar endpoints, tipos de API, hooks de React Query ni mutaciones.
- No introducir datos ficticios para agenda, consultas o planes.
- Mantener la navegación, alta, edición, baja y registro de mediciones existentes.
