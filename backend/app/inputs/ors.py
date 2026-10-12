import json
import logging

import httpx

from app.inputs.config import BACKEND_DIR

ORS_URL = "https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson"
DEMO_FILE = BACKEND_DIR / "data" / "demo_routes.json"

logger = logging.getLogger(__name__)


def get_routes(start: list[float], end: list[float], route_config: dict, api_key: str | None) -> tuple[list[dict], str]:
    if route_config["use_demo_data"] or not api_key:
        return parse_routes(load_demo()), "demo"
    try:
        try:
            raw = request_ors(start, end, route_config["alternatives"], api_key)
        except httpx.HTTPStatusError:
            raw = request_ors(start, end, 1, api_key)
        return parse_routes(raw), "ors"
    except httpx.HTTPError as error:
        logger.warning("ORS request failed, using demo data: %s", error)
        return parse_routes(load_demo()), "demo"


def request_ors(start: list[float], end: list[float], alternatives: int, api_key: str) -> dict:
    body = {"coordinates": [start, end], "elevation": True}
    if alternatives > 1:
        body["alternative_routes"] = {"target_count": alternatives}
    response = httpx.post(ORS_URL, json=body, headers={"Authorization": api_key}, timeout=10)
    response.raise_for_status()
    return response.json()


def load_demo() -> dict:
    with open(DEMO_FILE, encoding="utf-8") as file:
        return json.load(file)


def parse_routes(raw: dict) -> list[dict]:
    routes = []
    for feature in raw["features"]:
        summary = feature["properties"]["summary"]
        routes.append({
            "distance_m": summary.get("distance", 0.0),
            "duration_s": summary.get("duration", 0.0),
            "coords": feature["geometry"]["coordinates"],
        })
    return routes
