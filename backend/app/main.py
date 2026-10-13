from typing import Literal

from fastapi import FastAPI, HTTPException

from app.inputs.config import load_config
from app.pipeline import plan_routes
from app.schemas import RouteRequest, RoutesResponse, RoutesSummaryResponse

CITIES = load_config()["cities"]
City = Literal[tuple(CITIES)]

app = FastAPI(title="Green Transition Dashboard Backend", swagger_ui_parameters={"defaultModelsExpandDepth": -1})


@app.post("/api/routes", response_model=RoutesResponse)
def post_routes(request: RouteRequest) -> dict:
    return plan_routes(request.start, request.end)


@app.get("/api/routes/by-city", response_model=RoutesSummaryResponse)
def get_routes_by_city(start: City, end: City) -> dict:
    if start == end:
        raise HTTPException(status_code=400, detail="Start and end must be different cities")
    return plan_routes(CITIES[start], CITIES[end])
