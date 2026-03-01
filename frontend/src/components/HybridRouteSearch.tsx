import React, { useState, useEffect, useRef } from 'react';
import { searchRoutes } from '../api/route.api';
import { searchPlaces } from '../api/mappls.api';
import { MapPin, Route as RouteIcon, Loader2 } from 'lucide-react';

interface HybridRouteSearchProps {
    value?: string;
    onSelect: (address: string, data?: any) => void;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    className?: string;
    hqId?: string; // To filter local routes
    locationBias?: string; // For fallback map search
}

const HybridRouteSearch: React.FC<HybridRouteSearchProps> = ({
    value = '',
    onSelect,
    onChangeText,
    placeholder = "Search Route...",
    className = "",
    hqId,
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

    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleSearch = async (text: string) => {
        setQuery(text);
        if (onChangeText) {
            onChangeText(text); // Propagation for manual entry
        }

        if (text.length > 2) {
            setLoading(true);
            try {
                // 1. Search Local Routes First
                const localRoutes = await searchRoutes(text, hqId);

                if (localRoutes && localRoutes.length > 0) {
                    // Found local matches! Use them.
                    const formatted = localRoutes.map((r: any) => ({
                        type: 'route',
                        label: r.name,
                        value: r.name, // Or code? Assuming name is what user wants
                        id: r._id
                    }));
                    setSuggestions(formatted);
                    setIsOpen(true);
                } else {
                    // 2. No local match? Call MapmyIndia API
                    const remotePlaces = await searchPlaces(text, locationBias);

                    if (remotePlaces && Array.isArray(remotePlaces)) {
                        const formatted = remotePlaces.map((p: any) => ({
                            type: 'place',
                            label: p.placeName,
                            subLabel: p.placeAddress,
                            eLoc: p.eLoc,
                            value: `${p.placeName}, ${p.placeAddress}`
                        }));
                        setSuggestions(formatted);
                        setIsOpen(true);
                    } else {
                        setSuggestions([]);
                        setIsOpen(false);
                    }
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

    const handleSelectSuggestion = (s: any) => {
        const selectedValue = s.value;
        setQuery(selectedValue);
        if (onChangeText) {
            onChangeText(selectedValue);
        }
        setIsOpen(false);
        onSelect(selectedValue, s);
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full border p-2 rounded pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground border-input"
                />
                <div className="absolute left-2 top-2.5">
                    {loading ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                        <RouteIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-popover text-popover-foreground border border-border rounded shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {suggestions.map((s, idx) => (
                        <li
                            key={idx}
                            onClick={() => handleSelectSuggestion(s)}
                            className="p-2 hover:bg-muted cursor-pointer text-sm border-b border-border last:border-0 flex items-center gap-2"
                        >
                            {s.type === 'route' ? (
                                <RouteIcon className="h-4 w-4 text-blue-500" />
                            ) : (
                                <MapPin className="h-4 w-4 text-red-500" />
                            )}

                            <div>
                                <div className="font-medium text-foreground">{s.label}</div>
                                {s.subLabel && <div className="text-xs text-muted-foreground truncate">{s.subLabel}</div>}
                                {s.type === 'route' && <div className="text-[10px] text-blue-400">Existing Route</div>}
                            </div>
                        </li>
                    ))}
                    <div className="p-1 px-2 text-[10px] text-right text-muted-foreground bg-muted/50 border-t border-border">
                        {suggestions[0]?.type === 'route' ? 'Local Routes' : 'MapmyIndia'}
                    </div>
                </ul>
            )}
        </div>
    );
};

export default HybridRouteSearch;
