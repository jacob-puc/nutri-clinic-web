# NutriClinica · Frontend

Frontend del sistema de consulta clinica y nutricional. Consume la API .NET del
proyecto hermano `nutriclinica-backend`.

## Requisitos

- Node.js 20 o superior (probado con 24).
- La API corriendo en `http://localhost:5036`.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # en Windows: copy .env.example .env
npm run dev
```

La app queda en http://localhost:5173.

## Scripts

| Comando           | Que hace                                              |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con HMR.                       |
| `npm run build`   | Verifica tipos y compila a `dist/`.                   |
| `npm run preview` | Sirve el build de `dist/` tal cual, para probarlo.    |
| `npm run lint`    | Analisis estatico con oxlint.                         |
| `npm run tsc`     | Solo verificacion de tipos, sin emitir.               |

## Variables de entorno

| Variable         | Default                 | Descripcion                          |
| ---------------- | ----------------------- | ------------------------------------ |
| `VITE_API_URL`   | `http://localhost:5036` | Raiz de la API, sin barra final.     |

Vite solo expone variables con prefijo `VITE_`, y las fija en tiempo de build:
cambiar `.env` exige reiniciar el servidor de desarrollo.

## Estructura

```
src/
  app/          Composicion de la app: router, providers, configuracion global.
  components/
    layout/     Cascarón: lateral, barra superior, selector de tema.
    ui/         Primitivas de shadcn/ui. No editar a mano.
  features/     Un modulo de negocio por carpeta.
    pacientes/
      api/      Cliente HTTP del endpoint.
      hooks/    Hooks de react-query.
      pages/    Pantallas de la ruta.
      components/
  hooks/        Hooks transversales (tema, media query).
  lib/          Utilidades sin estado: cliente HTTP, errores, formatters.
  styles/       Sistema de diseño (tokens, tema claro/oscuro).
  types/        Tipos que reflejan el contrato del backend.
```

Regla de dependencia: `features/` puede usar `components/`, `lib/` y `types/`.
`components/ui/` no importa nada de `features/`. `lib/` no importa React.

## Diseno

Los tokens viven en `src/styles/theme.css` y estan expresados en OKLCH. La
paleta es un duo de temperatura: teal profundo para lo clinico y terracota para
lo humano; los neutros estan templados hacia el teal para que la app se sienta
de una sola pieza.

El tema se resuelve antes del primer pintado mediante un script en linea en
`index.html`, para evitar el parpadeo blanco al recargar en modo oscuro.

## Alcance actual

Solo el modulo de Pacientes esta activo: listado con busqueda y orden en
cliente. Agenda, Consultas, Nutricionistas y Planes aparecen en la lateral
deshabilitados; sus rutas redirigen a Pacientes hasta que tengan backend.
No hay autenticacion todavia.
