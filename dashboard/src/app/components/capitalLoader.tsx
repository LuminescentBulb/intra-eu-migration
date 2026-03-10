import * as d3 from 'd3';
import rawCountryCentroids from './countryCentroids.json';
import { iso2ToCountry } from '@/utils/ISO2Country';

const countryCentroids: { [key: string]: number[] } = rawCountryCentroids;

export interface FDIRecord {
    investor: string;
    host: string;
    year: number;
    position_mio_eur: number | null;
    income_mio_eur: number | null;
}

export interface CapitalArc {
    id: string;
    source: number[];
    target: number[];
    investorCode: string;
    hostCode: string;
    investorName: string;
    hostName: string;
    position: number;      // abs value for arc sizing (millions EUR)
    income: number | null;
    year: number;
    direction: 'outward' | 'inward'; // relative to selected country
}

let cachedRecords: FDIRecord[] | null = null;

export async function loadFDIData(): Promise<FDIRecord[]> {
    if (cachedRecords) return cachedRecords;

    const rows = await d3.csv('/data/fdi_bilateral.csv');
    cachedRecords = rows.map(row => ({
        investor: row.investor,
        host: row.host,
        year: +row.year,
        position_mio_eur: row.position_mio_eur !== '' && row.position_mio_eur != null ? +row.position_mio_eur : null,
        income_mio_eur: row.income_mio_eur !== '' && row.income_mio_eur != null ? +row.income_mio_eur : null,
    }));
    return cachedRecords;
}

export async function loadCapitalArcs(
    selectedCountry: string,
    year: number
): Promise<CapitalArc[]> {
    const records = await loadFDIData();
    const arcs: CapitalArc[] = [];

    records
        .filter(r => r.year === year && (r.investor === selectedCountry || r.host === selectedCountry))
        .forEach(r => {
            const isOutward = r.investor === selectedCountry;
            const partnerCode = isOutward ? r.host : r.investor;
            const positionValue = r.position_mio_eur;

            if (!positionValue || positionValue <= 0) return;

            const sourceCode = r.investor;
            const targetCode = r.host;
            const sourceCoords = countryCentroids[sourceCode];
            const targetCoords = countryCentroids[targetCode];
            if (!sourceCoords || !targetCoords) return;

            arcs.push({
                id: `${r.investor}->${r.host}(${year})`,
                source: sourceCoords,
                target: targetCoords,
                investorCode: r.investor,
                hostCode: r.host,
                investorName: iso2ToCountry(r.investor),
                hostName: iso2ToCountry(r.host),
                position: positionValue,
                income: r.income_mio_eur,
                year,
                direction: isOutward ? 'outward' : 'inward',
            });
        });

    return arcs;
}

/** Look up bilateral detail between selected country and a hovered country for one year. */
export function getBilateralDetail(
    records: FDIRecord[],
    selectedCountry: string,
    otherCountry: string,
    year: number
): {
    selectedInOther: FDIRecord | null;
    otherInSelected: FDIRecord | null;
    netPosition: number | null;
    netIncome: number | null;
} {
    const selectedInOther = records.find(
        r => r.investor === selectedCountry && r.host === otherCountry && r.year === year
    ) ?? null;
    const otherInSelected = records.find(
        r => r.investor === otherCountry && r.host === selectedCountry && r.year === year
    ) ?? null;

    const netPosition =
        selectedInOther?.position_mio_eur != null && otherInSelected?.position_mio_eur != null
            ? selectedInOther.position_mio_eur - otherInSelected.position_mio_eur
            : selectedInOther?.position_mio_eur != null
            ? selectedInOther.position_mio_eur
            : otherInSelected?.position_mio_eur != null
            ? -otherInSelected.position_mio_eur
            : null;

    const netIncome =
        selectedInOther?.income_mio_eur != null && otherInSelected?.income_mio_eur != null
            ? selectedInOther.income_mio_eur - otherInSelected.income_mio_eur
            : selectedInOther?.income_mio_eur != null
            ? selectedInOther.income_mio_eur
            : otherInSelected?.income_mio_eur != null
            ? -otherInSelected.income_mio_eur
            : null;

    return { selectedInOther, otherInSelected, netPosition, netIncome };
}
