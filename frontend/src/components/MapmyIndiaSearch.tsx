import React, { useState, useEffect, useRef } from 'react';
import { searchPlaces, getPlaceDetails } from '../api/mappls.api';
import { MapPin, Loader2 } from 'lucide-react';

interface Suggestion {
    placeName: string;
    placeAddress: string;
    eLoc: string;
}

interface MapmyIndiaSearchProps {
    value?: string;
    onSelect: (address: string, lat?: number, lng?: number, eLoc?: string) => void;
    placeholder?: string;
    className?: string;
    locationBias?: string; // "lat,lng"
}

const MapmyIndiaSearch: React.FC<MapmyIndiaSearchProps> = ({
    value = '',
    onSelect,
    placeholder = "Search location...",
    className = "",
    locationBias
}) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync external value
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSearch = async (text: string) => {
        setQuery(text);
        // Only search if user typed > 2 chars
        if (text.length > 2) {
            setLoading(true);
            try {
                // Pass locationBias if available
                const results = await searchPlaces(text, locationBias);
                if (results && Array.isArray(results)) {
                    setSuggestions(results);
                    setIsOpen(true);
                } else {
                    setSuggestions([]);
                    setIsOpen(false);
                }
            } catch (err) {
                console.error(err);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = async (suggestion: Suggestion) => {
        const fullAddress = `${suggestion.placeName}, ${suggestion.placeAddress}`;
        setQuery(fullAddress);
        setIsOpen(false);
        setLoading(true);

        try {
            // Get Coords
            const details = await getPlaceDetails(suggestion.eLoc, fullAddress);
            console.log('Place Details:', details); // Debug Log

            if (details) {
                const lat = details.latitude || details.lat || (details.geometry?.location?.lat); // Try multiple formats
                const lng = details.longitude || details.lng || (details.geometry?.location?.lng);

                console.log('Extracted Lat/Lng:', lat, lng); // Debug Log

                let finalAddress = fullAddress;
                if (details.digipin) {
                    finalAddress += ` (DigiPin: ${details.digipin})`;
                }

                onSelect(finalAddress, lat, lng, suggestion.eLoc);
            } else {
                // Fallback if details fail, just return string
                onSelect(fullAddress);
            }
        } catch (e) {
            console.error(e);
            onSelect(fullAddress);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={placeholder}
                    className="w-full border p-2 rounded pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                {loading && (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 text-primary animate-spin" />
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border rounded shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {suggestions.map((s) => (
                        <li
                            key={s.eLoc}
                            onClick={() => handleSelect(s)}
                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-0"
                        >
                            <div className="font-medium">{s.placeName}</div>
                            <div className="text-xs text-gray-500 truncate">{s.placeAddress}</div>
                        </li>
                    ))}
                    <div className="p-1 px-2 text-[10px] text-right text-gray-400 bg-gray-50">
                        Powered by MapmyIndia
                    </div>
                </ul>
            )}
        </div>
    );
};

export default MapmyIndiaSearch;
