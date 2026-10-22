# Plan de cierre — Fase 2 dirección visual A+

> Estado: **propuesto**. Cada ítem lleva la evidencia verificada (archivo:línea o cálculo).
> Fecha de auditoría: 22-10-2026. Rama: `fase-2-direccion-visual`.

Leyenda de estado: `[RESUELTO]` ya está hecho y verificado · `[PENDIENTE]` confirmado sin resolver ·
`[PARCIAL]` queda una parte concreta · `[DECISIÓN]` necesita que se defina el rumbo antes de tocar código.

---

## 0. Resumen ejecutivo

De los 8 puntos que quedaron abiertos en la última revisión:

| # | Punto | Estado verificado |
|---|---|---|
| 1 | Estados globales vacío/error/esqueleto + primitivas huérfanas | `[PENDIENTE]` |
| 3 | Contraste del tema claro | `[PARCIAL]` — solo queda `--input` |
| 4 | Clave del tema `nutriclinia` | `[PENDIENTE]` (1 línea) |
| 5 | Acciones muertas + Cerrar sesión | `[PARCIAL]` — faltan menú de usuario y logout |
| 6 | Mapas de transición + `Completada` | `[RESUELTO]` — pero destapa otro hueco mayor |
| 7 | Estado de vista en URL | `[PARCIAL]` — `replace:true` ya está; falta pestaña y orden |
| 8 | Editorial y tipografía | `[PENDIENTE]` |

**Hallazgo nuevo y de mayor peso que los anteriores:** el módulo **Consultas existe completo en el
backend y no tiene una sola línea en el frontend**. Es la causa real de que una cita no pueda llegar
nunca a `Completada` desde la interfaz. Ver sección 6.

---

## 1. Fase 0 — Arreglos de minutos (sin decisión pendiente)

### 1.1 `[PENDIENTE]` Clave del tema con typo
`src/hooks/use-theme.tsx:7` → `const STORAGE_KEY = "nutriclinia-theme";`
Falta la `c`. Cada recarga no encuentra la clave guardada y parpadea al tema por defecto.

- Cambiar a `nutriclinica-theme`.
- **Migración:** leer la clave vieja una vez y reescribirla, o el usuario pierde su preferencia
  guardada una sola vez. Recomiendo la migración de 3 líneas.

### 1.2 `[PARCIAL]` Borde `--input` a 3:1
Calculado contra el CSS real:

| Par | Ratio | Mínimo | Resultado |
|---|---|---|---|
| `--input` sobre `--card` (claro) | **2.995:1** | 3.0 | falla por 0.005 |
| `--input` sobre `--card` (oscuro) | **2.997:1** | 3.0 | falla por 0.003 |
| `--input` sobre `--background` (oscuro) | 3.296:1 | 3.0 | ok |

`--input: var(--neutral-500)` (`theme.css:133`). Es el borde de `input.tsx`, `textarea.tsx`,
`select.tsx` y `button.tsx`. Basta bajar `--neutral-500` un paso en L* (o subirlo, según el tema)
hasta cruzar 3.0 con margen — objetivo ≥3.2 para que no vuelva a quedar al filo.

> Resto del punto 3 **ya está resuelto**, verificado calculando el CSS real:
> `warning` 4.74:1 · `info` 4.88:1 · `success` 5.85:1 · `muted-foreground` 6.74:1 (card) y 6.51:1
> (background) · `muted-foreground-subtle` 4.75:1 — todos sobre `--card` en tema claro.
> `--muted-foreground/70` ya **no se usa en ningún sitio**.
> La línea `accent-400` del gráfico **ya no existe**: `--chart-2` en claro apunta a `--accent-500`
> (3.3:1) y el propio `theme.css:138` documenta que `accent-400` (2.43:1) es solo relleno de
> `--gradient-accent`.

### 1.3 `[PARCIAL]` Palabra en inglés suelta
`src/features/pacientes/pages/paciente-detalle-page.tsx:1204`:
`"No hay analisis, estudios ni recetas associated a este paciente."` → `asociadas`.

### 1.4 `[DECISIÓN]` Tildes: el login se salta la política
La política del proyecto es **texto de UI sin tildes** y el resto del código la cumple
("busqueda", "clinica", "Evolucion", "Expediente clinico"). Pero el **login está sistemáticamente
acentuado** — y es la pantalla más visible del producto:

