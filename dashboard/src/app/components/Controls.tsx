'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Globe, BarChart3, TrendingUp, Database, Users, Map } from 'lucide-react';
import { iso2ToCountry } from '@/utils/ISO2Country';
import { MigrationArc } from './countryLoader';

type ControlsPanelProps = {
  year: number;
  setYear: (year: number) => void;
  minYear: number;
  maxYear: number;
  selectedCountry?: string;
  setSelectedCountry?: (country: string) => void;
  migrationData?: MigrationArc[];
  allMigrationData?: MigrationArc[];
  mapStyle?: string;
  setMapStyle?: (style: string) => void;
};

const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'UK', 'CH', 'NO', 'IS', 'LI'
];

type TabType = 'top-migrants' | 'migration' | 'statistics' | 'eu-aggregates';

export default function ControlsPanel({ 
  year, 
  setYear, 
  minYear, 
  maxYear, 
  selectedCountry, 
  setSelectedCountry,
  migrationData = [],
  allMigrationData = [],
  mapStyle,
  setMapStyle
}: ControlsPanelProps) {
  const [playing, setPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // ms per year
  const [activeTab, setActiveTab] = useState<TabType>('top-migrants');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (playing) {
      interval = setInterval(() => {
        if (year >= maxYear) {
          setPlaying(false);
        } else {
          setYear(year + 1);
        }
      }, animationSpeed);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [playing, maxYear, setYear, animationSpeed, year]);

  const togglePlay = () => {
    setPlaying(prev => !prev);
  };

  const resetToStart = () => {
    setYear(minYear);
    setPlaying(false);
  };

  // Filter data for current year and selected country, and remove duplicates
  const currentYearData = migrationData
    .filter(d => d.year === year)
    .reduce((acc, arc) => {
      // Create a unique key for each country pair
      const key = arc.direction === 'inflow' 
        ? `${arc.sourceName}->${arc.targetName}`
        : `${arc.targetName}->${arc.sourceName}`;
      
      // Only add if we haven't seen this combination before
      if (!acc.some(existing => {
        const existingKey = existing.direction === 'inflow'
          ? `${existing.sourceName}->${existing.targetName}`
          : `${existing.targetName}->${existing.sourceName}`;
        return existingKey === key;
      })) {
        acc.push(arc);
      }
      return acc;
    }, [] as MigrationArc[]);
  
  // Calculate top migrants for the year (remove duplicates and zero values)
  const topInflows = currentYearData
    .filter(d => d.direction === 'inflow' && d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  
  const topOutflows = currentYearData
    .filter(d => d.direction === 'outflow' && d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Calculate EU aggregates for the current year using ALL migration data
  const euAggregates = allMigrationData
    .filter(d => d.year === year)
    .reduce((acc, arc) => {
      // For inflows: target country receives migrants
      if (arc.direction === 'inflow') {
        const targetCountry = arc.targetName;
        if (!acc.inflows[targetCountry]) {
          acc.inflows[targetCountry] = 0;
        }
        acc.inflows[targetCountry] += arc.value;
      }
      
      // For outflows: source country sends migrants
      if (arc.direction === 'outflow') {
        const sourceCountry = arc.sourceName;
        if (!acc.outflows[sourceCountry]) {
          acc.outflows[sourceCountry] = 0;
        }
        acc.outflows[sourceCountry] += arc.value;
      }
      
      return acc;
    }, { inflows: {} as Record<string, number>, outflows: {} as Record<string, number> });

  const topEuInflows = Object.entries(euAggregates.inflows)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  const topEuOutflows = Object.entries(euAggregates.outflows)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  const tabs = [
    { id: 'top-migrants' as TabType, label: 'Top Migrants', icon: TrendingUp },
    { id: 'migration' as TabType, label: 'Migration Data', icon: Database },
    { id: 'statistics' as TabType, label: 'Statistics', icon: BarChart3 },
    { id: 'eu-aggregates' as TabType, label: 'EU Aggregates', icon: Users },
  ];

  const renderControlsSection = () => (
    <div className="space-y-6">
      {/* Map Style and Country Selection */}
      <div className="grid grid-cols-2 gap-4">
        {/* Map Style Selection */}
        {setMapStyle && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              <h3 className="text-sm font-semibold">Map Style</h3>
            </div>
            <select
              value={mapStyle || 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'}
              onChange={(e) => setMapStyle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400"
            >
              <option value="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json">Dark Matter</option>
              <option value="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json">Positron</option>
              <option value="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json">Voyager</option>
            </select>
          </div>
        )}

        {/* Country Selection */}
        {setSelectedCountry && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <h3 className="text-sm font-semibold">Selected Country</h3>
            </div>
            <select
              value={selectedCountry || 'RO'}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400"
            >
              {EU_COUNTRIES.map(country => (
                <option key={country} value={country}>
                  {iso2ToCountry(country)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Year + Play/Pause Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Year</h3>
          <div className="flex gap-2">
            <button
              onClick={resetToStart}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition"
              title="Reset to start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition"
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Year Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={year}
            onChange={(e) => setYear(+e.target.value)}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{minYear}</span>
            <span className="font-semibold">{year}</span>
            <span>{maxYear}</span>
          </div>
        </div>

        {/* Animation Speed */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Animation Speed</label>
          <select
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(+e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-400"
          >
            <option value={500}>Fast (0.5s)</option>
            <option value={1000}>Normal (1s)</option>
            <option value={2000}>Slow (2s)</option>
            <option value={3000}>Very Slow (3s)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderTopMigrantsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        <h3 className="text-sm font-semibold">Top Migrants for {year}</h3>
      </div>
      
      <div className="space-y-4">
        {/* Top Inflows */}
        <div>
          <h4 className="text-xs font-medium text-green-400 mb-2">Top Inflows</h4>
          <div className="space-y-1">
            {topInflows.length > 0 ? (
              topInflows.map((arc, index) => (
                <div key={`top-inflow-${arc.sourceName}-${index}`} className="flex justify-between items-center text-xs bg-gray-800 rounded px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-4">#{index + 1}</span>
                    <span className="truncate">{arc.sourceName}</span>
                  </div>
                  <span className="text-green-400 font-medium">{arc.value.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400 px-2 py-1">No inflow data available</div>
            )}
          </div>
        </div>

        {/* Top Outflows */}
        <div>
          <h4 className="text-xs font-medium text-red-400 mb-2">Top Outflows</h4>
          <div className="space-y-1">
            {topOutflows.length > 0 ? (
              topOutflows.map((arc, index) => (
                <div key={`top-outflow-${arc.targetName}-${index}`} className="flex justify-between items-center text-xs bg-gray-800 rounded px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-4">#{index + 1}</span>
                    <span className="truncate">{arc.targetName}</span>
                  </div>
                  <span className="text-red-400 font-medium">{arc.value.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400 px-2 py-1">No outflow data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMigrationDataTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4" />
        <h3 className="text-sm font-semibold">Migration Data for {year}</h3>
      </div>
      
      {currentYearData.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No migration data available for {selectedCountry} in {year}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Inflows */}
          <div>
            <h4 className="text-xs font-medium text-green-400 mb-2">Inflows</h4>
            <div className="space-y-1">
              {currentYearData
                .filter(d => d.direction === 'inflow' && d.value > 0)
                .sort((a, b) => b.value - a.value)
                .map((arc, index) => (
                  <div key={`inflow-${arc.sourceName}-${index}`} className="flex justify-between items-center text-xs bg-gray-800 rounded px-2 py-1">
                    <span className="truncate">{arc.sourceName}</span>
                    <span className="text-green-400 font-medium">{arc.value.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Outflows */}
          <div>
            <h4 className="text-xs font-medium text-red-400 mb-2">Outflows</h4>
            <div className="space-y-1">
              {currentYearData
                .filter(d => d.direction === 'outflow' && d.value > 0)
                .sort((a, b) => b.value - a.value)
                .map((arc, index) => (
                  <div key={`outflow-${arc.targetName}-${index}`} className="flex justify-between items-center text-xs bg-gray-800 rounded px-2 py-1">
                    <span className="truncate">{arc.targetName}</span>
                    <span className="text-red-400 font-medium">{arc.value.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Summary */}
          <div className="pt-2 border-t border-gray-700">
            <div className="flex justify-between items-center text-xs">
              <span>Net Migration:</span>
              <span className={`font-medium ${
                (currentYearData.filter(d => d.direction === 'inflow').reduce((sum, d) => sum + d.value, 0) -
                currentYearData.filter(d => d.direction === 'outflow').reduce((sum, d) => sum + d.value, 0)
              ) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(currentYearData.filter(d => d.direction === 'inflow').reduce((sum, d) => sum + d.value, 0) -
                 currentYearData.filter(d => d.direction === 'outflow').reduce((sum, d) => sum + d.value, 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStatisticsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        <h3 className="text-sm font-semibold">Statistics for {year}</h3>
      </div>
      
      <div className="space-y-3">
        <div className="bg-gray-800 rounded p-3">
          <h4 className="text-xs font-medium mb-2">Migration Summary</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Total Inflows:</span>
              <span className="text-green-400">
                {currentYearData.filter(d => d.direction === 'inflow').reduce((sum, d) => sum + d.value, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Outflows:</span>
              <span className="text-red-400">
                {currentYearData.filter(d => d.direction === 'outflow').reduce((sum, d) => sum + d.value, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-1">
              <span>Net Migration:</span>
              <span className={`font-medium ${
                (currentYearData.filter(d => d.direction === 'inflow').reduce((sum, d) => sum + d.value, 0) -
                currentYearData.filter(d => d.direction === 'outflow').reduce((sum, d) => sum + d.value, 0)
              ) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(currentYearData.filter(d => d.direction === 'inflow').reduce((sum, d) => sum + d.value, 0) -
                 currentYearData.filter(d => d.direction === 'outflow').reduce((sum, d) => sum + d.value, 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded p-3">
          <h4 className="text-xs font-medium mb-2">Data Coverage</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Total Flows:</span>
              <span>{currentYearData.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Inflow Countries:</span>
              <span>{new Set(currentYearData.filter(d => d.direction === 'inflow').map(d => d.sourceName)).size}</span>
            </div>
            <div className="flex justify-between">
              <span>Outflow Countries:</span>
              <span>{new Set(currentYearData.filter(d => d.direction === 'outflow').map(d => d.targetName)).size}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEuAggregatesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4" />
        <h3 className="text-sm font-semibold">EU Migration Aggregates for {year} (All Countries)</h3>
      </div>
      
      <div className="space-y-3">
        <div className="bg-gray-800 rounded p-3">
          <h4 className="text-xs font-medium mb-2">Top Countries by Total Inflows</h4>
          <div className="space-y-1">
            {topEuInflows.map(([country, value], index) => (
              <div key={`eu-aggregate-${country}-${index}`} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-4">#{index + 1}</span>
                  <span className="truncate">{country}</span>
                </div>
                <span className="text-green-400 font-medium">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded p-3">
          <h4 className="text-xs font-medium mb-2">Top Countries by Total Outflows</h4>
          <div className="space-y-1">
            {topEuOutflows.map(([country, value], index) => (
              <div key={`eu-aggregate-${country}-${index}`} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-4">#{index + 1}</span>
                  <span className="truncate">{country}</span>
                </div>
                <span className="text-red-400 font-medium">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded p-3">
          <h4 className="text-xs font-medium mb-2">Summary</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Total EU Migrants (Inflows):</span>
              <span className="text-green-400">
                {topEuInflows.reduce((sum, [, value]) => sum + value, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total EU Migrants (Outflows):</span>
              <span className="text-red-400">
                {topEuOutflows.reduce((sum, [, value]) => sum + value, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Countries with Data:</span>
              <span>{topEuInflows.length + topEuOutflows.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Average per Country:</span>
              <span>
                {topEuInflows.length + topEuOutflows.length > 0 
                  ? ((topEuInflows.reduce((sum, [, value]) => sum + value, 0) + topEuOutflows.reduce((sum, [, value]) => sum + value, 0)) / (topEuInflows.length + topEuOutflows.length)).toLocaleString(undefined, {maximumFractionDigits: 0})
                  : '0'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'top-migrants':
        return renderTopMigrantsTab();
      case 'migration':
        return renderMigrationDataTab();
      case 'statistics':
        return renderStatisticsTab();
      case 'eu-aggregates':
        return renderEuAggregatesTab();
      default:
        return renderTopMigrantsTab();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 text-gray-100 w-full h-full">
      {/* Controls Section - Always visible */}
      {renderControlsSection()}

      {/* Tab Selectors with horizontal scroll */}
      <div className="border-b border-gray-700 overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  );
}
