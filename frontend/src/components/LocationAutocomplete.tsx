// Declaração global para Google Maps API
declare global {
  interface Window {
    google: any;
  }
}
import * as React from "react";

// Google Places API autocomplete (client-side)
// You must add your Google Maps JS API key in public/index.html or via env
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>

export interface LocationAutocompleteProps {
  value: string;
  onSelect: (address: string, city?: string, state?: string) => void;
  placeholder?: string;
  className?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({ value, onSelect, placeholder, className }) => {
  const [googleLoaded, setGoogleLoaded] = React.useState(true);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || "");
  const autocompleteService = React.useRef<any>(null);
  const placesService = React.useRef<any>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      setGoogleLoaded(false);
      return;
    }
    setGoogleLoaded(true);
    if (!autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
    if (!placesService.current && inputRef.current) {
      const dummy = document.createElement("div");
      placesService.current = new window.google.maps.places.PlacesService(dummy);
    }
  }, []);

  const fetchSuggestions = (query: string) => {
    if (!autocompleteService.current || !query) return;
    setLoading(true);
    autocompleteService.current.getPlacePredictions({ input: query }, (results: any[]) => {
      setSuggestions(results || []);
      setLoading(false);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    fetchSuggestions(e.target.value);
  };

  const handleSelect = (suggestion: any) => {
    if (!placesService.current) return;
    placesService.current.getDetails({ placeId: suggestion.place_id }, (place: any, status: any) => {
      if (status === "OK" && place) {
        const address = place.formatted_address || suggestion.description;
        let city = "";
        let state = "";
        if (place.address_components) {
          for (const comp of place.address_components) {
            if (comp.types.includes("administrative_area_level_2")) city = comp.long_name;
            if (comp.types.includes("administrative_area_level_1")) state = comp.short_name;
          }
        }
        onSelect(address, city, state);
        setInputValue(address);
        setSuggestions([]);
      }
    });
  };

  return (
    <div className={"relative w-full " + (className || "") }>
      {!googleLoaded && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          Erro: Google Maps API não carregada. Verifique a chave, domínio autorizado e se a API Places está habilitada.
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        className="px-4 py-3 rounded-xl border border-[#E5E7EB] text-base text-[#091747] w-full"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder || "Localização"}
        autoComplete="off"
        disabled={!googleLoaded}
      />
      {loading && <div className="absolute left-0 right-0 top-full bg-white border border-[#E5E7EB] rounded-xl shadow p-2 text-sm">Carregando...</div>}
      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full bg-white border border-[#E5E7EB] rounded-xl shadow z-10 mt-1">
          {suggestions.map((s, idx) => (
            <button
              key={s.place_id}
              type="button"
              className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-[#F3F4FE] ${idx === 0 ? 'font-bold bg-[#3B5FFF] text-white' : 'text-[#091747]'}`}
              onClick={() => handleSelect(s)}
            >
              <span className="material-icons text-lg">{idx === 0 ? "location_on" : "place"}</span>
              <span>{s.description}</span>
            </button>
          ))}
          <div className="px-4 py-2 text-xs text-right text-[#A0AEC0]">powered by <span className="font-bold">Google</span></div>
        </div>
      )}
    </div>
  );
};
