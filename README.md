# Intra-EU Migration Dashboard

A data analytics and visualization project to explore how **free movement within the EU** has shaped **population flows, demographics, and regional economic divergence** from **2004 (Eastern enlargement of EU) to the present**.

## 🚀 Live Dashboard

The interactive dashboard is built with Next.js and Deck.gl, featuring:

- **Interactive Migration Map**: Real-time visualization of migration flows between EU countries
- **Time Series Animation**: Animate through years 2004-2023 to see migration patterns evolve
- **Country Selection**: Click on countries to focus on their specific migration flows
- **Top Migrants Analysis**: Real-time ranking of countries with highest inflows/outflows
- **EU Aggregates**: Comprehensive statistics across all EU/EEA countries
- **Responsive Design**: Collapsible sidebar with resizeable controls panel

### Key Features

- **Arc Visualization**: Migration flows displayed as curved arcs with color coding (red for outflows, blue for inflows)
- **Top Flows Highlighting**: Top 10 migration flows are highlighted with thicker, more prominent arcs
- **Year-by-Year Analysis**: Step through or animate through 20 years of migration data
- **Multi-tab Interface**: 
  - Top Migrants: Real-time rankings
  - Migration Data: Detailed flow statistics
  - Statistics: Aggregate analysis
  - EU Aggregates: Cross-country comparisons

---

## 📊 Data Processing

The raw Eurostat `.tsv` files (e.g. `estat_migr_imm5prv.tsv`) are cleaned using a Python script that:

- Parses the wide-format `.tsv` into a tidy long format
- Filters to rows where:
  - `agedef = COMPLET` (standard age breakdown only)
  - `unit = NR` (number of people)
  - `freq = A` (annual data)
- Drops columns: `freq`, `unit`, `agedef`
- Excludes all rows where the origin (`partner`) and destination (`geo`) country are the same (A → A)
- Removes duplicate or ambiguous country codes (e.g. `EU28_FOR`, `CC8_22_FOR`, `AU-NZ`) from the dataset entirely
- Aggregates all **non-EU free movement countries** into a single `"OTHER"` category
- Produces three cleaned datasets:
  1. **Total bilateral migration** — only rows where `age = TOTAL` and `sex = T` (no breakdown)
  2. **Bilateral migration by age group** — retains `age`, sums over all `sex`
  3. **Net bilateral migration** — computed as `(partner → geo) - (geo → partner)` for each year and pair

### Countries Used in Cleaning (`EU_EEA_CH_UK`)

| Code | Country            |
|------|--------------------|
| AT   | Austria            |
| BE   | Belgium            |
| BG   | Bulgaria           |
| HR   | Croatia            |
| CY   | Cyprus             |
| CZ   | Czechia            |
| DK   | Denmark            |
| EE   | Estonia            |
| FI   | Finland            |
| FR   | France             |
| DE   | Germany            |
| GR   | Greece             |
| HU   | Hungary            |
| IE   | Ireland            |
| IT   | Italy              |
| LV   | Latvia             |
| LT   | Lithuania          |
| LU   | Luxembourg         |
| MT   | Malta              |
| NL   | Netherlands        |
| PL   | Poland             |
| PT   | Portugal           |
| RO   | Romania            |
| SK   | Slovakia           |
| SI   | Slovenia           |
| ES   | Spain              |
| SE   | Sweden             |
| UK   | United Kingdom     |
| CH   | Switzerland        |
| NO   | Norway             |
| IS   | Iceland            |
| LI   | Liechtenstein      |

---

## 🔍 Key Insights & Analysis

### Labor Pool Winners and Losers

Based on the comprehensive migration data analysis from 2004-2023, several clear patterns emerge:

#### **Biggest Winners in Labor Pool Growth:**

1. **Germany** - The undisputed champion of EU migration, consistently receiving the highest inflows of working-age migrants, particularly from Eastern European countries following the 2004 enlargement.

