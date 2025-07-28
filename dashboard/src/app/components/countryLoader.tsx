import * as d3 from 'd3';
import rawCountryCentroids from './countryCentroids.json';

const countryCentroids: { [key: string]: number[] } = rawCountryCentroids;

export interface MigrationArc {
  id: string;
  source: number[]; // [lng, lat]
  target: number[];
  value: number;
  year: number;
}

export async function loadMigrationByCountry(
    selectedCountry: string
): Promise<MigrationArc[]> {
    const rows = await d3.csv('/data/net_migration_bilateral_total.csv');

    return rows
        .filter(row => row.partner === selectedCountry && +row.net_value > 0)
        .map(row => {
            const from = row.partner;
            const to = row.geo;
            const year = +row.year;
            const value = +row.net_value;
            const fromCoords = countryCentroids[from];
            const toCoords = countryCentroids[to];

            if (!fromCoords || !toCoords) return null;

            return {
                id: `${from}->${to} (${year})`,
                source: fromCoords,
                target: toCoords,
                value,
                year
            };
        })
        .filter((d): d is MigrationArc => d !== null);
}
