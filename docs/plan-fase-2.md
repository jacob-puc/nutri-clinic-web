# Plan de cierre — Fase 2 dirección visual A+

> Estado: **en ejecución**. Fase 0 completada. Cada ítem lleva la evidencia verificada
> (archivo:línea o cálculo). Auditoría: 22-10-2026. Rama: `fase-2-direccion-visual`.

Leyenda de estado: `[RESUELTO]` ya está hecho y verificado · `[PENDIENTE]` confirmado sin resolver ·
`[PARCIAL]` queda una parte concreta · `[DECISIÓN]` necesita que se defina el rumbo antes de tocar código.

---

## 0. Resumen ejecutivo

| # | Punto | Estado verificado |
|---|---|---|
| 1 | Estados globales vacío/error/esqueleto + primitivas huérfanas | `[RESUELTO]` (commit `e5e00a8`) |
| 3 | Contraste del tema claro | `[RESUELTO]` (commit `01087ec`) |
| 4 | Clave del tema `nutriclinia` | `[RESUELTO]` (commit `01087ec`) |
| 5 | Acciones muertas + Cerrar sesión | `[PARCIAL]` — faltan menú de usuario y logout |
| 6 | Mapas de transición + `Completada` | `[RESUELTO]` — pero destapa otro hueco mayor |
| 7 | Estado de vista en URL | `[PARCIAL]` — agenda hecho (`b91bcf2`); falta expediente y orden |
| 8 | Editorial y tipografía | `[RESUELTO]` — tildes (`090cc6a`), escala de títulos y anchos (`ad0c4c9`) |

**Hallazgo nuevo y de mayor peso que los anteriores:** el módulo **Consultas existe completo en el
backend y no tiene una sola línea en el frontend**. Es la causa real de que una cita no pueda llegar
nunca a `Completada` desde la interfaz. Ver sección 6.

---

## 1. Fase 0 — Arreglos de minutos ✅ COMPLETADA (`01087ec`, `090cc6a`)

### 1.1 `[RESUELTO]` Clave del tema con typo
`src/hooks/use-theme.tsx:7` era `const STORAGE_KEY = "nutriclinia-theme";`. Corregido a
`nutriclinica-theme` con migración de la clave vieja en `leerPreferenciaInicial`: si la nueva no
tiene valor y la antigua sí, se copia y se borra, así el usuario no pierde su preferencia.

### 1.2 `[RESUELTO]` Borde `--input` a 3:1
Aplicado en `theme.css`. `--input` deja de apuntar a `var(--neutral-500)` y lleva valor propio por
tema, para no arrastrar la primitiva neutral:

| Par | Antes | Ahora |
|---|---|---|
| `--input` sobre `--card` (claro) | 2.995:1 | **3.31:1** |
| `--input` sobre `--card` (oscuro) | 2.997:1 | **3.21:1** |

Detalle que hay que recordar: **la dirección es opuesta en cada tema**. En claro el borde baja de
luminosidad porque la tarjeta es clara; en oscuro **sube**, porque la tarjeta es oscura y solo un
borde más claro la contrasta. Escribir la corrección como "oscurecer el borde" habría empeorado el
tema oscuro.

> Resto del punto 3 **ya está resuelto**, verificado calculando el CSS real:
> `warning` 4.74:1 · `info` 4.88:1 · `success` 5.85:1 · `muted-foreground` 6.74:1 (card) y 6.51:1
> (background) · `muted-foreground-subtle` 4.75:1 — todos sobre `--card` en tema claro.
> `--muted-foreground/70` ya **no se usa en ningún sitio**.
> La línea `accent-400` del gráfico **ya no existe**: `--chart-2` en claro apunta a `--accent-500`
> (3.3:1) y el propio `theme.css:138` documenta que `accent-400` (2.43:1) es solo relleno de
> `--gradient-accent`.

### 1.3 `[RESUELTO]` Palabra en inglés suelta
`paciente-detalle-page.tsx:1204`: "No hay analisis, estudios ni recetas associated a este paciente."
→ "No hay análisis, estudios ni recetas **asociadas** a este paciente."

### 1.4 `[RESUELTO]` Tildes: se decide que la UI se escribe con tildes (commit `090cc6a`)
Decisión tomada: **toda la UI con tildes**, no solo el login. El login ya estaba acentuado y el
resto no, con lo que el producto tenía dos voces.

Aplicado a 55 cadenas visibles en 16 archivos: etiquetas de formulario, botones, mensajes de
validación de los zod schemas, placeholders, `aria-label` y estados vacíos.

Verificado que **no** se tocó nada que no fuera texto visible:
- contrato con la API: `?busqueda=`, `correoElectronico`, `contrasena`, `telefono`
- identificadores, constantes (`VACIO`, `HORAS_AGENDA`) y clases CSS (`data-slot="dropdown-menu*"`)
- el nombre de marca **NutriClinica**, que no se acentúa (aparece partido en `logo.tsx:29`,
  `sidebar.tsx:32` y `sidebar-mobile.tsx:30` para el degradado)
