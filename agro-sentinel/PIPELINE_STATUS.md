# Estado real del pipeline `/edge`, `/cloud` y `/terraform`

**Fecha:** agosto 2026 · **Alcance:** `agro-sentinel/edge`, `agro-sentinel/cloud`,
`agro-sentinel/terraform` · **Código modificado:** ninguno.

---

## Resumen

El pipeline de datos de Agro-Sentinel **nunca ha transportado una lectura de
extremo a extremo**, y no puede hacerlo en su estado actual. No es que falte
hardware: hay dos defectos que impiden el flujo aunque el hardware estuviera
instalado, y la infraestructura que lo alojaría nunca se ha aplicado.

| Componente | Estado | Detalle |
| :--- | :--- | :--- |
| `edge/src/capture.py` → `database.py` | **Roto** | Escribe un `float` donde el lector espera un `dict`; el `TypeError` aparece al leer, no al escribir (§1). |
| `edge/src/sync.py` | **Nunca publica** | El `TypeError` de §1 lo captura el bucle de reintento y lo registra cada 30 s, indefinidamente (§2). |
| Contrato de identificadores | **Incompatible** | El edge emite `temp_01`; la nube exige `^GH-[A-Z]{3}-\d{2}$` y rechaza el mensaje (§3). |
| `cloud/main.py` | **Correcto pero sin entrada** | Valida, sanea, calcula VPD y alarmas, escribe en Firestore y BigQuery. Un defecto menor de valor cero (§4). |
| `cloud/thermal.py` | **Stub** | Devuelve 42,5 °C y `anomaly: True` para toda imagen; el modelo se construye y no se usa (§5). |
| `cloud/ai_assistant.py` | **Sin desplegar** | Código completo, nunca ejecutado: depende de una tabla de BigQuery que no existe. |
| `terraform/` | **Nunca aplicado** | Sin estado, sin `.tfvars`; y fallaría en el primer `apply` por §7. |
| Pruebas | **No prueban nada** | Las dos del pipeline no pueden pasar o no afirman nada (§6). |

La consola web ya no depende de nada de esto: lee Firestore directamente con el
SDK de navegador y, cuando no hay configuración de Firebase, genera datos y los
etiqueta como simulados en cada vista.

---

## 1. El agente edge guarda un número donde el lector espera un objeto

`edge/src/capture.py:17-20` genera un escalar por sensor y lo pasa como
*payload*:

```python
val = round(random.uniform(sensor["min"], sensor["max"]), 2)
buffer_reading(sensor["id"], val)          # capture.py:20
```

`edge/src/database.py:36` documenta y anota lo contrario:

```python
def buffer_reading(sensor_id: str, payload: dict):     # database.py:36
    ...
    json.dumps(payload)                                # database.py:43
```

`json.dumps(27.35)` es válido, así que **la escritura no falla**: la fila queda
en SQLite con `payload = "27.35"`. El error aparece al leer, en
`edge/src/database.py:60-61`:

```python
record = json.loads(row["payload"])        # -> 27.35, un float
record["_row_id"] = row["id"]              # TypeError
```

```
TypeError: 'float' object does not support item assignment
```

Reproducido con las mismas tres líneas sobre una base SQLite vacía. Las
anotaciones de tipo están puestas y son correctas; nadie ejecutó un verificador
de tipos que las leyera.

## 2. El error se pierde en el bucle de reintento

`get_unsynced()` se llama en `edge/src/sync.py:80`, **fuera** del `try` por
registro de las líneas 87-101. La excepción sube hasta `start_sync_agent`:

```python
while True:                                 # sync.py:118
    try:
        sync_to_cloud(publisher, topic_path)
    except Exception as exc:                # sync.py:121
        logging.error(f"Sync agent error: {exc}")
    time.sleep(interval)                    # sync.py:123
```

