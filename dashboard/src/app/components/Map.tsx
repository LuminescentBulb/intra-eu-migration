'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, ArcLayer } from '@deck.gl/layers';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import { Map, useControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PickingInfo } from 'deck.gl';

const INITIAL_VIEW_STATE = {
  longitude: 10,
  latitude: 50,
  zoom: 3,
  pitch: 0,
  bearing: 0,
};

export default function MigrationMap({
  data,
  setSelectedCountry,
  selectedCountry,
  mapStyle = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  setMapStyle,
}: {
  data: any[];
  setSelectedCountry: (code: string) => void;
  selectedCountry: string;
  mapStyle?: string;
  setMapStyle?: (style: string) => void;
}) {
  const [geoData, setGeoData] = useState<any | null>(null);
  const [hoverInfo, setHoverInfo] = useState<any | null>(null);

  useEffect(() => {
    fetch('/data/europe.geojson')
      .then(res => res.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  // Memoize DeckGLOverlay instance to avoid recreation
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

  // Process data to highlight top flows and selected country flows
  const annotatedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    // Sort by absolute value for top flows
    const sorted = [...data].sort((a, b) => b.absValue - a.absValue);
    
    return sorted.map((d, i) => ({ 
      ...d, 
      isTop: i < 10,
      isSelected: d.sourceName === selectedCountry || d.targetName === selectedCountry
    }));
  }, [data, selectedCountry]);

  // Memoize layers to avoid unnecessary recreation
  const arcLayer = useMemo(() => new ArcLayer({
    id: 'migration-arcs',
    data: annotatedData,
    pickable: true,
    getSourcePosition: d => d.source,
    getTargetPosition: d => d.target,
    getSourceColor: d => {
      if (d.direction === 'outflow') {
        return d.isTop ? [255, 100, 100, 200] : [255, 100, 100, 120];
      } else {
        return d.isTop ? [100, 150, 255, 200] : [100, 150, 255, 120];
      }
    },
    getTargetColor: d => {
      if (d.direction === 'outflow') {
        return d.isTop ? [255, 50, 50, 200] : [255, 50, 50, 120];
      } else {
        return d.isTop ? [50, 200, 255, 200] : [50, 200, 255, 120];
      }
    },
    getWidth: d => {
      const baseWidth = Math.max(1, Math.sqrt(d.absValue) / 20);
      if (d.isTop) return baseWidth * 1.5;
      return baseWidth;
    },
    getHeight: d => d.isTop ? 0.3 : 0.1,
    getTilt: d => d.isTop ? 30 : 0,
  }), [annotatedData]);

  const countryShapesLayer = useMemo(() => geoData && new GeoJsonLayer({
    id: `country-shapes-${selectedCountry}`,
    data: geoData,
    pickable: true,
    stroked: true,
    filled: true,
    getLineColor: d => {
      if (d.properties?.ISO2 === selectedCountry) return [255, 255, 0, 255];
      return [255, 255, 255, 100];
    },
    getFillColor: d => {
      if (d.properties?.ISO2 === selectedCountry) return [255, 255, 0, 40];
      return [100, 100, 100, 20];
    },
    lineWidthMinPixels: 1,
    autoHighlight: true,
    onClick: ({ object }) => {
      if (object?.properties?.ISO2) {
        setSelectedCountry(object.properties.ISO2);
      }
    },
    getTooltip: ({ object }: { object: any }) =>
      object && `${object.properties.NAME} (${object.properties.ISO3})`,
  }), [geoData, selectedCountry, setSelectedCountry]);

  const layers = useMemo(() => [countryShapesLayer, arcLayer].filter(Boolean), [countryShapesLayer, arcLayer]);

  // WebGL context loss handler for Safari
  useEffect(() => {
    // Find the canvas element used by MapLibre GL
    const mapCanvas = document.querySelector('.maplibregl-canvas');
    if (!mapCanvas) return;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      // Optionally, show a message or reload the page
      // For now, reload the map container
      window.location.reload();
    };
    mapCanvas.addEventListener('webglcontextlost', handleContextLost, false);
    return () => {
      mapCanvas.removeEventListener('webglcontextlost', handleContextLost);
    };
  }, []);

  // Map style options
  // SVG icons for each style
  const styleOptions = [
    {
      value: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      label: 'Dark Matter',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" className="rounded" style={{ display: 'block' }}>
          <rect x="4" y="4" width="20" height="20" rx="4" fill="#3b4252" />
        </svg>
      ),
    },
    {
      value: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      label: 'Positron',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" className="rounded" style={{ display: 'block' }}>
          <rect x="4" y="4" width="20" height="20" rx="4" fill="#e2e8f0" />
        </svg>
      ),
    },
    {
      value: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      label: 'Voyager',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" className="rounded" style={{ display: 'block' }}>
          <rect x="4" y="4" width="20" height="20" rx="4" fill="#b6c6e3" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Map Style Overlay */}
      {setMapStyle && (
        <div className="absolute top-4 left-4 z-20 flex flex-row gap-2 bg-gray-900 bg-opacity-90 text-white rounded-full shadow-lg p-1 border border-gray-800" style={{ backdropFilter: 'blur(4px)' }}>
          {styleOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMapStyle(opt.value)}
              className={`flex items-center justify-center rounded-full border-2 transition-all focus:outline-none h-10 w-10 bg-gray-900 ${
                mapStyle === opt.value
                  ? 'border-blue-400 shadow-md'
                  : 'border-transparent hover:border-blue-300'
              }`}
              aria-pressed={mapStyle === opt.value}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-80 rounded-lg p-3 text-white text-xs z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span>Outflows (from selected country)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span>Inflows (to selected country)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Selected Country</span>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Line thickness indicates flow size
          </div>
        </div>
      </div>

      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay
          layers={layers}
          getTooltip={({ object }: PickingInfo<any>) => {
            if (object?.sourceName && object?.targetName) {
              // Arrow direction: → for outflow (people leaving), ← for inflow (people coming)
              let arrow = "";
              let source = object.sourceName;
              let target = object.targetName;
              if (object.direction === 'outflow') {
                arrow = '→';
              }
              else {
                arrow = '←';
                source = object.targetName;
                target = object.sourceName;
              }
              const absValue = Math.abs(object.value);
              
              return `${source} ${arrow} ${target}\n${absValue.toLocaleString()} people (${object.direction})`;
            }
            else if (object?.properties?.NAME) {
              return `${object.properties.NAME}\nClick to select`;
            }
            else {
              return null;
            }
          }}
        />
      </Map>
    </div>
  );
}
