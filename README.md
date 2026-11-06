<<<<<<< HEAD
# VisionIQ

VisionIQ is a React + Vite application with a Django REST Framework backend.
The frontend is in `frontend/`, and the API/backend is in `backend/`. Django
serves the existing API contracts and connects to the configured MySQL
database; it does not replace MySQL with SQLite.

## Project layout

```text
VisionIQ/
├── backend/
│   ├── manage.py
│   ├── config/                 # Django settings, URLs, ASGI and WSGI
│   ├── visioniq/               # API, unmanaged legacy models and services
│   │   ├── management/commands/ # Explicit Cloudinary metadata synchronization
│   ├── data/                   # Existing backend data files
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/                    # Existing React application
│   ├── public/                 # Vite static assets and sample feed
│   ├── data/                   # Local spreadsheet (not publicly served)
│   ├── scripts/                # Frontend data utilities
│   ├── package.json
│   └── vite.config.js          # Proxies API and Socket.IO to Django
├── README.md
└── LAN_SETUP.md
```

## Prerequisites

- Python 3.14 (Django 5.2 LTS; the dependency ranges are validated on Python
  3.14).
- Node.js 24 or a compatible current Node.js release.
- Access to the existing MySQL database and its existing telemetry/network
  tables.
- Optional: Ollama, if AI-assisted query parsing is desired.

## Local setup

### Backend — Windows PowerShell

From the repository root:

```powershell
if (-not (Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
py -3.14 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Edit `backend\.env` and provide:

- `DJANGO_SECRET_KEY`: a unique random value of at least 32 characters.
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and
  `MYSQL_DATABASE`: the existing MySQL connection.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
  for server-side Cloudinary Admin API and uploads. Alternatively, set
  `CLOUDINARY_URL` to a standard Cloudinary connection URL. These values belong
  only in `backend\.env`; never add them to frontend environment variables.
- `FRONTEND_URL`: exact React origin(s), comma-separated if needed.
- `DJANGO_ALLOWED_HOSTS`: hostnames/IPs used to reach Django, comma-separated.
- Optional `MYSQL_SSL`, `DJANGO_DEBUG`, `HOST`, `PORT`, `OLLAMA_HOST`,
  `OLLAMA_MODEL`, `STREAM_INTERVAL`, `DATA_DIRECTORY`, `AI_MODEL_PATH`, and
  `AI_VEHICLE_MODEL_PATH`.

Do not commit `backend\.env`. It contains local secrets and is ignored by Git.
Use only `backend\.env.example` as the placeholder template.

Check the configuration and review migrations before applying:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py migrate --plan
.\.venv\Scripts\python.exe manage.py migrate --noinput
```

The legacy network and telemetry tables are represented by unmanaged Django
models, verified against the configured MySQL schema with `inspectdb`; their
data and schema are not recreated. The initial migration creates `users` only
if it does not already exist. To create configured administrator accounts
without changing existing users:

```powershell
.\.venv\Scripts\python.exe manage.py seed_users
```

The Django signing key is intentionally separate from the legacy Node.js JWT
key, so users with a token already stored in the browser may need to sign in
once after migration. The seed command creates missing accounts and never
changes existing passwords.

Start the ASGI server (required for Socket.IO):

```powershell
.\.venv\Scripts\python.exe manage.py serve
```

By default this uses `HOST` and `PORT` from `backend\.env`. For a private LAN,
use `HOST=0.0.0.0`, restrict `DJANGO_ALLOWED_HOSTS`/`FRONTEND_URL` to the
actual hosts, and do not expose the development API publicly.

### Backend — Linux/macOS

```bash
if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; fi
python3.14 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cd backend
.venv/bin/python manage.py check
.venv/bin/python manage.py migrate --plan
.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py serve
```

### Frontend — Windows PowerShell

Open a second terminal at the repository root:

```powershell
Set-Location frontend
npm.cmd ci
npm.cmd run dev
```

On Linux/macOS:

```bash
cd frontend
npm ci
npm run dev
```

Vite proxies `/api`,
`/socket.io`, `/images`, and `/evidence` to `http://127.0.0.1:8000`. For a
separately hosted frontend, set `VITE_API_URL` to the Django API origin and add
the frontend's exact origin to `FRONTEND_URL`.

