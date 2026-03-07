import React, { useState, useEffect, useRef } from 'react';
import { searchPlaces } from '../../api/mappls.api';
import { MapPin, Search } from 'lucide-react';

interface LocationInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({ value, onChange, placeholder = 'Search location...', disabled, className }) => {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync external value
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (searchText: string) => {
        if (!searchText || searchText.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        // Check local cache
        const cacheKey = `loc_cache_${searchText.toLowerCase().trim()}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setSuggestions(parsed);
                setLoading(false);
                return;
            } catch (e) {
                // Ignore parsing error and fetch fresh
            }
        }

        // Fetch from API
        const results = await searchPlaces(searchText);
        if (results && results.length > 0) {
            setSuggestions(results);
            localStorage.setItem(cacheKey, JSON.stringify(results));
        } else {
            setSuggestions([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (isOpen && query !== value) {
                fetchSuggestions(query);
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [query, isOpen, value]);

    const handleSelect = (place: any) => {
        const selectedValue = place.placeName || place.placeAddress || query;
        onChange(selectedValue);
        setQuery(selectedValue);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        // Also proactively update the parent value so typing loose text works
                        onChange(e.target.value);
                    }}
                    onFocus={() => setIsOpen(true)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 ${className || ''}`}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>

            {isOpen && query.length >= 3 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-3 text-sm text-slate-500 text-center">Searching...</div>
                    ) : suggestions.length > 0 ? (
                        <ul className="py-1">
                            {suggestions.map((s, idx) => (
                                <li
                                    key={idx}
                                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-start gap-2"
                                    onClick={() => handleSelect(s)}
                                >
                                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="text-sm font-medium">{s.placeName}</div>
                                        {s.placeAddress && <div className="text-xs text-slate-500 line-clamp-1">{s.placeAddress}</div>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-3 text-sm text-slate-500 text-center">
                            No locations found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationInput;
