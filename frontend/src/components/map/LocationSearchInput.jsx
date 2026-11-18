/**
 * LocationSearchInput — Nominatim-powered autocomplete input.
 * Props:
 *   placeholder: string
 *   value: string
 *   onChange: (displayName, lat, lon) => void
 *   icon: string (emoji or character)
 */
import { useState, useCallback, useRef } from 'react';
import { searchLocation, debounce } from '../../services/geocoding';

export default function LocationSearchInput({ placeholder, value, onChange, icon }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedSearch = useRef(
    debounce(async (q) => {
      if (!q || q.length < 3) { setSuggestions([]); return; }
      setLoading(true);
      const results = await searchLocation(q);
      setSuggestions(results);
      setOpen(results.length > 0);
      setLoading(false);
    }, 400)
  ).current;

  const handleChange = useCallback((e) => {
    const q = e.target.value;
    onChange(q, null, null);
    debouncedSearch(q);
  }, [onChange, debouncedSearch]);

  const handleSelect = useCallback((item) => {
    onChange(item.display_name, item.lat, item.lon);
    setSuggestions([]);
    setOpen(false);
  }, [onChange]);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-[9999] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto text-sm">
          {suggestions.map((item, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(item)}
              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-gray-700 border-b border-gray-100 last:border-0 leading-snug"
            >
              <span className="font-medium text-blue-700 mr-1">📍</span>
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
