'use client';

import { useState, useMemo } from 'react';
import { Globe, BarChart3, TrendingUp, Database, Users } from 'lucide-react';
import { iso2ToCountry } from '@/utils/ISO2Country';
import { MigrationArc } from './countryLoader';
import { FDIRecord } from './capitalLoader';

type ControlsPanelProps = {
  year: number;
  setYear: (year: number) => void;
  minYear: number;
  maxYear: number;
  selectedCountry?: string;
  setSelectedCountry?: (country: string) => void;
  migrationData?: MigrationArc[];
  allMigrationData?: MigrationArc[];
  fdiRecords?: FDIRecord[];
  mode?: 'migration' | 'capital';
  mapStyle?: string;
  setMapStyle?: (style: string) => void;
};

const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'UK', 'CH', 'NO', 'IS', 'LI'
];

type MigrationTabType = 'top-migrants' | 'migration' | 'statistics' | 'eu-aggregates';
type CapitalTabType = 'fdi-overview' | 'fdi-top' | 'fdi-eu-aggregates';

function fmtM(v: number | null | undefined): string {
  if (v == null) return 'N/A';
  const abs = Math.abs(v);
  if (abs >= 1000) return `€${(v / 1000).toFixed(1)}B`;
  return `€${Math.round(v)}M`;
}

