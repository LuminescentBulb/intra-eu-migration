'use client';

import { useEffect, useState } from 'react';
import MigrationMap from './components/Map';
import { loadNetMigration } from './components/Loader';

export default function Home() {
  const [year, setYear] = useState(2016);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    loadNetMigration(year).then(setData);
  }, [year]);

  return (
    <main className="relative min-h-screen">
      <MigrationMap data={data} />
      {/* Add Controls here if needed */}
    </main>
  );
}