2. **United Kingdom** - Prior to Brexit, the UK was a major destination for EU workers, especially from Poland, Romania, and other Eastern European countries seeking better economic opportunities.

3. **Spain** - Experienced significant inflows during the pre-2008 economic boom, though patterns shifted dramatically during the financial crisis.

4. **Italy** - Became an important destination for Eastern European workers, particularly in agriculture and service sectors.

#### **Major Labor Pool Contributors:**

1. **Poland** - The largest source of EU migrants, with millions of Poles moving to Germany, UK, and other Western European countries since 2004.

2. **Romania** - Second-largest contributor, with significant flows to Italy, Spain, and Germany, especially following Romania's 2007 EU accession.

3. **Bulgaria** - Similar patterns to Romania, with substantial outflows following 2007 EU accession.

4. **Lithuania, Latvia, Estonia** - The Baltic states have experienced significant population outflows, particularly to the UK and Nordic countries.

### Migration Pattern Evolution

- **2004-2007**: Initial Eastern enlargement led to massive flows from new member states to established EU economies
- **2008-2013**: Financial crisis dramatically altered migration patterns, with Spain and Ireland experiencing net outflows
- **2014-2016**: Recovery period with renewed flows to Germany and UK
- **2017-2020**: Brexit uncertainty and COVID-19 pandemic disrupted traditional patterns
- **2021-2023**: Post-Brexit and post-pandemic recovery, with Germany remaining the primary destination

### Economic Implications

- **Brain Drain**: Eastern European countries have experienced significant loss of skilled workers
- **Labor Market Integration**: Western European countries have benefited from flexible, mobile labor pools
- **Regional Disparities**: Migration has exacerbated economic differences between Eastern and Western EU
- **Demographic Shifts**: Aging populations in Eastern Europe accelerated by outmigration of working-age populations

---

## 🛠️ Technical Implementation

### Frontend Stack
- **Next.js 14** with App Router
- **Deck.gl** for high-performance geospatial visualizations
- **MapLibre GL** for base maps
- **TypeScript** for type safety
- **Tailwind CSS** for styling

### Data Processing
- **Python** with pandas for data cleaning and transformation
- **D3.js** for data loading and manipulation in the browser
- **Net migration calculations** for accurate flow representation

### Key Components
- `MigrationMap.tsx`: Interactive map with arc visualizations
- `Controls.tsx`: Multi-tab control panel with real-time statistics
- `countryLoader.tsx`: Data processing and migration arc generation
- `clean_migration_data.py`: Python script for data cleaning and transformation

---

## 📁 Project Structure

```
eu-migration/
├── dashboard/                 # Next.js frontend application
│   ├── src/app/
│   │   ├── components/       # React components
│   │   │   ├── Map.tsx      # Interactive migration map
│   │   │   ├── Controls.tsx # Control panel with statistics
│   │   │   └── countryLoader.tsx # Data processing
│   │   └── page.tsx         # Main dashboard page
│   └── public/data/         # Processed data files
├── data/
│   ├── raw/                 # Original Eurostat data
│   └── cleaned/             # Processed datasets
└── scripts/
    └── clean_migration_data.py # Data cleaning script
```

---

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   cd dashboard
   npm install
   ```

2. **Run the Development Server**:
   ```bash
   npm run dev
   ```

3. **Process Data** (if needed):
   ```bash
   cd scripts
   python clean_migration_data.py
   ```

The dashboard will be available at `http://localhost:3000`

---

## 📈 Data Sources

- **Eurostat Migration Statistics**: `estat_migr_imm5prv.tsv`
- **Geographic Data**: Europe GeoJSON for country boundaries
- **Country Centroids**: Custom mapping for accurate arc visualization

---

## 🎯 Future Enhancements

- Age group analysis and visualization
- Economic correlation analysis
- Real-time data updates
- Mobile-responsive design improvements
- Export functionality for analysis results
