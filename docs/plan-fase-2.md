# Plan de cierre — Fase 2 dirección visual A+

> Estado: **en ejecución**. Fases 0, 1, 2, 3, 4 y 5 completadas. Cada ítem lleva la evidencia
> verificada (archivo:línea o cálculo). Auditoría: 22-10-2026. Rama: `fase-2-direccion-visual`.

Leyenda de estado: `[RESUELTO]` ya está hecho y verificado · `[PENDIENTE]` confirmado sin resolver ·
`[PARCIAL]` queda una parte concreta · `[DECISIÓN]` necesita que se defina el rumbo antes de tocar código.

---

## 0. Resumen ejecutivo

| # | Punto | Estado verificado |
|---|---|---|
| 1 | Estados globales vacío/error/esqueleto + primitivas huérfanas | `[RESUELTO]` (commit `e5e00a8`) |
| 3 | Contraste del tema claro | `[RESUELTO]` (commit `01087ec`) |
| 4 | Clave del tema `nutriclinia` | `[RESUELTO]` (commit `01087ec`) |
| 5 | Acciones muertas + Cerrar sesión | `[RESUELTO]` (commit `476b864`) |
| 6 | Mapas de transición + `Completada` + módulo Consultas | `[RESUELTO]` — hueco cerrado con el módulo completo (Fase 5) |
| 7 | Estado de vista en URL | `[RESUELTO]` (commits `b91bcf2`, `19ea9b5`) |
| 8 | Editorial y tipografía | `[RESUELTO]` — tildes (`090cc6a`), escala de títulos y anchos (`ad0c4c9`) |

**Hallazgo nuevo y de mayor peso que los anteriores:** el módulo **Consultas existe completo en el
backend y no tenía una sola línea en el frontend**. Era la causa real de que una cita no pudiera
llegar nunca a `Completada` desde la interfaz. Ver sección 6 — **ya cerrado en Fase 5**.

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

## 4. Fase 3 — Estado de vista en la URL ✅ COMPLETADA (`19ea9b5`)

### 4.1 `[RESUELTO]` Lo que ya funciona
`pacientes-page.tsx:26-36` persiste `busqueda` en la URL con `{ replace: true }` (línea 35). Ya está.

### 4.2 `[RESUELTO]` Búsqueda del topbar: ahora también con `replace`
`src/components/layout/topbar.tsx:56-64` llamaba a `navigate(...)` **sin objeto de opciones**, así
que cada Enter del buscador global empujaba una entrada al historial. Añadido `{ replace: true }`
en la línea 64.

Verificado en el navegador: `history.length` **6 → 6** tras pulsar Enter en el buscador global con
`luis`, con la URL cambiando a `/pacientes?busqueda=luis` y el listado filtrado a un solo registro.

### 4.3 `[RESUELTO]` La pestaña del expediente vive en `?pestana=`
`paciente-detalle-page.tsx` era `<Tabs defaultValue="resumen">` (hoy `value` + `onValueChange` en la
línea 195): el estado vivía dentro de Radix y al refrescar o volver atrás volvía siempre a
"Resumen". Ahora se controla desde `useSearchParams`.

- Lista blanca `PESTANAS` en el módulo: un valor desconocido cae a `resumen`, así una URL mal
  construida no deja la pestaña vacía.
- `resumen` no se escribe en la URL (es el valor por defecto), con lo que la ficha limpia no lleva
  parámetros de más.

Verificado en el navegador:
| Acción | Resultado |
|---|---|
| Clic en "Evolución" | URL → `?pestana=medidas`, pestaña seleccionada |
| Refresco con `?pestana=fotos` | abre **Fotos**, no Resumen |
| `?pestana=zzz` | cae a **Resumen** con su panel renderizado |

### 4.4 `[RESUELTO]` Orden del listado en la URL
`pacientes-page.tsx:19` guardaba `ascendente` en `useState` local y se perdía al refrescar. Ahora se
deriva de `?orden=desc` en la línea 35 (ausente = ascendente), con `cambiarOrden` escribiendo el
parámetro.

Verificado: clic en el botón → URL `?orden=desc`, filas en orden **Paciente Borrable → Luis →
Carlos** (antes C → L → P) y la etiqueta del botón cambia a "Ordenar de A a Z".

Queda fuera de alcance, y fue deliberado: **la ordenación por columna de las tablas**. Ningún `<th>`
de la app es ordenable (los encabezados son fijos); eso es una iteración de tabla real, no de URL.

---

## 5. Fase 4 — Menú de usuario y cierre de sesión ✅ COMPLETADA (`476b864`)

### 5.1 `[RESUELTO]` Las acciones muertas ya no existen
Verificado: **ya no hay** cadenas "Agendar cita" ni "Ver expediente" sueltas en `src/`. Ese punto de
la auditoría anterior está resuelto.

### 5.2 `[RESUELTO]` Menú de usuario con cierre de sesión
Nuevo `src/components/auth/menu-usuario.tsx`, montado en el topbar en lugar del marcador de posición
que había (`topbar.tsx`, el `div` "NC"). El trigger lleva el avatar con iniciales, el nombre en
`md+` y `aria-label="Menú de usuario: <nombre>"`; el menú abre con nombre, correo y **"Cerrar
sesión"**.

