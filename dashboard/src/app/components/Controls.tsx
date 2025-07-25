'use client';

import { useState, useEffect } from 'react';

export default function Controls({ year, setYear }: { year: number, setYear: (y: number) => void }) {
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (playing) {
      const interval = setInterval(() => {
        setYear(year < 2023 ? year + 1 : 2004);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [playing]);

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-black bg-opacity-70 p-4 rounded-xl shadow-lg">
      <div className="flex items-center gap-4">
        <button onClick={() => setPlaying(p => !p)} className="px-3 py-1 border rounded">
          {playing ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min="2004"
          max="2023"
          value={year}
          onChange={e => setYear(+e.target.value)}
        />
        <span>{year}</span>
      </div>
    </div>
  );
}
