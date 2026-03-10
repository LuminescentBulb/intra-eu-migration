# EU Migration & Capital Flows Dashboard

An interactive data visualization project exploring how **free movement within the EU** has shaped **population flows** and **capital investment patterns** from 2004 to the present.

## Live Dashboard

[https://eu-dashboard.stellux.org](https://eu-dashboard.stellux.org)

The dashboard has two modes, switchable via the pill at the top:

### Migration Mode (2004–2023)
- Arc visualization of bilateral migration flows between EU/EEA countries
- Color-coded by direction: red = outflows, blue = inflows
- Arc thickness scales with flow size; top 10 flows are highlighted
- Sidebar: top migrants ranking, detailed flow data, statistics, EU aggregates

### Capital Flows Mode (2013–2024)
- Choropleth map of bilateral FDI positions relative to the selected country
  - Green = selected country is net investor in that country
  - Red = that country invests more in the selected country
- Hover tooltip showing bilateral investment positions, annual income, and net figures in both directions
- Sidebar: FDI overview (total outward/inward position + income), top partners, EU-wide net investor rankings

---

## Data Sources & Processing

### Migration
Raw Eurostat file: `estat_migr_imm5prv.tsv`

Cleaned with `scripts/clean_migration_data.py`:
- Filters: `agedef=COMPLET`, `unit=NR`, `freq=A`, `age=TOTAL`, `sex=T`
- Aggregates non-EU/EEA countries into `OTHER`
- Outputs bilateral flows, by-age flows, and net flows

### Capital Flows (FDI)
Raw Eurostat files: `bop_fdi6_pos_linear_2_0.csv` (positions), `bop_fdi6_inc_linear_2_0.csv` (income)

Cleaned with `scripts/clean_fdi_data.py`:
- Position filter: `stk_flow=ASS` (outward assets), `fdi_item=DI__D__F`, `entity=TOTAL`, `currency=MIO_EUR`
- Income filter: `stk_flow=IO`, `fdi_item=DO__D4P__D__F`
- Greece remapped from Eurostat code `EL` → `GR`
- Merged into `fdi_bilateral.csv` with columns: `investor, host, year, position_mio_eur, income_mio_eur`
- Coverage: 937 bilateral pairs, 2007–2024 (slider restricted to 2013–2024 for data density)

> **Note on FDI data**: Positions use the *immediate counterpart* (IMM) methodology. Investment routed through Luxembourg or Netherlands holding companies is recorded as going to those countries, not the ultimate destination. Income flows bypass holding companies and are a more direct measure of real bilateral exposure.

---

## Countries Covered

EU member states, EEA (NO, IS, LI), Switzerland, and United Kingdom. ISO 2-letter codes throughout; Greece is stored as `GR` (Eurostat source uses `EL`, remapped during cleaning).

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Maps | Deck.gl (GeoJsonLayer, ArcLayer), MapLibre GL, react-map-gl |
| Data loading | D3.js (CSV parsing), in-browser caching |
| Data processing | Python, pandas |

---

## Project Structure

```
eu-migration/
├── dashboard/                 # Next.js application
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── Map.tsx              # Migration arc map
│   │   │   ├── CapitalMap.tsx       # FDI choropleth map
│   │   │   ├── MapStyleSwitcher.tsx # Shared map style toggle
│   │   │   ├── Controls.tsx         # Sidebar panel (both modes)
│   │   │   ├── countryLoader.tsx    # Migration data loader
│   │   │   └── capitalLoader.tsx    # FDI data loader
│   │   └── dashboard.tsx            # Top-level layout + mode switching
│   ├── public/data/
│   │   ├── migration_total.csv
│   │   ├── fdi_bilateral.csv
│   │   └── europe.geojson
│   └── EMBEDDING.md                 # Iframe embedding guide
├── data/
│   ├── raw/                         # Original Eurostat downloads
│   └── cleaned/                     # Processed datasets
└── scripts/
    ├── clean_migration_data.py
    └── clean_fdi_data.py
```

---

## Getting Started

```bash
cd dashboard
npm install
npm run dev
```

Dashboard runs at `http://localhost:3000`.

To reprocess data:
```bash
cd scripts
python clean_migration_data.py   # migration
python clean_fdi_data.py         # FDI
cp ../data/cleaned/fdi_bilateral.csv ../dashboard/public/data/
```

---

## Embedding

See [dashboard/EMBEDDING.md](dashboard/EMBEDDING.md) for iframe embedding options including `mode`, `country`, and `year` URL parameters.