- Llama al `logout` de `use-auth.tsx:81`, que ya existía y no lo invocaba nadie, y navega a
  `/login` con `replace`, evitando un parpadeo del layout protegido con la sesión ya cerrada.
- Usa `onSelect` de Radix (no `onClick`), que además cierra el menú al activarse.
- `if (!usuario) return null`: nunca se pinta un disparador vacío.

**Dónde vive y por qué no rompe la regla de dependencias:** `src/components/auth/` junto a
`auth-guard.tsx`, que ya era el precedente de componente de presentación que consume el contexto de
autenticación. El resto de `components/` sigue sin importar de `features/`.

Los seis tonos de avatar pasan de estar copiados en `avatar-paciente.tsx` a `src/lib/avatar-tonos.ts`,
para que el avatar del topbar y los del listado compartan una única copia verificada.

Verificado en el navegador con sesión iniciada:
| Paso | Resultado |
|---|---|
| Clic en el trigger | menú con "Administrador NutriClinica" + `admin@nutriclinica.cl` + "Cerrar sesión" |
| Clic en "Cerrar sesión" | URL → `/login` y `localStorage` solo con `nutriclinica-theme` (tokens borrados) |

---

## 6. Fase 5 — Consultas (el hueco de mayor peso) ✅ COMPLETADA

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

### 6.3 `[RESUELTO]` Módulo Consultas construido (Fase 5)
Antes: **cero** referencias a "consulta" en todo `src/`. Ahora existe el módulo completo en
`src/features/consultas/` (`api/`, `hooks/`, `lib/`, `components/`, `pages/`), activo en el
navegador y con rutas propias.

**Lo que quedó construido, contra el contrato real del backend:**

| Pieza | Detalle |
|---|---|
| `consultas-api.ts` | `listar` (paginado, con `traerTodasLasHojas`), `obtenerPorId`, `obtenerPorCita` (404 → `null`), `listarPorPaciente`, `crear`, `cerrar` |
| Cola del día (`/consultas`) | Citas de hoy agrupadas en *En curso* / *Por atender* / *Aún sin confirmar*, con contador de cerradas |
| Espacio de trabajo (`/consultas/:id`) | Secciones apiladas con anclas laterales: motivo → medidas → fotos → documentos → cierre. Sin wizard ni pestañas: el paciente puede llegar con el análisis antes que la báscula |
| "Iniciar atención" | Intercepta el target `EnCurso` en `AccionesCita`/`BotonesEstadoCita`: crea la consulta (el backend pone la cita en `EnCurso` en la misma transacción), no un `PATCH` de estado suelto |
| "Cerrar consulta" | `PATCH /consultas/{id}/cerrar` → la cita pasa sola a `Completada`. Consulta con `fechaFin` se renderiza en solo lectura |
| Tipo autodetectado | 0 consultas previas → `Inicial`; >0 → `Seguimiento`. Sin diálogo: quien atiende no elige tipo en plena consulta |
| Subida real de archivos | `subirFoto`/`subirDocumento` en `pacientes-api.ts` con `Content-Type: multipart/form-data` **por petición** (obligatorio en axios 1.20: sin el override el `FormData` se serializa a JSON y el archivo se pierde — verificado con prueba local) |
| Enlaces expediente↔consulta | `DialogoMedida` acepta `consultaId`; secciones de medidas/fotos/documentos filtran por `consultaId`; las subidas invalidan expediente y consultas |

`src/lib/paginacion.ts` (`traerTodasLasHojas`) es el helper compartido que absorbe el paginado de
`GET /api/consultas` y `GET /api/citas`; `citas-api.ts` se refactorizó para usarlo.

**Consecuencia funcional que desaparece:** una cita en `EnCurso` ya puede acabar en `Completada`
desde la interfaz. El circuito clínico cita → consulta → `Completada` está cerrado.

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
4. ~~**Fase 3** (sección 4) — URL. Queda la agenda, el expediente y el orden de tabla.~~ ✅ `19ea9b5`
5. ~~**Fase 4** (sección 5) — menú de usuario y logout.~~ ✅ `476b864`
6. ~~**Fase 5** (sección 6) — Consultas, que es la que de verdad cierra el circuito clínico.~~ ✅ ver commits abajo

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
| `28e97e1` | fix: la agenda volvía a Mes al cambiar la vista del calendario |
| `0c7fdd6` | `TooltipSimple` compartido y tooltips contradictorios eliminados |
| `19ea9b5` | Fase 3: pestañas del expediente y orden en la URL |
| `476b864` | Fase 4: menú de usuario con cierre de sesión |
| `d7bbd47` | cierre de la dirección visual A+ y Fase 5: módulo de Consultas + pestaña Consultas en el expediente |
| `1a243a2` | tab "Historial del día" en /consultas para ver el historial completo del día |
| `3c6ac56` | fix: quitar la seccion "Aun sin confirmar" de la cola del dia |