- `login-page.tsx:34` "Expediente clínico con medidas y objetivos"
- `login-page.tsx:35` "Agenda de citas de la clínica en un vistazo"
- `login-page.tsx:69` "No se pudo iniciar sesión. Intenta nuevamente."
- `login-page.tsx:113` "Sistema de consulta clínica y nutricional"
- `login-page.tsx:122` "…agenda de la clínica en un solo…"
- `login-page.tsx:159` "Iniciar sesión"
- `login-page.tsx:168` "Correo electrónico"
- `login-page.tsx:190` "Contraseña"
- `login-page.tsx:225` "Iniciando sesión…" / "Iniciar sesión"
- `login-page.tsx:236` "NutriClinica · consulta clínica y nutricional"

Dos sueltos fuera del login:
- `paciente-detalle-page.tsx:1129` "Salir de comparación"
- `src/lib/api-client.ts:76` "La sesión expiró. Inicia sesión nuevamente."

**Opción A (recomendada):** quitar las tildes del login y de los dos sueltos. Unifica el criterio y
deja de tener dos voces en el mismo producto.
**Opción B:** pasar toda la UI a con tildes. Mejor como texto, pero es un barrido grande y hay que
decidirlo como política, no caso a caso.

---

## 2. Fase 1 — Estados globales y limpieza de primitivas

### 2.1 `[PENDIENTE]` Componentes globales de estado
Verificado que **no existen**: no hay `empty-state`, `error-state` ni `breadcrumb` en `src/components/`.
Sí existe `src/components/ui/skeleton.tsx` (usado en 4 sitios).

Hoy cada página monta su propio estado vacío/error. Ejemplo: `paciente-detalle-page.tsx` define
`EstadoNoEncontrado` (línea ~1263) y `EstadoErrorGeneral` (línea ~1291), y hay un `<Vacio>` local
usado en `TabDocumentos` (línea 1204). `cita-detalle-page.tsx` define su propio `EstadoErrorCita`
(línea ~254). Todo duplicado.

Entregables:
- `src/components/feedback/estado-vacio.tsx` — `Vacio` con `titulo`, `descripcion`, `icono`, `accion?`.
- `src/components/feedback/estado-error.tsx` — `EstadoError` con mensaje del `ApiError` y reintento.
- `src/components/feedback/skeleton-tabla.tsx` — filas esqueleto con el mismo ancho de columna real.
- `src/components/navigation/breadcrumbs.tsx` — miga de pan derivada de la ruta
  (`/pacientes/:id` → `Pacientes › nombre`). Hoy no existe ningún indicador de contexto en el
  expediente más allá del título.

Alimentarlos desde los que ya están hechos en `paciente-detalle-page.tsx` para no partir de cero, y
sustituir los equivalentes de `cita-detalle-page.tsx`.

### 2.2 `[PENDIENTE]` Primitivas shadcn huérfanas
Medido por imports reales sobre el total de `src/**/*.tsx` (excluyendo `components/ui`):

| Primitiva | Usos |
|---|---|
| `avatar.tsx` | **0** |
| `table.tsx` | **0** |

Las tablas de la app (`Mediciones anteriores`, `TabMedidas`, listado de pacientes) están hechas con
`<table>` nativo, no con la primitiva.

**Decisión:** borrar ambas (`avatar`, `table`) — es lo más limpio — o migrar las 3 tablas reales a
`table.tsx`. Recomiendo **borrar**, porque migrar es retoque visual justo cuando el expediente acaba
de quedar bien.

---

## 3. Fase 2 — Editorial y tipografía

### 3.1 `[PENDIENTE]` Escala única de `h1`
Verificado que hay 3 tamaños y 2 pesos en juego:

