'use client';

import { useState } from 'react';
import { Play, Pause } from 'lucide-react';

type ControlsPanelProps = {
  year: number;
  setYear: (year: number) => void;
  minYear: number;
  maxYear: number;
};

export default function ControlsPanel({ year, setYear, minYear, maxYear }: ControlsPanelProps) {
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    setPlaying(prev => !prev);
  };

  return (
    <div className="flex flex-col gap-6 p-6 text-gray-100 w-full">
      {/* Year + Play/Pause Row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-wide">Year</h2>
        <button
          onClick={togglePlay}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition"
        >
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={minYear}
        max={maxYear}
        value={year}
        onChange={(e) => setYear(+e.target.value)}
        className="w-full accent-blue-500"
      />
      <div className="text-right text-sm text-gray-400">{year}</div>
    </div>
  );
}
