'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import { Map, useControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FDIRecord, getBilateralDetail } from './capitalLoader';
import { iso2ToCountry } from '@/utils/ISO2Country';

const INITIAL_VIEW_STATE = {
    longitude: 10,
    latitude: 50,
    zoom: 3,
    pitch: 0,
    bearing: 0,
};

function fmt(v: number | null | undefined): string {
    if (v == null) return 'N/A';
    const abs = Math.abs(v);
    if (abs >= 1000) return `€${(v / 1000).toFixed(1)}B`;
    return `€${v.toFixed(0)}M`;
}

function NetBadge({ value }: { value: number | null }) {
    if (value == null) return <span className="text-gray-400">N/A</span>;
    const positive = value >= 0;
    return (
        <span className={`font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {positive ? '+' : ''}{fmt(value)}
        </span>
    );
}

interface HoverState {
    countryCode: string;
    x: number;
    y: number;
}

export default function CapitalMap({
    allRecords,
    selectedCountry,
    setSelectedCountry,
    year,
    mapStyle = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    setMapStyle,
}: {
    allRecords: FDIRecord[];
    selectedCountry: string;
    setSelectedCountry: (code: string) => void;
    year: number;
    mapStyle?: string;
    setMapStyle?: (style: string) => void;
}) {
    const [geoData, setGeoData] = useState<any | null>(null);
    const [hover, setHover] = useState<HoverState | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/data/europe.geojson')
            .then(res => res.json())
            .then(setGeoData)
            .catch(console.error);
    }, []);

    const DeckGLOverlay = useCallback((props: MapboxOverlayProps) => {
        const overlayRef = useRef<MapboxOverlay | null>(null);
        useControl(() => {
            if (!overlayRef.current) {
                overlayRef.current = new MapboxOverlay({ interleaved: false });
            }
            return overlayRef.current;
        });
        overlayRef.current?.setProps(props);
        return null;
    }, []);

    // Compute per-country net position for choropleth fill
    const netPositionByCountry = useMemo(() => {
        const map: Record<string, number> = {};
        allRecords
            .filter(r => r.year === year)
            .forEach(r => {
                if (r.position_mio_eur == null) return;
                if (r.investor === selectedCountry) {
                    map[r.host] = (map[r.host] ?? 0) + r.position_mio_eur;
                }
                if (r.host === selectedCountry) {
                    map[r.investor] = (map[r.investor] ?? 0) - r.position_mio_eur;
                }
            });
        return map;
    }, [allRecords, selectedCountry, year]);

    const maxAbsPosition = useMemo(() => {
        const vals = Object.values(netPositionByCountry).map(Math.abs);
        return vals.length > 0 ? Math.max(...vals) : 1;
    }, [netPositionByCountry]);

    const countryShapesLayer = useMemo(() => geoData && new GeoJsonLayer({
        id: `capital-countries-${selectedCountry}-${year}`,
        data: geoData,
        pickable: true,
        stroked: true,
        filled: true,
        getLineColor: d => {
            if (d.properties?.ISO2 === selectedCountry) return [255, 255, 0, 255];
            return [255, 255, 255, 60];
        },
        getFillColor: d => {
            const code = d.properties?.ISO2;
            if (code === selectedCountry) return [255, 255, 0, 50];
            const net = netPositionByCountry[code];
            if (net == null) return [80, 80, 80, 20];
            const t = Math.min(Math.abs(net) / maxAbsPosition, 1);
            const alpha = Math.round(30 + t * 120);
            if (net > 0) return [16, 185, 129, alpha];   // green: selected country is net investor here
            return [239, 68, 68, alpha];                  // red: that country invests more in selected
        },
        lineWidthMinPixels: 1,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 40],
        onClick: ({ object }) => {
            if (object?.properties?.ISO2) setSelectedCountry(object.properties.ISO2);
        },
        onHover: ({ object, x, y }) => {
            const code = object?.properties?.ISO2;
            if (code && code !== selectedCountry) {
                setHover({ countryCode: code, x, y });
            } else {
                setHover(null);
            }
        },
    }), [geoData, selectedCountry, year, netPositionByCountry, maxAbsPosition, setSelectedCountry]);

    const layers = useMemo(() => [countryShapesLayer].filter(Boolean), [countryShapesLayer]);

    // Build tooltip content from hover state
    const tooltipData = useMemo(() => {
        if (!hover) return null;
        return getBilateralDetail(allRecords, selectedCountry, hover.countryCode, year);
    }, [hover, allRecords, selectedCountry, year]);

    const styleOptions = [
        { value: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', label: 'Dark Matter', color: '#3b4252' },
        { value: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', label: 'Positron', color: '#e2e8f0' },
        { value: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', label: 'Voyager', color: '#b6c6e3' },
    ];

    return (
        <div ref={mapContainerRef} style={{ width: '100%', height: '100vh', position: 'relative' }}>
            {/* Map style switcher */}
            {setMapStyle && (
                <div className="absolute top-4 left-4 z-20 flex flex-row gap-2 bg-gray-900 bg-opacity-90 rounded-full shadow-lg p-1 border border-gray-800" style={{ backdropFilter: 'blur(4px)' }}>
                    {styleOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setMapStyle(opt.value)}
                            title={opt.label}
                            className={`flex items-center justify-center rounded-full border-2 transition-all h-10 w-10 bg-gray-900 ${mapStyle === opt.value ? 'border-emerald-400 shadow-md' : 'border-transparent hover:border-emerald-300'}`}
                        >
                            <span className="w-7 h-7 rounded block" style={{ background: opt.color }} />
                        </button>
                    ))}
                </div>
            )}

            {/* Legend */}
            <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-85 rounded-xl p-3 text-white text-xs z-10 space-y-2 border border-gray-700" style={{ backdropFilter: 'blur(4px)' }}>
                <p className="font-semibold text-gray-300 mb-1">FDI Positions</p>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span>Outward (you invest abroad)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <span>Inward (others invest in you)</span>
                </div>
                <div className="border-t border-gray-700 pt-2 space-y-1">
                    <p className="font-semibold text-gray-300">Country shade</p>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-emerald-500" />
                        <span>You are net investor</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500" />
                        <span>They are net investor</span>
                    </div>
                </div>
                <p className="text-gray-500 text-xs pt-1">Line thickness = position size<br />Hover a country for details</p>
            </div>

            {/* Rich bilateral tooltip */}
            {hover && tooltipData && (
                <div
                    className="absolute z-30 pointer-events-none"
                    style={{
                        left: hover.x + 16,
                        top: hover.y - 8,
                        maxWidth: 280,
                    }}
                >
                    <div className="bg-gray-900 border border-gray-600 rounded-xl shadow-2xl p-4 text-xs text-white space-y-3" style={{ backdropFilter: 'blur(8px)' }}>
                        {/* Header */}
                        <div className="font-semibold text-sm text-white border-b border-gray-700 pb-2">
                            {iso2ToCountry(selectedCountry)} ↔ {iso2ToCountry(hover.countryCode)}
                        </div>

                        {/* Investment Positions */}
                        <div>
                            <p className="text-gray-400 font-medium mb-1 uppercase tracking-wide text-xs">Investment Positions</p>
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-300">{iso2ToCountry(selectedCountry)} → {iso2ToCountry(hover.countryCode)}</span>
                                    <span className="text-emerald-400 font-medium">
                                        {fmt(tooltipData.selectedInOther?.position_mio_eur ?? null)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-300">{iso2ToCountry(hover.countryCode)} → {iso2ToCountry(selectedCountry)}</span>
                                    <span className="text-amber-400 font-medium">
                                        {fmt(tooltipData.otherInSelected?.position_mio_eur ?? null)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-gray-700 pt-1">
                                    <span className="text-gray-400">Net ({iso2ToCountry(selectedCountry)})</span>
                                    <NetBadge value={tooltipData.netPosition} />
                                </div>
                            </div>
                        </div>

                        {/* Annual Income */}
                        <div>
                            <p className="text-gray-400 font-medium mb-1 uppercase tracking-wide text-xs">Annual Income</p>
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-300">{iso2ToCountry(selectedCountry)} earns</span>
                                    <span className="text-emerald-400 font-medium">
                                        {fmt(tooltipData.selectedInOther?.income_mio_eur ?? null)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-300">{iso2ToCountry(hover.countryCode)} earns</span>
                                    <span className="text-amber-400 font-medium">
                                        {fmt(tooltipData.otherInSelected?.income_mio_eur ?? null)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-gray-700 pt-1">
                                    <span className="text-gray-400">Net income ({iso2ToCountry(selectedCountry)})</span>
                                    <NetBadge value={tooltipData.netIncome} />
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-500 text-xs pt-1 border-t border-gray-800 mt-1">
                            Positions reflect immediate counterpart only. Routing via Luxembourg and Netherlands may understate bilateral exposure. Income flows are a more direct measure.
                        </p>
                        <p className="text-gray-600 text-xs">Click to select country</p>
                    </div>
                </div>
            )}

            <Map
                initialViewState={INITIAL_VIEW_STATE}
                mapStyle={mapStyle}
                style={{ width: '100%', height: '100%' }}
            >
                <DeckGLOverlay layers={layers} />
            </Map>
        </div>
    );
}