export default function ControlsPanel({
  year,
  setYear,
  minYear,
  maxYear,
  selectedCountry,
  setSelectedCountry,
  migrationData = [],
  allMigrationData = [],
  fdiRecords = [],
  mode = 'migration',
  mapStyle,
  setMapStyle
}: ControlsPanelProps) {
  const [activeMigTab, setActiveMigTab] = useState<MigrationTabType>('top-migrants');
  const [activeCapTab, setActiveCapTab] = useState<CapitalTabType>('fdi-overview');

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

  const migTabs = [
    { id: 'top-migrants' as MigrationTabType, label: 'Top Migrants', icon: TrendingUp },
    { id: 'migration' as MigrationTabType, label: 'Migration Data', icon: Database },
    { id: 'statistics' as MigrationTabType, label: 'Statistics', icon: BarChart3 },
    { id: 'eu-aggregates' as MigrationTabType, label: 'EU Aggregates', icon: Users },
  ];

  const capTabs = [
    { id: 'fdi-overview' as CapitalTabType, label: 'Overview', icon: BarChart3 },
    { id: 'fdi-top' as CapitalTabType, label: 'Top Partners', icon: TrendingUp },
    { id: 'fdi-eu-aggregates' as CapitalTabType, label: 'EU Aggregates', icon: Users },
  ];

  // ── Capital flows derived data ──────────────────────────────────────────────
  const yearFdi = useMemo(() => fdiRecords.filter(r => r.year === year), [fdiRecords, year]);

  const fdiOverview = useMemo(() => {
    const outPos = yearFdi.filter(r => r.investor === selectedCountry && r.position_mio_eur != null)
      .reduce((s, r) => s + r.position_mio_eur!, 0);
    const inPos = yearFdi.filter(r => r.host === selectedCountry && r.position_mio_eur != null)
      .reduce((s, r) => s + r.position_mio_eur!, 0);
    const outInc = yearFdi.filter(r => r.investor === selectedCountry && r.income_mio_eur != null)
      .reduce((s, r) => s + r.income_mio_eur!, 0);
    const inInc = yearFdi.filter(r => r.host === selectedCountry && r.income_mio_eur != null)
      .reduce((s, r) => s + r.income_mio_eur!, 0);
    return { outPos, inPos, netPos: outPos - inPos, outInc, inInc, netInc: outInc - inInc };
  }, [yearFdi, selectedCountry]);

  const fdiTopOutward = useMemo(() =>
    yearFdi.filter(r => r.investor === selectedCountry && r.position_mio_eur != null)
      .sort((a, b) => b.position_mio_eur! - a.position_mio_eur!)
      .slice(0, 8),
    [yearFdi, selectedCountry]);

  const fdiTopInward = useMemo(() =>
    yearFdi.filter(r => r.host === selectedCountry && r.position_mio_eur != null)
      .sort((a, b) => b.position_mio_eur! - a.position_mio_eur!)
      .slice(0, 8),
    [yearFdi, selectedCountry]);

  const fdiEuNetPositions = useMemo(() => {
    const map: Record<string, number> = {};
    yearFdi.forEach(r => {
      if (r.position_mio_eur == null) return;
      map[r.investor] = (map[r.investor] ?? 0) + r.position_mio_eur;
      map[r.host] = (map[r.host] ?? 0) - r.position_mio_eur;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [yearFdi]);

  const renderControlsSection = () => (
    <div className="space-y-6">
      {/* Country Selection Only (map style selector removed) */}
      <div className="grid grid-cols-1 gap-4">
        {/* Country Selection */}
        {setSelectedCountry && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <h3 className="text-sm font-semibold">Selected Country</h3>
            </div>
            <div className="relative w-full">
              <select
                value={selectedCountry || 'RO'}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full appearance-none bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400 pr-8 custom-select"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
              >
                {EU_COUNTRIES.map(country => (
                  <option key={country} value={country}>
                    {iso2ToCountry(country)}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                ▼
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Year Slider */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Year</h3>
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={year}
          onChange={(e) => setYear(+e.target.value)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'linear-gradient(to right, #60a5fa 0%, #60a5fa ' + ((year-minYear)/(maxYear-minYear))*100 + '%, #374151 ' + ((year-minYear)/(maxYear-minYear))*100 + '%, #374151 100%)',
          }}
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{minYear}</span>
          <span className="font-semibold text-white">{year}</span>
          <span>{maxYear}</span>
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

  // ── Capital tab renderers ────────────────────────────────────────────────────

  const renderFdiOverviewTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold">{iso2ToCountry(selectedCountry || '')} · {year}</h3>
      </div>

      <div className="bg-gray-800 rounded p-3 space-y-2 text-xs">
        <h4 className="font-medium text-gray-300 mb-1">Investment Positions</h4>
        <div className="flex justify-between">
          <span className="text-gray-400">Outward (you invest abroad)</span>
          <span className="text-emerald-400 font-medium">{fmtM(fdiOverview.outPos)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Inward (others invest in you)</span>
          <span className="text-amber-400 font-medium">{fmtM(fdiOverview.inPos)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-700 pt-1">
          <span className="text-gray-400">Net position</span>
          <span className={`font-semibold ${fdiOverview.netPos >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {fdiOverview.netPos >= 0 ? '+' : ''}{fmtM(fdiOverview.netPos)}
          </span>
        </div>
      </div>

      <div className="bg-gray-800 rounded p-3 space-y-2 text-xs">
        <h4 className="font-medium text-gray-300 mb-1">Annual Income</h4>
        <div className="flex justify-between">
          <span className="text-gray-400">You earn from abroad</span>
          <span className="text-emerald-400 font-medium">{fmtM(fdiOverview.outInc)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Others earn from you</span>
          <span className="text-amber-400 font-medium">{fmtM(fdiOverview.inInc)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-700 pt-1">
          <span className="text-gray-400">Net income</span>
          <span className={`font-semibold ${fdiOverview.netInc >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {fdiOverview.netInc >= 0 ? '+' : ''}{fmtM(fdiOverview.netInc)}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-xs">Positions reflect immediate counterpart only.</p>
    </div>
  );

  const renderFdiTopTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold">Top Partners · {year}</h3>
      </div>

      <div>
        <h4 className="text-xs font-medium text-emerald-400 mb-2">You invest most in</h4>
        <div className="space-y-1">
          {fdiTopOutward.length > 0 ? fdiTopOutward.map((r, i) => (
            <div key={r.host} className="flex justify-between items-center text-xs bg-gray-800 rounded px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-4">#{i + 1}</span>
                <span className="truncate">{iso2ToCountry(r.host)}</span>
              </div>
              <span className="text-emerald-400 font-medium">{fmtM(r.position_mio_eur)}</span>
            </div>
          )) : <p className="text-xs text-gray-400 px-2">No data for {year}</p>}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-amber-400 mb-2">Biggest investors in you</h4>
        <div className="space-y-1">
          {fdiTopInward.length > 0 ? fdiTopInward.map((r, i) => (
            <div key={r.investor} className="flex justify-between items-center text-xs bg-gray-800 rounded px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-4">#{i + 1}</span>
                <span className="truncate">{iso2ToCountry(r.investor)}</span>
              </div>
              <span className="text-amber-400 font-medium">{fmtM(r.position_mio_eur)}</span>
            </div>
          )) : <p className="text-xs text-gray-400 px-2">No data for {year}</p>}
        </div>
      </div>
    </div>
  );

  const renderFdiEuAggregatesTab = () => {
    const topNetInvestors = fdiEuNetPositions.slice(0, 10);
    const topNetRecipients = [...fdiEuNetPositions].reverse().slice(0, 10);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold">EU FDI Aggregates · {year}</h3>
        </div>

        <div className="bg-gray-800 rounded p-3">
          <h4 className="text-xs font-medium text-emerald-400 mb-2">Biggest net investors</h4>
          <div className="space-y-1">
            {topNetInvestors.map(([country, net], i) => (
              <div key={country} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-4">#{i + 1}</span>
                  <span className="truncate">{iso2ToCountry(country)}</span>
                </div>
                <span className="text-emerald-400 font-medium">{fmtM(net)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded p-3">
          <h4 className="text-xs font-medium text-amber-400 mb-2">Biggest net recipients</h4>
          <div className="space-y-1">
            {topNetRecipients.map(([country, net], i) => (
              <div key={country} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-4">#{i + 1}</span>
                  <span className="truncate">{iso2ToCountry(country)}</span>
                </div>
                <span className="text-amber-400 font-medium">{fmtM(net)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Migration tab content switcher ───────────────────────────────────────────
  const renderMigTabContent = () => {
    switch (activeMigTab) {
      case 'top-migrants': return renderTopMigrantsTab();
      case 'migration':    return renderMigrationDataTab();
      case 'statistics':   return renderStatisticsTab();
      case 'eu-aggregates': return renderEuAggregatesTab();
      default:             return renderTopMigrantsTab();
    }
  };

  const renderCapTabContent = () => {
    switch (activeCapTab) {
      case 'fdi-overview':       return renderFdiOverviewTab();
      case 'fdi-top':            return renderFdiTopTab();
      case 'fdi-eu-aggregates':  return renderFdiEuAggregatesTab();
      default:                   return renderFdiOverviewTab();
    }
  };

  const activeTabs = mode === 'capital' ? capTabs : migTabs;
  const activeTabId = mode === 'capital' ? activeCapTab : activeMigTab;
  const setActiveTabId = mode === 'capital'
    ? (id: string) => setActiveCapTab(id as CapitalTabType)
    : (id: string) => setActiveMigTab(id as MigrationTabType);
  const activeColor = mode === 'capital' ? 'text-emerald-400 border-emerald-400' : 'text-blue-400 border-blue-400';

  return (
    <div className="flex flex-col gap-4 p-6 text-gray-100 w-full h-full">
      {renderControlsSection()}

      <div className="border-b border-gray-700 overflow-x-auto">
        <div className="flex min-w-max">
          {activeTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTabId === tab.id
                    ? `${activeColor} border-b-2`
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

      <div className="flex-1 overflow-y-auto">
        {mode === 'capital' ? renderCapTabContent() : renderMigTabContent()}
      </div>
    </div>
  );
}