Run a production frontend build from `frontend/` with `npm.cmd run build`
(PowerShell) or `npm run build` (Linux/macOS).

## Migrated API and event contracts

The API routes are unauthenticated except `GET /api/auth/me` and
`POST /api/cloudinary/images/upload/`, which require the existing bearer-token
flow. Login continues to return `{token, user}`.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Backend health |
| `GET` | `/api/live-feed/models` | NH5, OpenCV, Ultralytics, and optional plate-OCR readiness |
| `POST` | `/api/live-feed/analyze-image` | Run NH5 inference and optional plate OCR on an uploaded image |
| `POST` | `/api/live-feed/analyze-video` | Analyze an uploaded video with supported local YOLO models; returns frame detections, tracked vehicle rows, and violation summaries |
| `POST` | `/api/live-feed/analyze-frame` | Analyze one JPEG/PNG/WebP frame from local playback and return incremental detections, tracked objects, and chart summaries |
| `POST` | `/api/vehicles/upload` | Store browser-parsed CSV/XLSX row batches |
| `GET` | `/api/vehicles` | List telemetry rows |
| `GET` | `/api/vehicles/search` | Search vehicle records and dossier details |
| `GET` | `/api/vehicles/random-batch` | Fetch the next telemetry stream batch |
| `GET`, `POST` | `/api/vehicles/stream-control` | Pause, resume, or trigger the stream |
| `GET` | `/api/vehicles/stats` | Telemetry summary statistics |
| `GET` | `/api/vehicles/incidents` | Telemetry-derived incidents |
| `GET` | `/api/corridors` | Corridor KPIs, cameras, incidents, risk and impact |
| `GET` | `/api/cameras` | Existing six-camera registry |
| `GET` | `/api/cloudinary/images/` | List locally synchronized Cloudinary image metadata; accepts `page_size`, `cursor`, `folder`, and `category` |
| `GET` | `/api/cloudinary/images/<public_id>/` | Retrieve one synchronized image by its Cloudinary public ID |
| `POST` | `/api/cloudinary/images/upload/` | Authenticated multipart upload (`image`, optional `category`, `source_id`) to Cloudinary |
| `POST` | `/api/auth/login` | Username/email login |
| `GET` | `/api/auth/me` | Resolve the current bearer-token user |
| `GET` | `/api/query/ollama-status` | Ollama connectivity and model status |
| `POST` | `/api/query/ai-parse` | Traffic-language filters with rule fallback |
| `POST` | `/api/query/natural-to-cypher` | Generate or pass through Cypher text |
| `GET`, `HEAD` | `/evidence/<path>` | Serve existing evidence files |
| `GET`, `HEAD` | `/images/<path>` | Serve existing image files |

Socket.IO keeps the existing `newVehicleBatch`, `vehicleStreamStatus`, and
`vehicleStreamComplete` events. Cypher is generated as text only; no graph
database executes it. There are no `/api/network/*` or `/api/toll-rates`
endpoints in the existing backend. Network, ontology, camera feeds, dashboards,
projects and other features that already use local/static data or browser
storage remain frontend-managed rather than receiving invented server data.

## Cloudinary images

The backend uses the official Cloudinary Python SDK. It reads either the three
`CLOUDINARY_*` variables or `CLOUDINARY_URL` from `backend\.env`. The Admin API
credentials and signing secret are never sent to React. The existing root
`.gitignore` excludes `.env` files while allowing `.env.example`.