El agente registra una línea cada 30 segundos y sigue vivo. El proceso parece
sano, el buffer local crece sin límite y nada se publica jamás. Es el modo de
fallo más caro posible: silencioso y con apariencia de funcionamiento.

## 3. Aunque publicara, la nube rechazaría el mensaje

`cloud/main.py:29-30` define el contrato de identificadores:

```python
KNOWN_SENSOR_IDS = frozenset({'GH-AMB-01', 'GH-DUR-01', 'GH-CAY-01', 'GH-ORO-01', 'GH-TEN-01'})
_SENSOR_ID_RE    = re.compile(r'^GH-[A-Z]{3}-\d{2}$')
```

y lo aplica en `cloud/main.py:166`. Los identificadores que emite el edge
(`capture.py:5-9`) son `temp_01`, `humid_01` y `soil_01`: ninguno coincide con
el patrón ni con el conjunto. Tampoco coincide `GH-001`, el identificador por
defecto de `edge/simulator.py:7`, ni `GH-TEST-01`, el que usa la prueba local
`cloud/test_local.py:12` (`TEST` son cuatro letras).

Hay además una diferencia de **granularidad**, no solo de nombre: el edge emite
un mensaje por sensor con un valor, y la nube espera un mensaje por invernadero
con todos los campos (`temperature_c`, `humidity_rh`, `co2_ppm`, …). Arreglar
el `TypeError` sin unificar la granularidad produciría mensajes válidos con un
solo campo y ocho `null`.

Relacionado, en `edge/src/sync.py:62-70` el mapeo usa `or` para el respaldo de
campos:

```python
"battery_level": record.get("battery_level") or record.get("battery"),
```

Un `0.0` es falso en Python, así que una batería agotada — exactamente la
lectura que debe disparar la alarma crítica de `main.py:52` — se publica como
`null` y no dispara nada.

## 4. Un cero descarta el cálculo de VPD

`cloud/main.py:181-182`:

```python
vpd       = calculate_vpd(temp, humidity)       if temp and humidity else None
dew_point = calculate_dew_point(temp, humidity) if temp and humidity else None
```

`0.0` es falso. A exactamente 0 °C no se calcula ni el déficit de presión de
vapor ni el punto de rocío, y ambos se escriben como `null` en Firestore y en
BigQuery. Cayambe está a 2 830 m: 0 °C es una noche, no una avería. La consola
web reimplementa estas fórmulas en `web/src/domain/psychrometrics.ts` con la
comprobación correcta (`Number.isFinite`) y con pruebas contra la tabla 2.3 del
FAO-56.

## 5. El análisis térmico es un valor fijo

`cloud/thermal.py:26` construye el modelo:

```python
model = GenerativeModel("gemini-pro-vision")
```

y no vuelve a mencionarlo. El análisis está escrito a mano en las líneas 77-86:

```python
analysis_result = {
    "max_temp_detected": 42.5,      # thermal.py:79
    "anomaly_detected":  True,      # thermal.py:80
    "description": "Detected a localised hot spot in the upper-right quadrant, …",
}
```

Cada imagen subida al bucket escribe un documento idéntico en
`greenhouses/{id}/thermal_scans` y, por la línea 102, marca `thermal_alert: True`
en el documento del invernadero. Un operador vería una alerta térmica por cada
foto tomada, siempre con la misma temperatura.

El identificador de modelo tampoco es utilizable: `gemini-pro-vision` fue
retirado por Google, igual que el `gemini-1.5-flash` de
`cloud/ai_assistant.py:78`. Cualquier despliegue tendría que elegir un modelo
vigente antes de la primera llamada.

La consola marca cada captura leída de Firestore como **sin verificar** — no por
detectar el 42,5, sino porque el escritor no registra qué modelo produjo el
número. La ausencia de procedencia no es prueba de análisis.

## 6. Las dos pruebas del pipeline no prueban nada

`cloud/test_thermal.py:32` afirma sobre una cadena que el código no emite:

