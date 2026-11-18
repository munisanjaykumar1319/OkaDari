"""
In-memory live location tracker.
Privacy-by-design: no location data is ever written to the database.
Data is cleared immediately when sharing stops.
"""
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import WebSocket


class LocationTracker:
    def __init__(self):
        # { ride_id: { status, lat, lon, accuracy, timestamp, provider_id, connections } }
        self._sessions: dict[int, dict] = {}
        self._locks: dict[int, asyncio.Lock] = {}

    def _get_lock(self, ride_id: int) -> asyncio.Lock:
        if ride_id not in self._locks:
            self._locks[ride_id] = asyncio.Lock()
        return self._locks[ride_id]

    def _ensure_session(self, ride_id: int, provider_id: int):
        if ride_id not in self._sessions:
            self._sessions[ride_id] = {
                "status": "IDLE",
                "lat": None,
                "lon": None,
                "accuracy": None,
                "timestamp": None,
                "provider_id": provider_id,
                "connections": set(),
            }

    async def start_session(self, ride_id: int, provider_id: int) -> bool:
        async with self._get_lock(ride_id):
            self._ensure_session(ride_id, provider_id)
            session = self._sessions[ride_id]
            if session["status"] in ("SHARING",):
                return False  # Already sharing
            session["status"] = "SHARING"
            session["provider_id"] = provider_id
            return True

    async def pause_session(self, ride_id: int, provider_id: int) -> bool:
        async with self._get_lock(ride_id):
            session = self._sessions.get(ride_id)
            if not session or session["provider_id"] != provider_id:
                return False
            if session["status"] != "SHARING":
                return False
            session["status"] = "PAUSED"
            await self._broadcast(ride_id, {"type": "paused"})
            return True

    async def resume_session(self, ride_id: int, provider_id: int) -> bool:
        async with self._get_lock(ride_id):
            session = self._sessions.get(ride_id)
            if not session or session["provider_id"] != provider_id:
                return False
            if session["status"] != "PAUSED":
                return False
            session["status"] = "SHARING"
            return True

    async def stop_session(self, ride_id: int, provider_id: int) -> bool:
        async with self._get_lock(ride_id):
            session = self._sessions.get(ride_id)
            if not session or session["provider_id"] != provider_id:
                return False
            # Notify all connected passengers before clearing
            await self._broadcast(ride_id, {"type": "stopped"})
            # Close all WebSocket connections
            for ws in list(session["connections"]):
                try:
                    await ws.close(code=1000)
                except Exception:
                    pass
            # Privacy: clear all data immediately
            del self._sessions[ride_id]
            if ride_id in self._locks:
                del self._locks[ride_id]
            return True

    async def update_location(
        self,
        ride_id: int,
        provider_id: int,
        lat: float,
        lon: float,
        accuracy: Optional[float] = None,
    ) -> bool:
        async with self._get_lock(ride_id):
            session = self._sessions.get(ride_id)
            if not session or session["provider_id"] != provider_id:
                return False
            if session["status"] != "SHARING":
                return False
            session["lat"] = lat
            session["lon"] = lon
            session["accuracy"] = accuracy
            session["timestamp"] = datetime.utcnow()
            # Broadcast to all connected WebSocket clients
            payload = {
                "type": "location",
                "lat": lat,
                "lon": lon,
                "accuracy": accuracy,
                "timestamp": session["timestamp"].isoformat(),
            }
            await self._broadcast(ride_id, payload)
            return True

    def get_latest(self, ride_id: int) -> Optional[dict]:
        session = self._sessions.get(ride_id)
        if not session:
            return None
        if session["status"] not in ("SHARING", "PAUSED"):
            return None
        if session["lat"] is None:
            return None
        return {
            "ride_id": ride_id,
            "lat": session["lat"],
            "lon": session["lon"],
            "accuracy": session["accuracy"],
            "timestamp": session["timestamp"],
            "status": session["status"],
        }

    def get_status(self, ride_id: int, provider_id: int) -> str:
        session = self._sessions.get(ride_id)
        if not session or session["provider_id"] != provider_id:
            return "IDLE"
        return session["status"]

    async def add_connection(self, ride_id: int, ws: WebSocket):
        async with self._get_lock(ride_id):
            session = self._sessions.get(ride_id)
            if session:
                session["connections"].add(ws)

    async def remove_connection(self, ride_id: int, ws: WebSocket):
        # Use lock only if session still exists
        session = self._sessions.get(ride_id)
        if session:
            session["connections"].discard(ws)

    async def _broadcast(self, ride_id: int, payload: dict):
        """Send JSON payload to all connected WebSocket clients (called under lock)."""
        session = self._sessions.get(ride_id)
        if not session:
            return
        dead = set()
        for ws in list(session["connections"]):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.add(ws)
        for ws in dead:
            session["connections"].discard(ws)


# Singleton instance shared across the app
location_tracker = LocationTracker()
