import * as d3 from 'd3';
import rawCountryCentroids from './countryCentroids.json';

const countryCentroids: { [key: string]: number[] } = rawCountryCentroids;

export async function loadNetMigration(year: number) {
  const rows = await d3.csv('/data/net_migration_bilateral_total.csv');

  const seenPairs = new Set<string>();

  return rows
    .filter(row => +row.year === year)
    .filter(row => {
      const from = row.partner;
      const to = row.geo;
      const key = [from, to].sort().join('-');
      if (seenPairs.has(key)) return false;
      seenPairs.add(key);
      return +row.net_value > 0;
    })
    .map(row => {
      const from = row.partner;
      const to = row.geo;
      const count = +row.net_value;

      return {
        from,
        to,
        count,
        fromCoords: countryCentroids[from],
        toCoords: countryCentroids[to],
      };
    })
    .filter(d => d.fromCoords && d.toCoords);
}

