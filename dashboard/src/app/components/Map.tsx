'use client';

import { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { ArcLayer, GeoJsonLayer } from '@deck.gl/layers';
import { DeckProps } from '@deck.gl/core';
import { MapboxOverlay } from '@deck.gl/mapbox';
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
  setSelectedCountry
}: {
  data: any[];
  setSelectedCountry: (code: string) => void;
}) {
  const [pulse, setPulse] = useState(0);

  function DeckGLOverlay(props: DeckProps) {
    const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
    overlay.setProps(props);
    return null;
  }

  const layers = [
    new GeoJsonLayer({
      id: 'country-shapes',
      data: './data/europe.geojson',
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
    }),
    new ArcLayer({
      id: 'migration-arcs',
      data,
      getSourcePosition: d => d.source,
      getTargetPosition: d => d.target,
      getSourceColor: [0, 128, 255, 180],
      getTargetColor: [255, 0, 0, 180],
      getWidth: d => Math.log1p(d.value) / 2 + Math.sin(pulse),
      updateTriggers: {
        getWidth: pulse
      }
    })
  ];

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Map
        initialViewState={{
          longitude: 0.45,
          latitude: 51.47,
          zoom: 3
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay layers={layers} />
      </Map>
    </div>
  );
}
