# Guía de Despliegue a Producción - Agro-Sentinel

Esta guía detalla los pasos para desplegar la arquitectura completa de Agro-Sentinel en un entorno productivo.

## Prerrequisitos
- Cuenta de Google Cloud Platform (GCP) con facturación habilitada.
- Proyecto de GCP creado.
- `gcloud` CLI instalado y autenticado.
- `terraform` instalado.
- `uv` instalado (para Python).
- Dispositivo Edge (e.g., Raspberry Pi 4) con Linux (Debian/Ubuntu).

---

## 1. Infraestructura Cloud (Terraform)

Utilizamos Terraform para aprovisionar Pub/Sub, BigQuery, Storage, Firestore y deployar las Cloud Functions.

### Pasos
1.  Navegar al directorio `terraform`:
    ```bash
    cd terraform
    ```
2.  Crear archivo `terraform.tfvars`:
    ```hcl
    project_id = "TU_PROYECTO_GCP"
    region     = "us-central1"
    ```
3.  Inicializar y aplicar:
    ```bash
    terraform init
    terraform plan -out=tfplan
    terraform apply tfplan
    ```
4.  **Nota**: Terraform empaquetará automáticamente el código de `/cloud` y lo subirá a las Cloud Functions.

### Variables de Salida
Al finalizar, Terraform mostrará endpoints importantes (e.g., URL de la API de IA). Anótalos.

---

## 2. Despliegue Edge (Raspberry Pi/Gateway)

El componente Edge corre como un servicio systemd para asegurar que inicie con el sistema y se reinicie en caso de fallos.

### Instalación en el Dispositivo
1.  Clonar el repositorio en el dispositivo (o copiar carpeta `edge`).
2.  Instalar dependencias con `uv`:
    ```bash
    cd edge
    uv venv
    source .venv/bin/activate
    uv pip install -r requirements.txt
    ```
3.  Configurar credenciales (si se usa IoT Core/Mqtt Bridge real):
    - Colocar certificados en `edge/certs/`.
    - Configurar variables de entorno (ver abajo).

### Configuración como Servicio (Systemd)
Crear archivo `/etc/systemd/system/agro-edge.service`:

```ini
[Unit]
Description=Agro-Sentinel Edge Gateway
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/agro-sentinel/edge
ExecStart=/home/pi/agro-sentinel/edge/.venv/bin/python main.py
Restart=always
RestartSec=5
Environment="GCP_PROJECT_ID=tu-proyecto"
Environment="DEVICE_ID=GH-ECU-01"

[Install]
WantedBy=multi-user.target
```

Habilitar el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable agro-edge
sudo systemctl start agro-edge
```

---

## 3. Despliegue Web (Frontend)

La aplicación React se compila a archivos estáticos HTML/JS/CSS optimizados. Recomendamos Firebase Hosting por su integración con GCP.

### Compilación
1.  Instalar dependencias y compilar:
    ```bash
    cd web
    npm ci
    npm run build
    ```
2.  El resultado estará en la carpeta `dist/`.

### Opción A: Firebase Hosting (Recomendado)
1.  Instalar herramientas: `npm install -g firebase-tools`
2.  Login: `firebase login`
3.  Inicializar: `firebase init hosting` (Seleccionar "Use existing project", directorio `dist`, y configuración SPA "Yes").
4.  Desplegar:
    ```bash
    firebase deploy --only hosting
    ```

### Opción B: Google Cloud Storage + CDN
1.  Crear bucket público:
    ```bash
    gsutil mb gs://mi-app-agro
    gsutil defacl set public-read gs://mi-app-agro
    ```
2.  Subir archivos:
    ```bash
    gsutil -m rsync -R dist gs://mi-app-agro
    ```
3.  Configurar página principal:
    ```bash
    gsutil web set -m index.html -e index.html gs://mi-app-agro
    ```

---

## 4. Variables de Entorno y Secretos

### Backend (Cloud Functions)
Definidas en `terraform/main.tf`:
- `PROJECT_ID`: ID del proyecto GCP.
- `BQ_TABLE`: Tabla de BigQuery.

### Edge
- `DEVICE_ID`: Identificador único del dispositivo (e.g., `GH-AMB-01`).
- `GCP_PROJECT_ID`: Proyecto GCP.

### Web (.env.production)
Crear archivo `web/.env.production` antes de hacer build si se requiere conectar a APIs personalizadas:
```env
VITE_API_URL=https://us-central1-tu-proyecto.cloudfunctions.net/api
VITE_FIREBASE_API_KEY=...
```
