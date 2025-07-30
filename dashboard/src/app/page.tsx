'use client';

import { useEffect, useState } from 'react';
import MigrationMap from './components/Map';
import { loadMigrationByCountry, MigrationArc } from './components/countryLoader';
import SidePanel from './components/SidePanel';
import ControlsPanel from './components/Controls';

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState('RO');
  const [year, setYear] = useState(2016);
  const [data, setData] = useState<MigrationArc[]>([]);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    loadMigrationByCountry(selectedCountry).then(setData);
  }, [selectedCountry]);

  const visibleData = data.filter(d => d.year === year);

  return (
    <main className="flex min-h-screen">
      <div className={`transition-all duration-300 ${panelOpen ? 'w-[300px]' : 'w-0'} overflow-hidden bg-gray-900 text-gray-100`}>
        <SidePanel>
          <ControlsPanel
            year={year}
            setYear={setYear}
            minYear={2004}
            maxYear={2023}
          />
        </SidePanel>
      </div>

      {/* Chevron toggle */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="absolute top-1/2 left-[300px] z-10 bg-gray-800 hover:bg-gray-700 text-white rounded-r px-2 py-1 transition-all"
        style={{
          transform: 'translateY(-50%)',
          left: panelOpen ? '300px' : '0px',
        }}
      >
        {panelOpen ? '›' : '‹'}
      </button>

      {/* Map container fills remaining space */}
      <div className="flex-1">
        <MigrationMap data={visibleData} setSelectedCountry={setSelectedCountry} />
      </div>
    </main>
  );
}