```python
self.assertTrue(any("AI Analysis Result" in log for log in cm.output))
```

`thermal.py:88` registra `AI analysis result for …`. La comparación distingue
mayúsculas, así que la afirmación no puede ser cierta. Lo mismo en la línea 51
(`"skipping"` frente a `Skipping non-image file` de `thermal.py:67`).

`cloud/test_local.py` no afirma nada en absoluto: invoca `process_sensor_data`
con `sensor_id: "GH-TEST-01"`, que la validación de `main.py:166` rechaza, la
función retorna temprano, y la prueba imprime `--- Test Completed ---` y
termina con éxito. Es decir: la única prueba de la ruta de ingesta pasa
*precisamente porque* la ingesta no ocurre.

`edge/test_simulator.py` sí prueba algo real, pero prueba `simulator.py`, que no
forma parte del flujo: `edge/main.py:4` importa `simulate_sensors` de
`capture.py`. `edge/storage.py` (`LocalBuffer`, una segunda base SQLite
incompatible en `buffer.sqlite`) no se importa desde ningún sitio.

## 7. Terraform nunca se ha aplicado, y fallaría al aplicarse

No existe `terraform.tfstate`, ni `.terraform/`, ni `terraform.tfvars` en el
repositorio ni fuera de él. Además, del código actual:

- **`main.tf:90-92`** — `google_app_engine_application` con
  `location_id = var.region`, cuyo valor por defecto es `us-central1`. App
  Engine no acepta ese identificador: la región se llama `us-central` en esa
  API. El `apply` falla ahí.
- **`main.tf:137-140`** — la función referencia el secreto `agro-hmac-secret` de
  Secret Manager, que ningún recurso de este Terraform crea. Hay que crearlo
  fuera de banda o el `apply` falla.
- **`main.tf:97`** — `data "archive_file"` pertenece al proveedor
  `hashicorp/archive`, que no está declarado en `required_providers`
  (`main.tf:2-8`). `terraform init` lo instala igualmente, pero la versión
  queda sin fijar.
- **`main.tf:229`** — `ask-ai` se publica con `allUsers` como invocador. Es
  deliberado y está documentado (la autenticación se hace dentro de la función
  con un token de Firebase), pero conviene que quien lo aplique lo sepa.
- El mismo ZIP se despliega para las tres funciones con distintos
  `entry_point`; correcto, pero significa que un fallo de importación en
  cualquiera de los tres módulos rompe las tres.

## 8. La API REST que la web esperaba no existe

El `dataService.js` que esta migración eliminó llamaba a
`${VITE_SENSOR_API_URL}/live` y `/history`. `terraform/main.tf` sólo crea tres
funciones: `process-sensor-data` (Pub/Sub), `process-thermal-image` (GCS) y
`ask-ai` (HTTP). Los endpoints `/live` y `/history` no existen en ninguna parte
del repositorio. Poner `VITE_USE_MOCK=false` producía una consola que hacía
peticiones a rutas inexistentes.

La consola reescrita lee Firestore directamente con el SDK web, que es lo que
las reglas de `web/firestore.rules` ya contemplaban.

---

## Lo que sí está bien

Merece decirse, porque el trabajo existe:

- `cloud/main.py` es el módulo más sólido del repositorio. Valida el
  identificador, sanea cada campo numérico contra un rango físico
  (`main.py:33-43`), verifica una firma HMAC en tiempo constante
  (`main.py:117-130`), calcula VPD y punto de rocío, evalúa umbrales críticos y
  de aviso, y escribe estado en Firestore e histórico en BigQuery. Salvo el
  cero de §4, haría su trabajo el día que le llegue un mensaje.
- Los umbrales ISA 18.2 de `main.py:46-63` son una tabla razonada y son los que
  la consola implementa ahora en `web/src/domain/alarms.ts`, con pruebas.
