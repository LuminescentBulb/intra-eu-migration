'use client';

import { useEffect, useState, useRef } from 'react';
import MigrationMap from './components/Map';
import { loadMigrationByCountry, loadAllMigrationData, MigrationArc } from './components/countryLoader';
import SidePanel from './components/SidePanel';
import ControlsPanel from './components/Controls';

export default function Dashboard() {
  function getInitialState() {
    if (typeof window === 'undefined') {
      return {
        isEmbedded: false,
        isCompact: false,
        country: 'RO',
        year: 2016,
        panelOpen: true,
        sidebarWidth: 300
      };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const embedded = urlParams.get('embedded') === 'true';
    const compact = urlParams.get('compact') === 'true';
    const countryParam = urlParams.get('country');
    const yearParam = urlParams.get('year');

    let year = 2016;
    if (yearParam) {
      const yearNum = parseInt(yearParam);
      if (yearNum >= 2004 && yearNum <= 2023) {
        year = yearNum;
      }
    }

    return {
      isEmbedded: embedded,
      isCompact: compact,
      country: countryParam || 'RO',
      year: year,
      panelOpen: !embedded, // Start closed if embedded
      sidebarWidth: embedded ? (compact ? 200 : 250) : 300
    };
  }

  const initialState = getInitialState()

  const [selectedCountry, setSelectedCountry] = useState(initialState.country);
  const [year, setYear] = useState(initialState.year);
  const [data, setData] = useState<MigrationArc[]>([]);
  const [allData, setAllData] = useState<MigrationArc[]>([]);
  const [panelOpen, setPanelOpen] = useState(initialState.panelOpen);
  const [sidebarWidth, setSidebarWidth] = useState(initialState.sidebarWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [mapStyle, setMapStyle] = useState('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
  const [isEmbedded, setIsEmbedded] = useState(initialState.isEmbedded);
  const [isCompact, setIsCompact] = useState(initialState.isCompact);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMigrationByCountry(selectedCountry).then(setData);
  }, [selectedCountry]);

  useEffect(() => {
    loadAllMigrationData().then(setAllData);
  }, []);

  const visibleData = data.filter(d => d.year === year);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newWidth = e.clientX;
    const minWidth = isCompact ? 150 : 200;
    const maxWidth = isCompact ? 400 : 600;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isCompact]);

  return (
    <main className={`flex h-screen relative ${isDragging ? 'dragging' : ''} ${isEmbedded ? 'embedded' : ''} ${isCompact ? 'compact' : ''}`}>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`bg-gray-900 text-gray-100 transition-all duration-300 ease-out overflow-hidden ${panelOpen ? 'w-0' : 'w-0'
          }`}
        style={{
          width: panelOpen ? `${sidebarWidth}px` : '0px',
          minWidth: panelOpen ? (isCompact ? '150px' : '200px') : '0px',
          maxWidth: panelOpen ? (isCompact ? '400px' : '600px') : '0px'
        }}
      >
        <SidePanel>
          <ControlsPanel
            year={year}
            setYear={setYear}
            minYear={2004}
            maxYear={2023}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            migrationData={data}
            allMigrationData={allData}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
          />
        </SidePanel>
      </div>

      {/* Resize handle */}
      {panelOpen && (
        <div
          className="w-1 bg-gray-700 hover:bg-gray-600 resize-handle transition-colors duration-200 relative z-20 no-select"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-0.5 h-8 bg-gray-500 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="absolute top-1/2 z-30 bg-gray-800 hover:bg-gray-700 text-white rounded-r px-2 py-1 transition-all duration-200 ease-out no-select"
        style={{
          transform: 'translateY(-50%)',
          left: panelOpen ? `${sidebarWidth}px` : '0px',
        }}
      >
        {panelOpen ? '›' : '‹'}
      </button>

      {/* Map container */}
      <div className="flex-1 transition-all duration-300 ease-out">
        <MigrationMap
          data={visibleData}
          setSelectedCountry={setSelectedCountry}
          selectedCountry={selectedCountry}
          mapStyle={mapStyle}
          setMapStyle={setMapStyle}
        />
      </div>

      {/* Overlay for dragging */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize no-select" />
      )}
    </main>
  );
}