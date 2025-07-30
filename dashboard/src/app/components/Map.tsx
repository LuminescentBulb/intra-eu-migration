'use client';

import { useEffect, useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, ArcLayer } from '@deck.gl/layers';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import { Map, useControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

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

  // Annotate top 10 flows
  const annotatedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const sorted = [...data].sort((a, b) => b.value - a.value);
    return sorted.map((d, i) => ({ ...d, isTop: i < 10 }));
  }, [data]);

  // Arc layer with tooltip, gradient, width scale, top flow highlight
  const arcLayer = new ArcLayer({
    id: 'migration-arcs',
    data: annotatedData,
    pickable: true,
    getSourcePosition: d => d.source,
    getTargetPosition: d => d.target,
    getSourceColor: d => (d.isTop ? [0, 128, 255] : [0, 128, 255, 80]),
    getTargetColor: d => (d.isTop ? [255, 0, 0] : [255, 0, 0, 80]),
    getWidth: d => Math.max(1.5, Math.sqrt(d.value) / 15),
    onHover: info => setHoverInfo(info),
  });

  // Country borders layer
  const countryShapesLayer = geoData &&
    new GeoJsonLayer({
      id: `country-shapes-${selectedCountry}`,
      data: geoData,
      pickable: true,
      stroked: true,
      filled: true,
      getLineColor: [255, 255, 255, 100],
      getFillColor: [100, 100, 100, 20],
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
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay layers={layers} />
      </Map>

      {/* Manual tooltip overlay for ArcLayer */}
      {hoverInfo?.object && (
        <div
          className="pointer-events-none text-xs text-white bg-black bg-opacity-80 rounded px-2 py-1"
          style={{
            position: 'absolute',
            left: hoverInfo.x,
            top: hoverInfo.y,
            transform: 'translate(8px, 8px)',
            zIndex: 10,
            maxWidth: 240,
            whiteSpace: 'pre-line',
          }}
        >
          {`${hoverInfo.object.id}\n${hoverInfo.object.value.toLocaleString()} people`}
        </div>
      )}
    </div>
  );
}