- comentarios

El chequeo se hizo quitando los acentos de ambas versiones y comparando línea a línea: los 13
archivos del commit son idénticos salvo por las tildes.

**Regla para el resto de fases:** cualquier texto nuevo que se escriba va con tildes.

---

## 2. Fase 1 — Estados globales y limpieza de primitivas ✅ COMPLETADA (`e5e00a8`)

### 2.1 `[RESUELTO]` Componentes globales de estado
Diez implementaciones sueltas pasan a cuatro. Se crearon en `src/components/states/` (la ruta que
proponía el plan era `components/feedback/`; se unifica en un solo directorio), y el breadcrumb en
`components/layout/`, que es donde vive ya la navegación.

| Componente | Sustituye | Consumos |
|---|---|---|
| `EstadoError` | `EstadoError` (pacientes), `EstadoErrorGeneral` (expediente), `EstadoErrorCita` (cita) | 3 |
| `EstadoVacio` | `Vacio` ×3 (expediente), `EstadoVacioCatalogo`, `EstadoSinResultados` | 5 |
| `SkeletonTabla` | `TablaSkeleton` | 1 |
| `Breadcrumbs` | dos miguas de pan hechas a mano | 2 |

Detalles que decidieron la forma de cada uno, y que no eran evidentes al planificar:

- **`EstadoError` necesitaba dos variantes, no una.** El error dentro de una página lleva icono y
  fila horizontal; el que reemplaza la página entera va centrado y sin icono. Ese era el patrón real
  de las tres implementaciones originales.
- **`onReintentar` y `children` conviven.** El expediente ofrece "Volver a pacientes" **y**
  "Reintentar"; la cita solo "Volver a citas"; el listado solo reintentar. Con una sola vía no se
  cubrían los tres.
- **El nivel del título depende de la variante.** `pagina` lleva `h1` porque sustituye a la página;
  `linea` baja a `h2`, porque siempre va dentro de una que ya tiene el suyo. Usar `h1` en ambas
  dejaba dos `h1` en la página de pacientes. Verificado después: cada página tiene un único `h1`.
- **`EstadoVacio` no conoce los módulos.** El estado de catálogo vacío se dibuja con un
  `AvatarPaciente`, pero `components/` no puede importar de `features/`. El slot es un `ReactNode`
  (`visual`) y el avatar lo pinta `pacientes-page.tsx`.
- **La descripción acepta nodos**, no `string`, porque `EstadoSinResultados` resalta el término
  buscado con un `<span>`.
- **Se conservó la copy original** de cada implementación, corrigiendo solo sus tildes.

### 2.2 `[RESUELTO]` Primitivas shadcn huérfanas — se migran, no se borran
Decisión tomada: **usar shadcn**, que era el motivo de tenerlas. Resultado medido sobre
`src/**/*.tsx`:

| Primitiva | Antes | Después |
|---|---|---|
| `table.tsx` | **0** usos, 3 tablas `<table>` nativas | 3 tablas migradas, **0** nativas |
| `avatar.tsx` | **0** usos | `AvatarPaciente` montado sobre `Avatar`/`AvatarFallback` |

En la migración de tablas lo que había que no romper: los anchos, el colapso responsive por
breakpoint (`sm:table-cell`, `lg:table-cell`) y la truncación. `TableCell` trae `whitespace-nowrap`
por defecto, que impediría comprimir las celdas con texto truncado, así que esas se fijan en
`whitespace-normal` explícitamente.

### 2.3 `[RESUELTO]` Hallazgo de paso: el esqueleto de carga era invisible
La clase `.skeleton` **no está definida en ningún CSS** — aparece solo en un comentario de
`theme.css:85`. Los cuatro placeholders de `TablaSkeleton` se pintaban transparentes y sin
animación: la tabla se veía como una tarjeta con filas vacías mientras cargaba. Sustituidos por el
componente `Skeleton`, que sí tiene `animate-pulse bg-muted`.

`SkeletonTabla` replica además la estructura real de tabla, en vez de una lista, para que no haya
salto de layout al llegar los datos; la primera columna acepta un avatar con dos líneas de texto,
que es como se compone la fila real del listado.

---

## 3. Fase 2 — Editorial y tipografía

### 3.1 `[RESUELTO]` Escala única de `h1`
Aplicado. La escala de pesos quedó **100% uniforme**:

| Rol | Clase | Ocurrencias |
|---|---|---|
| Hero de portada (login) | `text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[0.92]` | 1 (justificado: es una portada) |
| Página | `text-foreground text-2xl font-semibold tracking-tight md:text-3xl` | 3 |
| Estado / error | `text-foreground text-xl font-semibold` | 3 |
| `h2` de sección | `font-semibold` | 11 |
| `h3` | `font-semibold` | 1 |

