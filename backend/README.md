# Green Transition Dashboard Backend

C# Azure Function (.NET 10, isolated worker). `POST /api/routes` finds routes with OpenRouteService and returns energy and CO2 per route.

## Setup

Install the [.NET 10 SDK](https://dotnet.microsoft.com/download) and [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local).

Copy `GreenTransition.Backend/local.settings.example.json` to `GreenTransition.Backend/local.settings.json` and add your OpenRouteService API key as `ORS_API_KEY`. Without a key, the backend uses `GreenTransition.Backend/data/demo_routes.json`.

## Run

```bash
cd GreenTransition.Backend
func start
```

It listens on http://localhost:8000. Try it with:

```bash
curl -X POST http://localhost:8000/api/routes -H "Content-Type: application/json" -d "{\"start\": [25.6612, 60.9827], \"end\": [26.038, 61.205]}"
```

## Test

```bash
dotnet test
```
