# Agro-Sentinel

Consola de invernadero para fincas florícolas y agrícolas en Ecuador: clima,
déficit de presión de vapor, alarmas ISA 18.2, análisis térmico y consultas
sobre las lecturas de cinco fincas.

> **Estado del pipeline.** La consola web funciona y está desplegada. La cadena
> `edge → Pub/Sub → Cloud Functions → BigQuery` **nunca ha transportado una
> lectura**, y `terraform` nunca se ha aplicado. Está documentado con
> referencias a fichero y línea en **[PIPELINE_STATUS.md](./PIPELINE_STATUS.md)**.
> Léelo antes de asumir que hay medición detrás de un número.

## 🏗 Arquitectura

1. **`/web`** — La consola. React 19 + TypeScript sobre los paquetes
   compartidos `@cognitex/*`. Es la parte que funciona.
2. **`/edge`** — Python para la pasarela del invernadero. Aspiracional; roto en
   dos puntos (§1 y §3 de PIPELINE_STATUS.md).
3. **`/cloud`** — Cloud Functions de ingesta, análisis térmico y consultas.
   `main.py` es correcto y no recibe mensajes; `thermal.py` es un *stub* que
   devuelve 42,5 °C para toda imagen.
4. **`/terraform`** — Infraestructura declarada, nunca aplicada.

### Consola web

| Categoría | Tecnología |
| :--- | :--- |
| UI | React 19 · TypeScript |
| Build | Vite 7 · `@cognitex/config` |
| Estilos | Tailwind v4 vía `@cognitex/theme` (sin `tailwind.config.js` ni PostCSS) |
| Shell, tarjetas y gráficas | `@cognitex/ui` (SVG propio, sin librería de gráficas) |
| Autenticación | `@cognitex/auth` (Firebase 11) |
| Datos | `@cognitex/data` (Firestore) |
| Iconos | lucide-react |
| Pruebas | vitest |

Sin `recharts`, sin `leaflet`/`react-leaflet` (estaba fijado en un *release
candidate*), sin `date-fns` y sin `prop-types`. El mapa de cinco puntos fijos es
ahora una tabla en la sección **Fincas**; las fechas se formatean con
`Intl.DateTimeFormat` en hora de Ecuador.

## 🚀 Puesta en marcha

### Requisitos
* Node.js 22+ y npm 10+
* Python 3.11+ y `uv` (sólo para `/edge` y `/cloud`)
* SDK de Google Cloud (`gcloud`) para desplegar

### Consola web

Es un *workspace* del monorepo, así que se instala desde la raíz del
repositorio:

```bash
npm install --workspaces --include-workspace-root
npm run dev --workspace agro-sentinel-web
```

Disponible en [http://localhost:5174](http://localhost:5174).

### 🔐 Acceso

Con `VITE_FIREBASE_API_KEY` vacío la consola arranca **sin autenticación real**:
cualquier credencial entra, todos los datos se generan en el navegador y cada
vista lleva la insignia `Datos simulados`. Copia `web/.env.example` a `web/.env`
y rellena los seis valores de Firebase para tener sesión y datos reales.

Hasta agosto de 2026 el `Dockerfile` no declaraba ningún `ARG` y
`deploy-agro.yaml` no pasaba ningún `--build-arg`, por lo que **la consola
desplegada estuvo siempre en ese modo**, independientemente de lo que
contuviera el proyecto de Firebase. Ambos ficheros están corregidos.

## 🛠 Desarrollo y pruebas

### Consola web (`/web`)

```bash
cd web
npx tsc --noEmit     # tipos
npx eslint .         # lint
npx vitest run       # 107 pruebas del dominio
npx vite build       # build de producción
```

Las pruebas cubren `src/domain`: psicrometría (contra la tabla 2.3 del FAO-56),
alarmas ISA 18.2 con banda muerta y ciclo de vida, agronomía (grados-día,
integral diaria de luz, presión de Botrytis), estadísticas de series y el
analizador de consultas.

### Cloud (`/cloud`) y Edge (`/edge`)

`cloud/test_local.py` y `cloud/test_thermal.py` **no comprueban nada**: la
primera no afirma nada y la segunda afirma sobre cadenas que el código no emite.
Ver §6 de [PIPELINE_STATUS.md](./PIPELINE_STATUS.md). Se dejan como están,
porque arreglar la prueba sin arreglar el pipeline sólo cambia de sitio la
apariencia de funcionamiento.

### 🐳 Docker

La imagen se construye **desde la raíz del repositorio**: la consola depende de
los paquetes `@cognitex/*` y del *lockfile* raíz, que un contexto limitado a
`agro-sentinel/web` no puede ver.

```bash
docker build -f agro-sentinel/web/Dockerfile \
  --build-arg VITE_FIREBASE_API_KEY=... \
  -t agro-sentinel-web .
docker run -p 5174:8080 agro-sentinel-web
```

## 📚 Documentación

* **[PIPELINE_STATUS.md](./PIPELINE_STATUS.md)** — qué existe, qué está roto y
  qué haría falta para que `/edge`, `/cloud` y `/terraform` funcionaran.
* [PRODUCTION.md](./PRODUCTION.md) — guía de despliegue. Describe el objetivo,
  no el estado actual; contrástala con PIPELINE_STATUS.md.
* `web/firestore.rules` — reglas de acceso por `orgId`.

## 📄 Licencia

Propiedad privada de Cognitex Industrial.
