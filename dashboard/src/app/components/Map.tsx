'use client';

import { useEffect, useState } from 'react';
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
  selectedCountry 
}: {
  data: any;
  setSelectedCountry: (code: string) => void;
  selectedCountry: string
}) {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('/data/europe.geojson')
      .then(res => res.json())
      .then(json => setGeoData(json))
      .catch(console.error);
  }, []);

  function DeckGLOverlay(props: MapboxOverlayProps) {
    const overlay = useControl(() => new MapboxOverlay(props));
    overlay.setProps(props);
    return null;
  }

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

  const arcLayer = new ArcLayer({
    id: 'migration-arcs',
    data: Array.isArray(data) ? data : [],
    pickable: false,
    getSourcePosition: d => d.source,
    getTargetPosition: d => d.target,
    getSourceColor: [0, 128, 255, 180],
    getTargetColor: [255, 0, 0, 180],
    getWidth: d => Math.log1p(d.value) / 2,
  });

  const layers = [countryShapesLayer, arcLayer].filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay layers={layers} />
      </Map>
    </div>
  );
}