| Ubicación | Clase | Problema |
|---|---|---|
| `login-page.tsx:116` | `text-5xl … sm:text-6xl lg:text-7xl` | hero — correcto, es una portada |
| `pacientes-page.tsx:162` | `text-2xl … md:text-3xl font-semibold tracking-tight` | referencia de página |
| `paciente-detalle-page.tsx:272` | idéntico al anterior | ok |
| `paciente-detalle-page.tsx:1263` (no encontrado) | `text-xl font-semibold` | |
| `paciente-detalle-page.tsx:1291` (error) | `text-xl font-semibold` | |
| `agenda-page.tsx:160` | `text-2xl … md:text-3xl font-bold` | **`font-bold` en vez de `semibold`** y **falta `text-foreground`** |
| `cita-detalle-page.tsx:257` | `text-xl font-bold` | **`font-bold`** |

Definir 2 roles y aplicarlos:
- **Página:** `text-2xl md:text-3xl font-semibold tracking-tight text-foreground`
- **Estado/error:** `text-xl font-semibold text-foreground`
- El hero del login queda aparte, justificado.

### 3.2 `[PENDIENTE]` Ancho de página por tipo
Verificado que cada página usa su propio ancho:

| Tipo de página | Página | Ancho actual |
|---|---|---|
| Listado | Pacientes (`pacientes-page.tsx:63`) | `max-w-7xl` |
| Listado | Agenda (`agenda-page.tsx:157`) | `max-w-[1400px]` |
| Ficha | Paciente (`paciente-detalle-page.tsx:97`) | `max-w-6xl` |
| Ficha | Cita (`cita-detalle-page.tsx:47`) | `max-w-4xl` |
| Estado | ambas | `max-w-2xl` ✅ consistente |

Dos anchos distintos para el mismo tipo (listado) y dos para ficha. El padding sí es consistente en
todas (`px-4 py-6 md:px-8 md:py-8`), salvo estados (`py-16`, correcto).

Propuesta: **listado `max-w-7xl`** (el calendario lo justifica: necesita ancho), **ficha `max-w-6xl`**,
**estado `max-w-2xl`**. Dejaría `cita-detalle` en `max-w-4xl` solo si su contenido es de una sola
columna estrecha — comprobar antes de moverlo.

---

## 4. Fase 3 — Estado de vista en la URL

### 4.1 `[PARCIAL]` Lo que ya funciona
`pacientes-page.tsx:26-36` persiste `busqueda` en la URL con `{ replace: true }` (línea 35). Ya está.

### 4.2 `[PENDIENTE]` Búsqueda del topbar rompe ese criterio
`src/components/layout/topbar.tsx:56-60` llama a `navigate(...)` **sin objeto de opciones**, así que
cada Enter del buscador global empuja una entrada al historial y el botón Atrás deja de funcionar
como se espera. Mismo destino que la lista, criterio distinto. Añadir `{ replace: true }`.

### 4.3 `[PENDIENTE]` La pestaña del expediente no está ni en `useState`
`paciente-detalle-page.tsx:150` → `<Tabs defaultValue="resumen" className="mt-6">` es **sin controlar**:
el estado vive dentro de Radix. Resultado: al refrescar o volver atrás, la pestaña vuelve a
"Resumen" siempre.

Mover a `value` + `onValueChange` controlado y sincronizar con el parámetro `?pestana=`, para que
compartir la URL de "Evolución" abra Evolución.

### 4.4 `[PENDIENTE]` Orden de tabla
`pacientes-page.tsx:19` guarda `ascendente` en `useState` local; se pierde al refrescar. Y **ningún
`<th>` de las tablas de la app es ordenable** (los encabezados son fijos). Opción: persistir
`ascendente` en la URL junto a `busqueda`, y dejar la ordenación por columna para una iteración de
tabla real.

---

## 5. Fase 4 — Menú de usuario y cierre de sesión

### 5.1 `[PARCIAL]` Las acciones muertas ya no existen
Verificado: **ya no hay** cadenas "Agendar cita" ni "Ver expediente" sueltas en `src/`. Ese punto de
la auditoría anterior está resuelto.

### 5.2 `[PENDIENTE]` Pero no se puede cerrar sesión
`src/features/auth/hooks/use-auth.tsx:81` define `logout` y lo expone en el contexto (línea 117),
y **no hay ningún componente que lo invoque**. No hay menú de usuario ni botón "Cerrar sesión" en
ninguna parte. La única vía de salida es borrar el almacenamiento a mano.

Entregable: menú de usuario en el topbar (`avatar.tsx` ya está instalado, huérfano — se pondría a
servir) con nombre del nutricionista, correo y "Cerrar sesión", que llame al `logout` existente y
navegue a `/login`.

