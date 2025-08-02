'use client';

import { useEffect, useState, useMemo } from 'react';
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
}: {
  data: any[];
  setSelectedCountry: (code: string) => void;
  selectedCountry: string;
}) {
  const [geoData, setGeoData] = useState<any | null>(null);
  const [hoverInfo, setHoverInfo] = useState<any | null>(null);

  useEffect(() => {
    fetch('/data/europe.geojson')
      .then(res => res.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  function DeckGLOverlay(props: MapboxOverlayProps) {
    const overlay = useControl(() => new MapboxOverlay({ interleaved: false }));
    overlay.setProps(props);
    return null;
  }

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

  // Arc layer with enhanced color coding for direction
  const arcLayer = new ArcLayer({
    id: 'migration-arcs',
    data: annotatedData,
    pickable: true,
    getSourcePosition: d => d.source,
    getTargetPosition: d => d.target,
    getSourceColor: d => {
      if (d.direction === 'outflow') {
        // Outflows: Red to Orange gradient
        return d.isTop ? [255, 100, 100, 200] : [255, 100, 100, 120];
      } else {
        // Inflows: Blue to Cyan gradient
        return d.isTop ? [100, 150, 255, 200] : [100, 150, 255, 120];
      }
    },
    getTargetColor: d => {
      if (d.direction === 'outflow') {
        // Outflows: Red to Orange gradient
        return d.isTop ? [255, 50, 50, 200] : [255, 50, 50, 120];
      } else {
        // Inflows: Blue to Cyan gradient
        return d.isTop ? [50, 200, 255, 200] : [50, 200, 255, 120];
      }
    },
    getWidth: d => {
      // Use absolute value for width, with minimum width
      const baseWidth = Math.max(1, Math.sqrt(d.absValue) / 20);
      if (d.isTop) return baseWidth * 1.5;
      return baseWidth;
    },
    getHeight: d => d.isTop ? 0.3 : 0.1,
    getTilt: d => d.isTop ? 30 : 0,
  });

  // Country borders layer with enhanced highlighting
  const countryShapesLayer = geoData &&
    new GeoJsonLayer({
      id: `country-shapes-${selectedCountry}`,
      data: geoData,
      pickable: true,
      stroked: true,
      filled: true,
      getLineColor: d => {
        if (d.properties?.ISO2 === selectedCountry) return [255, 255, 0, 255]; // Yellow border for selected
        return [255, 255, 255, 100]; // White border for others
      },
      getFillColor: d => {
        if (d.properties?.ISO2 === selectedCountry) return [255, 255, 0, 40]; // Yellow fill for selected
        return [100, 100, 100, 20]; // Gray fill for others
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
    });

  const layers = [countryShapesLayer, arcLayer].filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
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
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
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
