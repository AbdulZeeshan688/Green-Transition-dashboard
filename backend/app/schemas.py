from pydantic import BaseModel


class RouteRequest(BaseModel):
    start: list[float] | None = None
    end: list[float] | None = None


class RouteSummary(BaseModel):
    id: int
    distance_m: float
    duration_s: float
    climb_m: float
    descent_m: float
    e_flat_kwh: float
    e_up_kwh: float
    e_re_kwh: float
    e_total_kwh: float
    co2_kg: float


class RouteResult(RouteSummary):
    coords: list[list[float]]


class RoutesSummaryResponse(BaseModel):
    data_source: str
    vehicle: str
    default_id: int
    best_id: int
    saved_kwh: float
    saved_co2_kg: float
    routes: list[RouteSummary]


class RoutesResponse(RoutesSummaryResponse):
    routes: list[RouteResult]
