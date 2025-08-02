import * as d3 from 'd3';
import rawCountryCentroids from './countryCentroids.json';
import { iso2ToCountry } from '@/utils/ISO2Country';

const countryCentroids: { [key: string]: number[] } = rawCountryCentroids;

export interface MigrationArc {
    id: string;
    source: number[]; // [lng, lat]
    target: number[];
    sourceName: string;
    targetName: string;
    value: number;
    year: number;
    direction: 'inflow' | 'outflow'; // New field to track direction
    absValue: number; // Absolute value for sizing
}

export async function loadMigrationByCountry(
    selectedCountry: string
): Promise<MigrationArc[]> {
    const rows = await d3.csv('/data/net_migration_bilateral_total.csv');
    const arcs: MigrationArc[] = [];

    // Process each row to find flows involving the selected country
    rows.forEach(row => {
        const partner = row.partner;
        const geo = row.geo;
        const year = +row.year;
        const netValue = +row.net_value;
        
        // Skip if neither country is the selected country
        if (partner !== selectedCountry && geo !== selectedCountry) return;
        
        // Skip if it's the same country
        if (partner === geo) return;

        let sourceCountry: string;
        let targetCountry: string;
        let direction: 'inflow' | 'outflow';
        let value: number;

        if (partner === selectedCountry) {
            // Selected country is the partner (source)
            if (netValue > 0) {
                // Positive net_value means flow FROM partner TO geo (outflow)
                sourceCountry = partner;
                targetCountry = geo;
                direction = 'outflow';
                value = netValue;
            } else {
                // Negative net_value means flow FROM geo TO partner (inflow)
                sourceCountry = geo;
                targetCountry = partner;
                direction = 'inflow';
                value = Math.abs(netValue);
            }
        } else {
            // Selected country is the geo (destination)
            if (netValue > 0) {
                // Positive net_value means flow FROM partner TO geo (inflow)
                sourceCountry = partner;
                targetCountry = geo;
                direction = 'inflow';
                value = netValue;
            } else {
                // Negative net_value means flow FROM geo TO partner (outflow)
                sourceCountry = geo;
                targetCountry = partner;
                direction = 'outflow';
                value = Math.abs(netValue);
            }
        }

        const sourceCoords = countryCentroids[sourceCountry];
        const targetCoords = countryCentroids[targetCountry];

        if (!sourceCoords || !targetCoords) return;

        arcs.push({
            id: `${sourceCountry}->${targetCountry} (${year})`,
            source: sourceCoords,
            target: targetCoords,
            sourceName: iso2ToCountry(sourceCountry),
            targetName: iso2ToCountry(targetCountry),
            value: value, // Use positive value for visualization
            year,
            direction,
            absValue: value, // Use for sizing
        });
    });

    return arcs;
}
