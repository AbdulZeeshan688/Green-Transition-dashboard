# Green Transition Dashboard Backend

## Setup

```bash
uv venv --python 3.12
uv pip install -r requirements.txt
```

Copy `.env.example` to `.env` and add your OpenRouteService API key. Without a key, the backend uses `data/demo_routes.json`.

## Run

```bash
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs and try `POST /api/routes`.

## Test

```bash
.venv/Scripts/python -m pytest
```