`font-bold` desaparece de todo el HTML salvo del logotipo (`logo.tsx:28`, `sidebar.tsx:30`,
`sidebar-mobile.tsx:29`), donde es correcto: es la marca, no tipografía de interfaz.

Corregido el único desviado: `cita-detalle-page.tsx:257` iba con `font-bold`.

### 3.2 `[RESUELTO]` Ancho de página por tipo
Aplicado. El ancho **baja con la profundidad de la lectura**, que es la regla que faltaba fijar:

| Rol | Ancho | Páginas |
|---|---|---|
| Listado | `max-w-7xl` (1280px) | Pacientes, Citas (calendario) |
| Expediente (ficha densa) | `max-w-6xl` (1152px) | Ficha del paciente + su skeleton |
| Ficha simple | `max-w-4xl` (896px) | Ficha de la cita + su skeleton |
| Estado / error | `max-w-2xl` (672px) | las 3 pantallas de estado |

El padding ya era consistente en todas (`px-4 py-6 md:px-8 md:py-8`), salvo estados (`py-16`),
que es correcto.

**No se igualó la ficha de cita a la del expediente, y fue deliberado.** `cita-detalle` es una
pila de cards con `<dl>` a 2 columnas; `paciente-detalle` tiene grids de 3 columnas, galería de
fotos y una cabecera con rail de signos. Forzar las dos a `6xl` habría dejado la ficha de cita
aireada y con medidas de línea largas. Densidad distinta, ancho distinto.

Único cambio de ancho real: la agenda pasó de `max-w-[1400px]` a `max-w-7xl`, para que los dos
listados compartieran medida. Verificado que el calendario aguanta: su rejilla es
`lg:grid-cols-[minmax(0,1fr)_360px]`, así que a 1280px cada columna de día queda en ~120px.

---

## 4. Fase 3 — Estado de vista en la URL

### 4.1 `[PARCIAL]` Lo que ya funciona
`pacientes-page.tsx:26-36` persiste `busqueda` en la URL con `{ replace: true }` (línea 35). Ya está.

### 4.2 `[PENDIENTE]` Búsqueda del topbar rompe ese criterio
`src/components/layout/topbar.tsx:56-60` llama a `navigate(...)` **sin objeto de opciones**, así que
cada Enter del buscador global empuja una entrada al historial y el botón Atrás deja de funcionar
como se espera. Mismo destino que la lista, criterio distinto. Añadir `{ replace: true }`.

### 4.3 `[PARCIAL]` La pestaña del expediente no está ni en `useState` — la agenda ya sí
**La agenda quedó resuelta** en el commit `b91bcf2`: `AgendaPage` controla `?vista=hoy|calendario`
y `?cita=<id>` con `useSearchParams`, y esa cita abre un `DetalleCitaSheet` sin salir del
calendario. Es el patrón a replicar.

**Sigue pendiente el expediente.** `paciente-detalle-page.tsx:150` → `<Tabs defaultValue="resumen" className="mt-6">`
es **sin controlar**: el estado vive dentro de Radix. Resultado: al refrescar o volver atrás, la
pestaña vuelve a "Resumen" siempre.

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

1. ~~**Fase 0 completa** (sección 1)~~ ✅ `01087ec`, `090cc6a`
2. ~~**Fase 2** (sección 3) — editorial y tipografía~~ ✅ `ad0c4c9`
3. ~~**Fase 1** (sección 2) — estados globales + huérfanas~~ ✅ `e5e00a8`
4. **Fase 3** (sección 4) — URL. La agenda ya está; queda el expediente y el orden de tabla.
5. **Fase 4** (sección 5) — menú de usuario y logout.
6. **Fase 5** (sección 6) — Consultas, que es la que de verdad cierra el circuito clínico.

Cada fase es entregable independiente y commiteable por separado.

### Commits de la fase hasta ahora

| Commit | Contenido |
|---|---|
| `55c5362` | baseline previo a la fase |
| `88092d6` | dirección visual A+ en el módulo Pacientes |
| `1cb87a2` | login a pantalla completa con fondo nutricional |
| `99b3399` | fix: agenda rota por el nuevo paginado de `GET /api/citas` |
| `472c207` | rediseño del expediente clínico + fix del doble scroll |
| `01087ec` | fix: clave del tema con typo y borde `--input` a 3:1 |
| `090cc6a` | tildes en toda la UI |
| `b91bcf2` | vista de citas con estado en URL y renombre Agenda→Citas |
| `d1ca0dd` | docs: fase 0 marcada como completada |
| `ad0c4c9` | escala única de títulos y ancho de página por tipo |
| `e5e00a8` | estados globales compartidos y tablas sobre shadcn |