---

## 6. Fase 5 — Consultas (el hueco de mayor peso)

### 6.1 `[RESUELTO]` Los dos mapas de transición ya están sincronizados
Frontend `src/features/citas/lib/estados-cita.ts:23` (`TRANSICIONES_CITA`) contra backend
`CitaService.cs:15-22` (`TransicionesPermitidas`) — **copias exactas**:

```
Programada → Confirmada, Cancelada, NoAsistio
Confirmada → EnCurso, Cancelada, NoAsistio
EnCurso    → Cancelada, NoAsistio
Completada → (ninguno)
Cancelada  → (ninguno)
NoAsistio  → Programada
```

### 6.2 `[RESUELTO]` `Completada` no es un bug: se asigna en otro sitio
No se alcanza con `PATCH /api/citas/{id}/estado`. Se asigna al cerrar una consulta:
- `ConsultaService.cs:97` → `cita.Estado = EstadoCita.EnCurso;` al abrir la consulta
- `ConsultaService.cs:137` → `consulta.Cita.Estado = EstadoCita.Completada;` al cerrarla

Es diseño, no error. Por eso `Completada: []` en el frontend es correcto.

### 6.3 `[PENDIENTE]` Pero el frontend no tiene el módulo Consultas
Verificado: **cero** referencias a "consulta" en todo `src/`. Mientras tanto el backend expone
`ConsultasController` completo:

- `POST /api/consultas` — abrir consulta (debe partir de `Confirmada` o `EnCurso`,
  `CitaService.EstadosAtendibles`)
- `PATCH /api/consultas/{id}/cerrar` — cerrarla y **pasar la cita a `Completada`**
- `GET /api/consultas/cita/{citaId}`
- `POST /api/consultas/{id}/medidas`, `/fotos`, `/documentos`

**Consecuencia funcional hoy:** una cita en `EnCurso` solo puede acabar en `Cancelada` o
`NoAsistio`. No existe ninguna ruta en la interfaz para que una atención quede registrada como
completada, que es el estado que un nutricionista espera alcanzar.

`GET /api/consultas` es además el **otro endpoint** que el backend pasó a paginado (junto a
`/api/citas`), lo que confirma que es una funcionalidad viva esperando interfaz.

Alcance propuesto (por orden de esfuerzo):
1. Acción "Iniciar atención" en la ficha de la cita (visible desde `Confirmada`/`EnCurso`) →
   `POST /api/consultas`.
2. Pestaña "Consulta" en el expediente que lea `GET /api/consultas/cita/{id}` y permita registrar
   medidas/fotos/documentos contra la consulta en curso.
3. Acción "Cerrar consulta" → la cita pasa sola a `Completada`.

---

## 7. Pendientes de backend (no bloquean al frontend)

| Hallazgo | Detalle | Impacto |
|---|---|---|
| `[DECISIÓN]` Paginado de `/api/citas` vs calendario | `CitaService` aplica `Skip/Take` con `TamanoPagina` 20 (tope 100). El calendario consulta por **rango**, no por página. Hoy compensado en `citasApi.listar` (pide 100 y recorre hojas). | Funciona, pero es parche. La forma limpia es que el backend acepte "rango completo" (p. ej. `tamanoPagina=0`) y el paginado quede reservado para listados/tablas reales. |
| Redirección 307 HTTP→HTTPS | `http://localhost:5036` redirige a `https://localhost:7140`. El navegador lo sigue, pero suma una ida y vuelta en cada petición. | Ruido y latencia. Ajuste de configuración del backend. |

---

## 8. Orden de ejecución recomendado

1. **Fase 0 completa** (sección 1) — arreglos de minutos, algunos requieren decisión (tildes).
2. **Fase 2** (sección 3) — editorial y tipografía: es lo que hace que deje de verse "genérico".
3. **Fase 1** (sección 2) — estados globales + huérfanas.
4. **Fase 3** (sección 4) — URL.
5. **Fase 4** (sección 5) — menú de usuario y logout.
6. **Fase 5** (sección 6) — Consultas, que es la que de verdad cierra el circuito clínico.

Cada fase es entregable independiente y commiteable por separado.
