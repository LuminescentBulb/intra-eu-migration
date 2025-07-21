# Intra-EU Migration Dashboard

A data analytics and visualization project to explore how **free movement within the EU** has shaped **population flows, demographics, and regional economic divergence** from **2004 (Eastern enlargement of EU) to the present**.

---

### Data Cleaning

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

_TODO_
