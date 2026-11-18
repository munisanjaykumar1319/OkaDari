/**
 * LiveLocationViewer — Passenger-side real-time tracking modal
 * Props:
 *   rideId: number
 *   token: string (JWT)
 *   onClose: () => void
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { X, Wifi, WifiOff } from 'lucide-react';
import L from 'leaflet';
import '../../services/mapConfig';

// Pulsing live rider marker
function createRiderIcon() {
  return L.divIcon({
    html: `
      <div style="position:relative;width:36px;height:36px;">
        <div style="
          position:absolute;inset:0;
          background:#2563EB;
          border-radius:50%;
          opacity:0.3;
          animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
        "></div>
        <div style="
          position:absolute;inset:6px;
          background:#2563EB;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(37,99,235,0.5);
          display:flex;align-items:center;justify-content:center;
          font-size:11px;
        ">🏍️</div>
      </div>
      <style>
        @keyframes ping{0%{transform:scale(1);opacity:.3}75%,100%{transform:scale(2);opacity:0}}
      </style>
    `,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function LiveMarker({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.panTo(position, { animate: true, duration: 0.5 });
  }, [position, map]);
  return position ? (
    <Marker position={position} icon={createRiderIcon()}>
      <Popup>🏍️ Rider is here</Popup>
    </Marker>
  ) : null;
}

export default function LiveLocationViewer({ rideId, token, onClose }) {
  const [riderPos, setRiderPos] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [wsStatus, setWsStatus] = useState('connecting'); // connecting | live | paused | stopped
  const [errorMsg, setErrorMsg] = useState('');
  const wsRef = useRef(null);
  const pingRef = useRef(null);

  // Default map center (Hyderabad) until first location arrives
  const [mapCenter] = useState([17.3850, 78.4867]);

  const connectWs = useCallback(() => {
    let host = window.location.host;
    let wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    if (import.meta.env.VITE_API_URL) {
      try {
        const url = new URL(import.meta.env.VITE_API_URL);
        host = url.host;
        wsProtocol = url.protocol === 'https:' ? 'wss' : 'ws';
      } catch (e) {
        // fallback
      }
    }
    const wsUrl = `${wsProtocol}://${host}/api/v1/rides/${rideId}/location/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connecting');
      // Start heartbeat
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'location') {
          setRiderPos([msg.lat, msg.lon]);
          setLastUpdated(new Date(msg.timestamp));
          setWsStatus('live');
        } else if (msg.type === 'paused') {
          setWsStatus('paused');
        } else if (msg.type === 'stopped') {
          setWsStatus('stopped');
        } else if (msg.type === 'status') {
          setWsStatus(msg.status === 'waiting' ? 'connecting' : msg.status);
        }
      } catch {
        // non-JSON pong response – ignore
      }
    };

    ws.onerror = () => {
      setErrorMsg('Connection error. The rider may not be sharing currently.');
      setWsStatus('stopped');
    };

    ws.onclose = (evt) => {
      clearInterval(pingRef.current);
      if (evt.code === 4403) {
        setErrorMsg('Access denied. Only passengers with an accepted booking can view live location.');
        setWsStatus('stopped');
      } else if (evt.code !== 1000) {
        setWsStatus('stopped');
      }
    };
  }, [rideId, token]);

  useEffect(() => {
    connectWs();
    return () => {
      clearInterval(pingRef.current);
      wsRef.current?.close(1000);
    };
  }, [connectWs]);

  const statusBadge = {
    connecting: { label: 'Connecting…', color: '#F59E0B', dot: '🟡' },
    live: { label: 'LIVE', color: '#16A34A', dot: '🟢' },
    paused: { label: 'Sharing Paused', color: '#D97706', dot: '⏸' },
    stopped: { label: 'Sharing Ended', color: '#DC2626', dot: '🔴' },
  }[wsStatus] || { label: 'Unknown', color: '#6B7280', dot: '⚫' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ background: '#14213D' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {wsStatus === 'live' ? (
                <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
              ) : (
                <WifiOff className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-bold text-white text-sm">Live Rider Tracking</span>
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ background: statusBadge.color }}
            >
              {statusBadge.dot} {statusBadge.label}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map */}
        <div style={{ height: '400px' }}>
          <MapContainer
            center={riderPos || mapCenter}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LiveMarker position={riderPos} />
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
          <div>
            {lastUpdated ? (
              <p className="text-xs text-gray-500">
                📡 Last update: <span className="font-semibold">{lastUpdated.toLocaleTimeString()}</span>
              </p>
            ) : (
              <p className="text-xs text-gray-400">Waiting for rider to share location…</p>
            )}
            {errorMsg && <p className="text-xs text-red-500 mt-1">⚠️ {errorMsg}</p>}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: '#2563EB' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
