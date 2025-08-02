'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Globe } from 'lucide-react';
import { iso2ToCountry } from '@/utils/ISO2Country';

type ControlsPanelProps = {
  year: number;
  setYear: (year: number) => void;
  minYear: number;
  maxYear: number;
  selectedCountry?: string;
  setSelectedCountry?: (country: string) => void;
};

const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'UK', 'CH', 'NO', 'IS', 'LI'
];

export default function ControlsPanel({ 
  year, 
  setYear, 
  minYear, 
  maxYear, 
  selectedCountry, 
  setSelectedCountry 
}: ControlsPanelProps) {
  const [playing, setPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // ms per year

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

  return (
    <div className="flex flex-col gap-6 p-6 text-gray-100 w-full h-full">
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
}
