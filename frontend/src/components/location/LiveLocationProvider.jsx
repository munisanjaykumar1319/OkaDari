/**
 * LiveLocationProvider — Rider-side live sharing controls
 * Props:
 *   rideId: number
 *   token: string (JWT)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation, Pause, Play, Square, Wifi, WifiOff } from 'lucide-react';

const API_BASE = '/api/v1/rides';
const UPDATE_INTERVAL_MS = 7000; // 7 seconds

export default function LiveLocationProvider({ rideId, token }) {
  const [status, setStatus] = useState('IDLE'); // IDLE | SHARING | PAUSED | ERROR
  const [lastUpdate, setLastUpdate] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const intervalRef = useRef(null);

  const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const callEndpoint = useCallback(async (action) => {
    const res = await fetch(`${API_BASE}/${rideId}/location/${action}`, {
      method: 'POST',
      headers: authHeader,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `${action} failed`);
    }
    return res.json();
  }, [rideId, token]);

  const pushLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await fetch(`${API_BASE}/${rideId}/location/update`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({ lat: coords.latitude, lon: coords.longitude, accuracy: coords.accuracy }),
          });
          setLastUpdate(new Date());
        } catch {
          // silent – will retry on next tick
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
    );
  }, [rideId, token]);

  const startSharing = useCallback(async () => {
    setErrorMsg('');
    // Request GPS permission first
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
      });
    } catch {
      setErrorMsg('GPS permission denied. Please allow location access and try again.');
      return;
    }
    try {
      await callEndpoint('start');
      setStatus('SHARING');
      intervalRef.current = setInterval(pushLocation, UPDATE_INTERVAL_MS);
      pushLocation(); // immediate first push
    } catch (e) {
      setErrorMsg(e.message);
    }
  }, [callEndpoint, pushLocation]);

  const pauseSharing = useCallback(async () => {
    clearInterval(intervalRef.current);
    try {
      await callEndpoint('pause');
      setStatus('PAUSED');
    } catch (e) {
      setErrorMsg(e.message);
    }
  }, [callEndpoint]);

  const resumeSharing = useCallback(async () => {
    try {
      await callEndpoint('resume');
      setStatus('SHARING');
      intervalRef.current = setInterval(pushLocation, UPDATE_INTERVAL_MS);
      pushLocation();
    } catch (e) {
      setErrorMsg(e.message);
    }
  }, [callEndpoint, pushLocation]);

  const stopSharing = useCallback(async () => {
    clearInterval(intervalRef.current);
    try {
      await callEndpoint('stop');
    } catch {
      // best-effort stop
    }
    setStatus('IDLE');
    setLastUpdate(null);
  }, [callEndpoint]);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const statusColors = {
    IDLE: 'bg-gray-100 text-gray-600',
    SHARING: 'bg-green-50 text-green-700 border-green-200',
    PAUSED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    ERROR: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={`rounded-2xl border p-5 ${statusColors[status]} transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {status === 'SHARING' ? (
            <Wifi className="w-5 h-5 text-green-600 animate-pulse" />
          ) : (
            <WifiOff className="w-5 h-5 text-gray-400" />
          )}
          <span className="font-bold text-sm">
            {status === 'IDLE' && 'Live Location Sharing'}
            {status === 'SHARING' && '🟢 Sharing Live Location'}
            {status === 'PAUSED' && '⏸ Sharing Paused'}
          </span>
        </div>
        {status === 'SHARING' && (
          <span className="text-xs font-semibold animate-pulse px-2 py-0.5 bg-green-100 text-green-700 rounded-full">LIVE</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {status === 'IDLE' && (
          <button
            onClick={startSharing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm transition"
            style={{ background: '#2563EB' }}
          >
            <Navigation className="w-4 h-4" />
            Start Sharing Location
          </button>
        )}
        {status === 'SHARING' && (
          <>
            <button
              onClick={pauseSharing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 text-white font-semibold text-sm"
            >
              <Pause className="w-4 h-4" /> Pause
            </button>
            <button
              onClick={stopSharing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
          </>
        )}
        {status === 'PAUSED' && (
          <>
            <button
              onClick={resumeSharing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white font-semibold text-sm"
            >
              <Play className="w-4 h-4" /> Resume
            </button>
            <button
              onClick={stopSharing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
          </>
        )}
      </div>

      {/* Meta info */}
      {lastUpdate && (
        <p className="text-xs mt-3 opacity-70">
          Last GPS push: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
      {errorMsg && (
        <p className="text-xs mt-2 text-red-600 font-medium">⚠️ {errorMsg}</p>
      )}
      {status === 'IDLE' && (
        <p className="text-xs mt-2 text-gray-500">
          Your location is only shared with passengers who have an accepted booking.
        </p>
      )}
    </div>
  );
}
