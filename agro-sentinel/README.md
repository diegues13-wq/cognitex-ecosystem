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

Construida sobre los paquetes `@cognitex/*`. La pila compartida y las
decisiones que la sostienen están en
[`../packages/README.md`](../packages/README.md); aquí sólo lo propio de esta
consola.

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

### Secciones

| Sección | Qué muestra |
| :--- | :--- |
| Clima | Temperatura, HR, VPD, CO₂, humedad de sustrato y PAR del invernadero seleccionado |
| Historial | Series de la ventana elegida (24 h por defecto) |
| Alarmas | Evaluación ISA 18.2 con banda muerta; el operador puede reconocer |
| Análisis térmico | Capturas de `thermal_scans`, marcadas **sin verificar** cuando no consta qué modelo las produjo |
| Consultas | Preguntas en lenguaje natural resueltas en el navegador contra las lecturas cargadas |
| Fincas | Las cinco fincas y su estado |

La consola se refresca sola cada 60 s: un centro de control la deja abierta
todo el turno, y refrescar por temporizador es la diferencia entre una consola
y una captura de pantalla.

### De dónde salen los datos

`src/data/repository.ts` es el único punto de entrada, y aplica las dos reglas
de `@cognitex/data`:

| | Firebase configurado | Sin configurar |
| :--- | :--- | :--- |
| Lecturas y alertas | `readings` y `alerts`, filtradas por `orgId` | Generador determinista |
| Estado e imágenes | `greenhouses/{id}` y su subcolección `thermal_scans`, vía `src/data/store.ts` | Generador |
| Insignia | `Datos medidos`, con la hora de respuesta | `Datos simulados` |

Los documentos de `greenhouses` los escribe `cloud/main.py` con nombres de
campo de Python (`temperature`, `vpd_kpa`, `max_temp_detected`), así que se
**validan**, no se castean: `doc.data() as GreenhouseSample` sería una mentira
que el compilador no puede comprobar sobre un esquema que ya ha divergido una
vez.

Si `readings` está vacía, el histórico se muestra vacío. No se rellena con
datos generados — ver §9 de PIPELINE_STATUS.md.

El VPD, el punto de rocío, los grados-día, la integral diaria de luz y las
alarmas ISA 18.2 se calculan en el navegador a partir de las lecturas cargadas,
con los mismos umbrales que `cloud/main.py` aplicaría del lado del servidor.

## 🚀 Puesta en marcha

### Requisitos
* Node.js 22+ y npm 10+
* Python 3.11+ y `uv` (sólo para `/edge` y `/cloud`)
* SDK de Google Cloud (`gcloud`) para desplegar

### Consola web

Es un *workspace* del monorepo, así que se instala una sola vez desde la raíz
del repositorio. El nombre del workspace es `agro-sentinel-web`, no
`agro-sentinel`:

```bash
npm install                                  # una vez, en la raíz
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

Desde la raíz del repositorio:

```bash
npm run typecheck --workspace agro-sentinel-web
npm run lint      --workspace agro-sentinel-web
npm run test      --workspace agro-sentinel-web   # 107 pruebas, 6 ficheros
npm run build     --workspace agro-sentinel-web   # tsc --noEmit && vite build
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
docker run -p 8080:8080 agro-sentinel-web
```

El contenedor escucha en 8080, que es lo que Cloud Run enruta.

> La entrada `agro-sentinel-web` de [`../docker-compose.yml`](../docker-compose.yml)
> sigue usando `build: ./agro-sentinel/web` como contexto, que este Dockerfile
> ya no admite. Usa `docker build -f` hasta que se corrija.

## ☁️ Despliegue

Cloud Run (`cognitex-485919`, `us-east4`) mediante
`.github/workflows/deploy-agro.yaml`, en cada *push* a `main` que toque
`agro-sentinel/web/**`, `packages/**` o los manifiestos de la raíz.

**Nada despliega `/edge`, `/cloud` ni `/terraform`.** El filtro de rutas del
workflow no los incluye y Terraform nunca se ha aplicado.

## 📚 Documentación

* **[PIPELINE_STATUS.md](./PIPELINE_STATUS.md)** — qué existe, qué está roto y
  qué haría falta para que `/edge`, `/cloud` y `/terraform` funcionaran.
* [PRODUCTION.md](./PRODUCTION.md) — guía de despliegue. Describe el objetivo,
  no el estado actual; contrástala con PIPELINE_STATUS.md.
* `web/firestore.rules` — reglas de acceso por `orgId`.

## 📄 Licencia

Propiedad privada de Cognitex Industrial.
