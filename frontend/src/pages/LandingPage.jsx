/**
 * OkaDari – Landing Page with Interactive Map
 * "One Route. One Ride. Shared Journey."
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import {
  Bike, ArrowRight, ShieldCheck, Percent, Leaf, Sparkles,
  Navigation, Search, ChevronRight
} from 'lucide-react';
import { getCurrentLocation, reverseGeocode } from '../services/geocoding';
import { getRoute } from '../services/routing';
import LocationSearchInput from '../components/map/LocationSearchInput';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import '../services/mapConfig'; // Leaflet icon fix
import { PICKUP_ICON, DESTINATION_ICON, RIDE_ICON } from '../services/mapConfig';

// Default map center: Hyderabad
const DEFAULT_CENTER = [17.3850, 78.4867];
const DEFAULT_ZOOM = 12;

/** Recenter map when center changes */
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || DEFAULT_ZOOM);
  }, [center, zoom, map]);
  return null;
}

export default function LandingPage() {
  const navigate = useNavigate();

  // Location state
  const [pickup, setPickup] = useState({ name: '', lat: null, lon: null });
  const [destination, setDestination] = useState({ name: '', lat: null, lon: null });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Route state
  const [routeCoords, setRouteCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  // Map state
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);

  // Nearby rides (from API)
  const [nearbyRides, setNearbyRides] = useState([]);

  /** Detect current GPS location */
  const handleUseMyLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const { lat, lon } = await getCurrentLocation();
      setCurrentLocation({ lat, lon });
      setMapCenter([lat, lon]);
      const name = await reverseGeocode(lat, lon);
      setPickup({ name: name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon });
    } catch (err) {
      setLocationError('Could not get location. Please allow GPS access.');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  /** Draw route whenever pickup + destination are both set */
  useEffect(() => {
    if (pickup.lat && pickup.lon && destination.lat && destination.lon) {
      getRoute(pickup.lat, pickup.lon, destination.lat, destination.lon).then((result) => {
        if (result) {
          setRouteCoords(result.geojson.coordinates.map(([lng, lt]) => [lt, lng]));
          setRouteInfo(result);
          // Recenter between pickup and destination
          setMapCenter([
            (pickup.lat + destination.lat) / 2,
            (pickup.lon + destination.lon) / 2,
          ]);
        }
      });
    } else {
      setRouteCoords(null);
      setRouteInfo(null);
    }
  }, [pickup, destination]);

  /** Fetch nearby rides from backend */
  useEffect(() => {
    axios.get('/api/v1/rides/search?limit=6')
      .then((res) => setNearbyRides(Array.isArray(res.data) ? res.data.slice(0, 6) : []))
      .catch(() => {});
  }, []);

  const handleFindRide = () => {
    const params = new URLSearchParams();
    if (pickup.name) params.set('from', pickup.name);
    if (destination.name) params.set('to', destination.name);
    if (pickup.lat) params.set('originLat', pickup.lat);
    if (pickup.lon) params.set('originLon', pickup.lon);
    if (destination.lat) params.set('destLat', destination.lat);
    if (destination.lon) params.set('destLon', destination.lon);
    navigate(`/find?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#EFF6FF]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ─── Hero Header ─── */}
      <section className="bg-[#14213D] text-white py-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Route Matching · Live GPS Tracking
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            <span className="text-white">Oka</span>
            <span style={{ color: '#2563EB' }}>Dari</span>
          </h1>
          <p className="mt-3 text-blue-200 text-base sm:text-lg font-medium tracking-wide">
            One Route. One Ride. Shared Journey.
          </p>
          <p className="mt-2 text-slate-400 text-sm max-w-xl mx-auto">
            India's smartest two-wheeler ride-sharing platform. Connect with verified commuters on your exact route and split fuel costs fairly.
          </p>
        </div>
      </section>

      {/* ─── Main Map Section ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-blue-100">
          {/* Search controls above the map */}
          <div className="bg-white px-6 py-5 border-b border-blue-50">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
              {/* Use My Location Button */}
              <button
                onClick={handleUseMyLocation}
                disabled={locationLoading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shrink-0"
                style={{ background: locationLoading ? '#93C5FD' : '#2563EB' }}
              >
                <Navigation className="w-4 h-4" />
                {locationLoading ? 'Detecting…' : '📍 Use My Location'}
              </button>

              {/* Pickup Input */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">PICKUP</label>
                <LocationSearchInput
                  placeholder="Pickup point (e.g. Hitech City)"
                  value={pickup.name}
                  onChange={(name, lat, lon) => setPickup({ name, lat, lon })}
                  icon="🔵"
                />
              </div>

              {/* Destination Input */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">DESTINATION</label>
                <LocationSearchInput
                  placeholder="Where to? (e.g. Charminar)"
                  value={destination.name}
                  onChange={(name, lat, lon) => setDestination({ name, lat, lon })}
                  icon="🔴"
                />
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleFindRide}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:shadow-lg"
                  style={{ background: '#2563EB' }}
                >
                  <Search className="w-4 h-4" /> Find a Ride
                </button>
                <button
                  onClick={() => navigate('/offer')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all hover:bg-blue-50"
                  style={{ borderColor: '#2563EB', color: '#2563EB' }}
                >
                  <Bike className="w-4 h-4" /> Offer a Ride
                </button>
              </div>
            </div>

            {/* Location error */}
            {locationError && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                ⚠️ {locationError}
              </p>
            )}

            {/* Route info badge */}
            {routeInfo && (
              <div className="mt-3 inline-flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#2563EB' }}>
                <span>🗺️ {routeInfo.distanceKm} km</span>
                <span className="opacity-60">|</span>
                <span>⏱ {routeInfo.durationMins} min</span>
              </div>
            )}
          </div>

          {/* The Map */}
          <div style={{ height: '480px', position: 'relative' }}>
            <MapContainer
              center={mapCenter}
              zoom={DEFAULT_ZOOM}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap center={mapCenter} />

              {/* Pickup marker */}
              {pickup.lat && pickup.lon && (
                <Marker position={[pickup.lat, pickup.lon]} icon={PICKUP_ICON}>
                  <Popup>
                    <div className="text-sm font-semibold">📍 Pickup</div>
                    <div className="text-xs text-gray-600 mt-1">{pickup.name}</div>
                  </Popup>
                </Marker>
              )}

              {/* Destination marker */}
              {destination.lat && destination.lon && (
                <Marker position={[destination.lat, destination.lon]} icon={DESTINATION_ICON}>
                  <Popup>
                    <div className="text-sm font-semibold">🏁 Destination</div>
                    <div className="text-xs text-gray-600 mt-1">{destination.name}</div>
                  </Popup>
                </Marker>
              )}

              {/* Route polyline */}
              {routeCoords && (
                <Polyline
                  positions={routeCoords}
                  color="#2563EB"
                  weight={5}
                  opacity={0.85}
                />
              )}

              {/* Nearby ride markers */}
              {nearbyRides.map((ride) =>
                ride.origin_lat && ride.origin_lon ? (
                  <Marker
                    key={ride.id}
                    position={[ride.origin_lat, ride.origin_lon]}
                    icon={RIDE_ICON}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-bold text-blue-700">{ride.origin} → {ride.destination}</div>
                        <div className="text-xs text-gray-600 mt-1">₹{ride.cost_per_seat}/seat · {ride.available_seats} seat(s)</div>
                        <button
                          onClick={() => navigate('/find')}
                          className="mt-2 w-full py-1 text-xs font-bold text-white rounded-lg"
                          style={{ background: '#2563EB' }}
                        >
                          View Ride
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              )}
            </MapContainer>
          </div>
        </div>
      </section>

      {/* ─── Stats Row ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Rides Shared', value: '12,400+', icon: '🏍️' },
            { label: 'Avg Cost Saved', value: '₹850/mo', icon: '💰' },
            { label: 'CO₂ Reduced', value: '4.2 Tons', icon: '🌿' },
            { label: 'Verified Riders', value: '3,200+', icon: '✅' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-blue-50 hover:shadow-md transition">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{ color: '#2563EB' }}>{s.value}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Nearby Rides Cards ─── */}
      {nearbyRides.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#14213D' }}>
                Available Rides Near You
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Live rides from verified providers</p>
            </div>
            <button
              onClick={() => navigate('/find')}
              className="flex items-center gap-1 text-sm font-semibold hover:underline"
              style={{ color: '#2563EB' }}
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nearbyRides.slice(0, 3).map((ride) => (
              <div key={ride.id} className="bg-white rounded-2xl p-5 shadow-sm border border-blue-50 hover:shadow-md transition cursor-pointer" onClick={() => navigate('/find')}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#2563EB' }}>
                    OPEN
                  </span>
                  <span className="text-lg font-black" style={{ color: '#2563EB' }}>₹{ride.cost_per_seat}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">🔵</span>
                    <div>
                      <div className="text-xs text-gray-400">From</div>
                      <div className="font-semibold text-gray-800 text-xs leading-snug">{ride.origin}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">🔴</span>
                    <div>
                      <div className="text-xs text-gray-400">To</div>
                      <div className="font-semibold text-gray-800 text-xs leading-snug">{ride.destination}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span>🏍️ {ride.bike_model || 'Bike'}</span>
                  <span>{ride.available_seats} seat(s) left</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── How It Works ─── */}
      <section className="bg-[#14213D] py-16 px-4 mt-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">Simple 3-Step Flow</span>
          <h2 className="text-3xl font-black text-white mt-3 mb-10">How OkaDari Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Find or Offer a Route', desc: 'Riders list their daily route. Passengers search by origin & destination. Maps show the exact path.', color: '#2563EB' },
              { step: '02', title: 'Smart Match & Book', desc: 'AI scores route overlap, timing, and rider ratings to surface the best match for your commute.', color: '#3B82F6' },
              { step: '03', title: 'Ride & Track Live', desc: 'Rider shares live GPS. Passenger tracks the bike in real-time. Cost is split fairly — no commission.', color: '#60A5FA' },
            ].map((s) => (
              <div key={s.step} className="bg-white/5 border border-white/10 rounded-2xl p-7 text-left hover:bg-white/10 transition">
                <div className="text-3xl font-black mb-3" style={{ color: s.color }}>{s.step}</div>
                <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="rounded-3xl p-10 text-center border-2" style={{ background: '#EFF6FF', borderColor: '#2563EB' }}>
          <h2 className="text-3xl font-black mb-3" style={{ color: '#14213D' }}>
            Start Sharing Today
          </h2>
          <p className="text-gray-600 mb-7 max-w-lg mx-auto text-sm">
            Join thousands of commuters who've cut their monthly fuel spend by up to 60% — while making the city a little greener.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/find')}
              className="px-8 py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all"
              style={{ background: '#2563EB' }}
            >
              🔍 Find a Ride
            </button>
            <button
              onClick={() => navigate('/offer')}
              className="px-8 py-3 rounded-xl font-bold text-sm border-2 hover:bg-blue-50 transition-all"
              style={{ borderColor: '#2563EB', color: '#2563EB' }}
            >
              🏍️ Offer a Ride
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