- `edge/src/database.py` usa una ruta absoluta y crea el directorio con
  permisos `0o700`; `edge/src/sync.py:17` falla en el arranque si falta
  `GCP_PROJECT_ID` en lugar de conectarse a un proyecto por defecto. Las dos
  decisiones son correctas.
- `edge/simulator.py` emite exactamente el esquema que la nube espera. Es el
  módulo que debería estar en el flujo.

---

## Qué haría falta para que esto fuera real

En orden. No se ha intentado ninguno de estos pasos: requieren hardware,
decisiones de producto y una cuenta de GCP con facturación.

1. **Fijar el contrato de mensaje** en un solo sitio (un JSON Schema en el
   repositorio) y generar de ahí la validación de `cloud/main.py` y la
   construcción de `edge/src/sync.py`. El defecto de §3 es una divergencia de
   contrato, y volverá a ocurrir mientras el contrato viva duplicado en cuatro
   ficheros.
2. **Un mensaje por pasarela, no por sensor.** Sustituir `capture.py` por
   `simulator.py` (o por el lector Modbus real) y hacer que `buffer_reading`
   reciba el `dict` completo que ya está anotado.
3. **Identificadores de sensor reales.** Decidir si `GH-AMB-01` identifica a la
   finca, al invernadero o a la pasarela — hoy se usa para las tres cosas — y
   registrar el mapeo a hardware físico.
4. **Una prueba de contrato de extremo a extremo**: emisor → SQLite → payload
   Pub/Sub → `process_sensor_data`, con el emulador de Firestore y un doble de
   BigQuery. Habría detectado §1, §3 y §6 en un solo `pytest`.
5. **Ejecutar un verificador de tipos sobre `/edge` y `/cloud`.** `mypy` señala
   §1 sin ejecutar nada, porque las anotaciones ya están escritas.
6. **Hardware.** Sensores de temperatura/HR, CO₂, humedad de sustrato y PAR con
   sus rangos y precisiones; una pasarela con almacenamiento local; una cámara
   térmica con una resolución declarada. Sin esto no hay medición, sólo
   simulación con otro nombre.
7. **Análisis térmico real:** elegir un modelo vigente, descargar la imagen del
   bucket, pasarla al modelo, registrar en el documento qué modelo y qué versión
   produjeron el resultado — el campo que la consola ya busca para dejar de
   marcar la captura como sin verificar. Y registrar la temperatura ambiente del
   mismo instante, sin la cual el ΔT no significa nada.
8. **Aplicar Terraform** con backend remoto de estado, corrigiendo §7, creando
   el secreto HMAC y una cuenta de servicio dedicada con
   `roles/pubsub.publisher` únicamente (ya está descrito, sin implementar, en
   `edge/src/sync.py:25-35`).
9. **Escribir en `readings`.** La colección compartida de `@cognitex/data` es la
   que alimenta el histórico de la consola; hoy `main.py` escribe
   `greenhouses/{id}` (estado actual) y BigQuery (histórico), y ninguno de los
   dos es esa colección. Mientras siga así, una consola con Firebase
   configurado mostrará el estado actual y una gráfica vacía — que es la
   verdad, y la consola lo dice.

## Qué hace la consola mientras tanto

- Sin configuración de Firebase: genera lecturas deterministas y las etiqueta
  `Datos simulados` en todas las vistas, con `DataSourceBadge`.
- Con Firebase configurado: lee `readings` y `alerts` mediante `@cognitex/data`,
  y `greenhouses/{id}` y sus `thermal_scans` mediante `web/src/data/store.ts`.
  Si `readings` está vacía, el histórico se muestra vacío. No se rellena con
  datos generados.
- El VPD, el punto de rocío, los grados-día, la integral diaria de luz y las
  alarmas ISA 18.2 se calculan en el navegador a partir de las lecturas
  cargadas, con pruebas unitarias contra valores publicados. Son los mismos
  umbrales que `cloud/main.py` aplicaría del lado del servidor.
