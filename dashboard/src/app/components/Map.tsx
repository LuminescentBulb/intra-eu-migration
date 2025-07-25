'use client';

import { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { ArcLayer } from '@deck.gl/layers';
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

export default function MigrationMap({ data }: { data: any[] }) {
  const [pulse, setPulse] = useState(0);

  function DeckGLOverlay(props: DeckProps) {
    const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
    overlay.setProps(props);
    return null;
  }

  const layers = [
    new ArcLayer({
      id: 'migration-arcs',
      data,
      getSourcePosition: d => d.fromCoords,
      getTargetPosition: d => d.toCoords,
      getSourceColor: [0, 128, 255, 180],
      getTargetColor: [255, 0, 0, 180],
      getWidth: d => Math.log1p(d.count) / 2 + Math.sin(pulse),
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