Apply the additive metadata-table migration, then synchronize every uploaded
image (including root and nested folders such as `Photos` and `samples`) into
MySQL:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe manage.py migrate --noinput
.\.venv\Scripts\python.exe manage.py sync_cloudinary_images
```

Synchronization pages through Cloudinary's Admin API using `next_cursor`,
upserts metadata by `public_id`, and does not delete database rows. It is an
explicit command, so listing images never calls Cloudinary on each React
render. `GET /api/cloudinary/images/?page_size=50&folder=Photos` and
`GET /api/cloudinary/images/?category=collision` read the synchronized
database; use the returned `next_cursor` as the next request's `cursor`.
`folder=Root` selects root-level assets. Public IDs containing `/` can be
looked up at the detail endpoint using their encoded path.

Vehicle images embedded in imported CSV/XLSX data are uploaded through the
authenticated `POST /api/cloudinary/images/upload/` endpoint and associated
with their observation ID as `source_id`. The returned secure URL is stored
with the vehicle record and displayed in the telemetry table. Imports also
match existing synchronized Cloudinary assets by `source_id`.

Other evidence can be uploaded by an authenticated client as multipart field
`image` to the same endpoint. Optional `category` and `source_id` values
associate metadata with a detection/violation identifier. Images are
content-hash deduplicated and only the secure URL and metadata are stored in
MySQL. This server-side upload endpoint does not require an unsigned upload
preset, public Admin API access, or browser-visible Cloudinary secrets. Signed
browser-direct uploads are not enabled or needed by this integration.

The backend `.env` must contain Cloudinary credentials before synchronization
or uploads can run. Existing frontend images are replaced with Cloudinary URLs
and removed locally only when their filenames exactly match synchronized
assets. Unmatched or ambiguously named images remain local to avoid breaking
the UI.

## Database and safety

The current MySQL schema includes `users`, `vehicle_events`, corridor/KPI,
camera, incident, risk, impact, traffic-flow, vehicle, toll-rate and knowledge
graph tables. Their Django models use `managed = False`, based on the actual
connected schema. Django does not modify these tables. `migrate` only applies
the idempotent legacy-users bootstrap and records Django migration state; it
does not drop or reset data.

The telemetry upload operation is transactional. It writes to the existing
`vehicle_events` schema. The application does not auto-seed sample telemetry at
startup. The frontend's existing sample feed and local dashboard fixtures
remain unchanged.

## Testing

```powershell
Set-Location backend
.\.venv\Scripts\python.exe manage.py test visioniq
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
```

The model integration can be inspected without changing data using:

```powershell
.\.venv\Scripts\python.exe manage.py inspectdb
```

For a MySQL connection failure, missing legacy table, or Ollama outage, the
backend returns/logs an explicit error or uses the documented deterministic
query fallback; it does not silently replace the configured database or claim
to have generated AI predictions.

The separate Live Feed mode plays the selected video locally in the browser and
sends a resized frame to `POST /api/live-feed/analyze-frame` every 0.5 seconds.
Detection boxes, tracked vehicle rows, and chart summaries update as playback
continues; the entire video is not uploaded or held until processing finishes.
The endpoint keeps short-lived tracking state per browser-generated session ID.
It uses the supplied NH5 Ultralytics model at
`AIModel/nh5_yolov8n_960.pt` by default; override it with
`AI_VEHICLE_MODEL_PATH` if needed. Model weights are not downloaded or
duplicated automatically. Install the backend requirements to enable OpenCV
decoding and Ultralytics inference. The browser overlay and API use normalized
x/y/width/height boxes. The supplied `plate_ocr/` package is loaded directly
from `AI_MODEL_PATH`; install `rapidocr` and `onnxruntime` (included in the
backend requirements) to enable OCR. A plate reading is returned only after the
supplied voter confirms the same valid Indian registration at least five
times; this is not official registration verification. `GET
/api/live-feed/models` reports weight and dependency readiness without loading
large models. Video results remain separate from Excel/CSV telemetry and are
not written to MySQL. The frontend overlays detections on the selected video
and updates tracked vehicle records and video-derived charts during playback.

The NH5 detector provides vehicle and plate localization, but those detections
do not establish helmet violations or speeding. The supplied Darknet
`obj.names` contains only `helmet`, so it cannot establish a missing-helmet
violation or associate that helmet with a vehicle. No calibrated speed model
is present. The driver-distraction `.pth` checkpoint is a bare state
dictionary without its exact architecture or class mapping; it is not run
against arbitrary full frames. The live dashboard reports these limitations
instead of fabricating speed or violation results.
=======
# Vision_IQ
>>>>>>> ec8e087c8de45cdbc5e3dfb29e65f03915e205d1
