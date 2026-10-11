from fastapi import FastAPI

from app.pipeline import plan_routes
from app.schemas import RouteRequest, RoutesResponse

app = FastAPI(title="Green Transition Dashboard Backend")


@app.post("/api/routes", response_model=RoutesResponse)
def post_routes(request: RouteRequest) -> dict:
    return plan_routes(request.start, request.end)
