// Address Autocomplete using backend proxy (bypasses CORS)
import * as React from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { fetchApi } from "../lib/apiBase";

export interface LocationAutocompleteProps {
  value: string;
  onSelect: (address: string, city?: string, state?: string) => void;
  placeholder?: string;
  className?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onSelect,
  placeholder,
  className
}) => {
  const [suggestions, setSuggestions] = React.useState<NominatimResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || "");
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use backend proxy to bypass CORS
      const res = await fetchApi(`/api/geocode/search?q=${encodeURIComponent(query)}`);

      if (!res || !res.ok) {
        setError('Erro ao buscar endereço');
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      const data: NominatimResult[] = await res.json();

      if (data && data.length > 0) {
        setSuggestions(data);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    } catch (err: any) {
      // no-op
      setError('Erro ao buscar');
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Debounce API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 500);
  };

  const getCity = (addr: NominatimResult['address']) => {
    return addr.city || addr.town || addr.village || addr.municipality || '';
  };

  // Map Brazilian state names to UF abbreviations
  const stateToUf: Record<string, string> = {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
    'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
    'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
    'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
    'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
    'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
    'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO'
  };

  const getStateUf = (stateName: string): string => {
    // If already a 2-letter abbreviation, return as-is
    if (/^[A-Z]{2}$/.test(stateName)) return stateName;
    // Try to find in mapping
    return stateToUf[stateName] || stateName;
  };

  const handleSelect = (result: NominatimResult) => {
    const addr = result.address;
    const city = getCity(addr);
    const stateRaw = addr.state || '';
    const stateUf = getStateUf(stateRaw);

    // Build clean address: venue name (if exists) + city + state
    // Priority: name from result, then road with number, then suburb
    let venueName = '';

    // Check if the search was for a named place (like "Marina Park")
    // Named places usually have a 'name' or specific 'amenity' in the display_name
    const displayParts = result.display_name.split(',').map(s => s.trim());
    const firstPart = displayParts[0];

    // If first part is not just a street address (contains name-like text)
    // Check if it's a venue/place name vs street address
    const isStreetAddress = /^\d+$/.test(firstPart) ||
      /^(rua|avenida|av\.|r\.|alameda|travessa|praça|estrada)/i.test(firstPart);

    if (!isStreetAddress && firstPart) {
      // This is likely a venue/place name
      venueName = firstPart;
    } else if (addr.road) {
      // It's a street address - we'll just use city + state
      venueName = '';
    }

    // Preserve the complete geocoder result so the map never loses street or number.
    const cleanAddress = result.display_name || [venueName, city, stateUf].filter(Boolean).join(', ');


    setInputValue(cleanAddress);
    setSuggestions([]);
    setShowDropdown(false);
    onSelect(cleanAddress, city, stateUf);
  };

  return (
    <div ref={containerRef} className={"relative " + (className || "")} style={{ zIndex: 10 }}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          className="pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-[#1F1F1F] text-base text-gray-900 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder || "Digite o endereço..."}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 animate-spin" />
        )}
      </div>

      {error && (
        <div className="text-xs text-red-500 mt-1">{error}</div>
      )}

      {/* Dropdown de sugestões */}
      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            marginTop: '4px'
          }}
          className="bg-white dark:bg-[#242424] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
        >
          {suggestions.map((s, idx) => (
            <button
              key={s.place_id}
              type="button"
              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors ${idx !== suggestions.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''} ${idx === 0 ? "bg-indigo-50/70 dark:bg-indigo-900/20" : ""}`}
              onClick={() => handleSelect(s)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <MapPin className={`w-4 h-4 flex-shrink-0 mt-1 ${idx === 0 ? "text-indigo-600" : "text-gray-400"}`} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm leading-snug ${idx === 0 ? "text-indigo-700 dark:text-indigo-300 font-medium" : "text-gray-800 dark:text-white"}`}>
                  {s.display_name.length > 80 ? s.display_name.slice(0, 80) + '...' : s.display_name}
                </div>
                {(getCity(s.address) || s.address.state) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    📍 {[getCity(s.address), s.address.state].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </button>
          ))}
          <div className="px-4 py-2 text-[11px] text-gray-400 bg-gray-50 dark:bg-[#1a1a1a]">
            Dados: OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
};
