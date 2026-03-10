'use client';

import { useEffect, useState, useRef } from 'react';
import MigrationMap from './components/Map';
import { loadMigrationByCountry, loadAllMigrationData, MigrationArc } from './components/countryLoader';
import { loadFDIData, FDIRecord } from './components/capitalLoader';
import SidePanel from './components/SidePanel';
import ControlsPanel from './components/Controls';
import CapitalMap from './components/CapitalMap';

type DashboardMode = 'migration' | 'capital';

export default function Dashboard() {
  function getInitialState() {
    if (typeof window === 'undefined') {
      return { isEmbedded: false, isCompact: false, country: 'RO', year: 2016, panelOpen: true, sidebarWidth: 300 };
    }
    const urlParams = new URLSearchParams(window.location.search);
    const embedded = urlParams.get('embedded') === 'true';
    const compact = urlParams.get('compact') === 'true';
    const countryParam = urlParams.get('country');
    const yearParam = urlParams.get('year');
    let year = 2016;
    if (yearParam) {
      const yearNum = parseInt(yearParam);
      if (yearNum >= 2004 && yearNum <= 2024) year = yearNum;
    }
    return {
      isEmbedded: embedded,
      isCompact: compact,
      country: countryParam || 'RO',
      year,
      panelOpen: !embedded,
      sidebarWidth: embedded ? (compact ? 200 : 250) : 300,
    };
  }

  const initialState = getInitialState();

  const [mode, setMode] = useState<DashboardMode>('migration');
  const [selectedCountry, setSelectedCountry] = useState(initialState.country);
  const [year, setYear] = useState(initialState.year);
  const [panelOpen, setPanelOpen] = useState(initialState.panelOpen);
  const [sidebarWidth, setSidebarWidth] = useState(initialState.sidebarWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [mapStyle, setMapStyle] = useState('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
  const [isEmbedded] = useState(initialState.isEmbedded);
  const [isCompact] = useState(initialState.isCompact);

  // Migration data
  const [migrationData, setMigrationData] = useState<MigrationArc[]>([]);
  const [allMigrationData, setAllMigrationData] = useState<MigrationArc[]>([]);

  // Capital flows data
  const [fdiRecords, setFdiRecords] = useState<FDIRecord[]>([]);

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Migration: reload when country changes
  useEffect(() => {
    loadMigrationByCountry(selectedCountry).then(setMigrationData);
  }, [selectedCountry]);

  useEffect(() => {
    loadAllMigrationData().then(setAllMigrationData);
  }, []);

  // Capital: load all records once, reload arcs when country/year changes
  useEffect(() => {
    loadFDIData().then(setFdiRecords);
  }, []);

  const visibleMigrationData = migrationData.filter(d => d.year === year);

  // Clamp year to valid range for each mode
  const migrationYearRange = { min: 2004, max: 2023 };
  const capitalYearRange = { min: 2013, max: 2024 };

  const handleModeSwitch = (newMode: DashboardMode) => {
    setMode(newMode);
    if (newMode === 'capital' && year < capitalYearRange.min) setYear(capitalYearRange.min);
    if (newMode === 'migration' && year > migrationYearRange.max) setYear(migrationYearRange.max);
  };

  // Sidebar resize
  const handleMouseDown = (e: React.MouseEvent) => { setIsDragging(true); e.preventDefault(); };
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newWidth = e.clientX;
    const min = isCompact ? 150 : 200;
    const max = isCompact ? 400 : 600;
    if (newWidth >= min && newWidth <= max) setSidebarWidth(newWidth);
  };
  const handleMouseUp = () => setIsDragging(false);

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

      {/* Mode Switcher — top-center overlay */}
      <div className="absolute top-4 left-1/2 z-40 -translate-x-1/2 flex rounded-full bg-gray-900 bg-opacity-90 border border-gray-700 p-1 gap-1 shadow-xl" style={{ backdropFilter: 'blur(6px)' }}>
        <button
          onClick={() => handleModeSwitch('migration')}
          className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
            mode === 'migration'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Migration
        </button>
        <button
          onClick={() => handleModeSwitch('capital')}
          className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
            mode === 'capital'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Capital Flows
        </button>
      </div>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="bg-gray-900 text-gray-100 transition-all duration-300 ease-out overflow-hidden"
        style={{
          width: panelOpen ? `${sidebarWidth}px` : '0px',
          minWidth: panelOpen ? (isCompact ? '150px' : '200px') : '0px',
          maxWidth: panelOpen ? (isCompact ? '400px' : '600px') : '0px',
        }}
      >
        <SidePanel>
          <ControlsPanel
            year={year}
            setYear={setYear}
            minYear={mode === 'migration' ? migrationYearRange.min : capitalYearRange.min}
            maxYear={mode === 'migration' ? migrationYearRange.max : capitalYearRange.max}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            migrationData={migrationData}
            allMigrationData={allMigrationData}
            fdiRecords={fdiRecords}
            mode={mode}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
          />
        </SidePanel>
      </div>

      {/* Resize handle */}
      {panelOpen && (
        <div
          className="w-1 bg-gray-700 hover:bg-gray-600 cursor-col-resize transition-colors duration-200 relative z-20"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-0.5 h-8 bg-gray-500 rounded-full" />
          </div>
        </div>
      )}

      {/* Sidebar toggle */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="absolute top-1/2 z-30 bg-gray-800 hover:bg-gray-700 text-white rounded-r px-2 py-1 transition-all duration-200 ease-out no-select"
        style={{ transform: 'translateY(-50%)', left: panelOpen ? `${sidebarWidth}px` : '0px' }}
      >
        {panelOpen ? '›' : '‹'}
      </button>

      {/* Map */}
      <div className="flex-1 transition-all duration-300 ease-out">
        {mode === 'migration' ? (
          <MigrationMap
            data={visibleMigrationData}
            setSelectedCountry={setSelectedCountry}
            selectedCountry={selectedCountry}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
          />
        ) : (
          <CapitalMap
            allRecords={fdiRecords}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            year={year}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
          />
        )}
      </div>

      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize no-select" />}
    </main>
  );
}
