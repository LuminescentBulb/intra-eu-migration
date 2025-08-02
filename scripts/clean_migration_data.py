import pandas as pd
import numpy as np
import pycountry
import os

EU_EEA_CH_UK = [
    'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
    'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
    'UK','CH','NO','IS','LI'
]

def clean_imm5prv(file_path):
    df = pd.read_csv(file_path, sep='\t')

    # Detect and parse dimensions from first column
    first_col_name = df.columns[0]
    dimension_cols = first_col_name.split(',')

    # Rename that column so we can split it safely
    df = df.rename(columns={first_col_name: 'dimensions'})
    dim_df = df['dimensions'].str.split(',', expand=True)
    dim_df.columns = dimension_cols

    # Combine dimensions with time series data
    time_cols = df.columns[1:]
    new_df = pd.concat([dim_df, df[time_cols]], axis=1)
    new_df.columns = list(dim_df.columns) + [col.strip() for col in time_cols]

    # Rename geo column
    new_df = new_df.rename(columns={col: 'geo' for col in new_df.columns if '\\' in col})

    # Fix id_vars
    dimension_cols = ['geo' if '\\' in col else col for col in dimension_cols]

    # Replace "EL" with "GR" for compatibility (EL is the old ISO code for Greece)
    geo_col = [col for col in new_df.columns if '\\' in col][0] if any('\\' in col for col in new_df.columns) else 'geo'
    partner_col = [col for col in new_df.columns if col in ['partner', 'citizen', 'dest']][0] if any(col in new_df.columns for col in ['partner', 'citizen', 'dest']) else 'partner'
    
    # Replace EL with GR in both geo and partner columns
    if geo_col in new_df.columns:
        new_df[geo_col] = new_df[geo_col].replace('EL', 'GR')
    if partner_col in new_df.columns:
        new_df[partner_col] = new_df[partner_col].replace('EL', 'GR')

    # Melt to long format
    df_long = new_df.melt(
        id_vars=dimension_cols, var_name='year', value_name='value'
    )

    # Get all ISO 3166-1 alpha-2 country codes (official countries only)
    ISO_COUNTRY_CODES = {country.alpha_2 for country in pycountry.countries}

    # Combine EU/EFTA/UK with ISO countries
    VALID_COUNTRIES = set(EU_EEA_CH_UK).union(ISO_COUNTRY_CODES)

    # Apply strict filtering for ISO countries
    df_long = df_long[df_long['partner'].isin(VALID_COUNTRIES)]
    df_long = df_long[df_long['geo'].isin(VALID_COUNTRIES)]

    # Group non-EU/EEA/CH/UK as "OTHER"
    df_long['partner'] = df_long['partner'].apply(
        lambda x: x if x in EU_EEA_CH_UK else 'OTHER'
    )
    df_long['geo'] = df_long['geo'].apply(
        lambda x: x if x in EU_EEA_CH_UK else 'OTHER'
    )

    # Clean values
    df_long['value'] = df_long['value'].str.replace(r'[a-zA-Z]', '', regex=True).replace(':', np.nan)
    df_long['value'] = pd.to_numeric(df_long['value'], errors='coerce')
    df_long['year'] = pd.to_numeric(df_long['year'].str.strip(), errors='coerce')
    df_long = df_long[df_long['value'].notna()]

    # Filter
    df_long = df_long[df_long['agedef'] == 'COMPLET']
    df_long = df_long.drop(columns=['freq', 'unit', 'agedef'])

    # Drop redundant A → A rows
    df_long = df_long[df_long['partner'] != df_long['geo']]

    # Final aggregation step to collapse duplicated OTHER entries
    df_long = (
        df_long
        .groupby(['partner', 'geo', 'year', 'age', 'sex'], as_index=False)
        .agg({'value': 'sum'})
    )

    return df_long

def save_cleaned_versions(df, out_dir):
    os.makedirs(out_dir, exist_ok=True)

    # Total flows
    df_total = df[(df['age'] == 'TOTAL') & (df['sex'] == 'T')].copy()
    df_total = df_total[['partner', 'geo', 'year', 'value']]
    df_total.to_csv(os.path.join(out_dir, 'immigration_bilateral_total.csv'), index=False)

    # Age group flows
    df_age = df[(df['sex'] == 'T') & (df['age'] != 'TOTAL')].copy()
    df_age = df_age[['partner', 'geo', 'year', 'age', 'value']]
    df_age.to_csv(os.path.join(out_dir, 'immigration_bilateral_by_age.csv'), index=False)

    # Net migration
    df_net = df_total.copy()
    df_rev = df_net.rename(columns={'partner': 'geo', 'geo': 'partner', 'value': 'rev_value'})
    df_net = df_net.merge(df_rev, on=['partner', 'geo', 'year'], how='left')
    df_net['rev_value'] = df_net['rev_value'].fillna(0)
    df_net['net_value'] = df_net['value'] - df_net['rev_value']
    df_net = df_net[['partner', 'geo', 'year', 'net_value']]
    df_net.to_csv(os.path.join(out_dir, 'net_migration_bilateral_total.csv'), index=False)

    print("Files saved:")
    print(" - immigration_bilateral_total.csv")
    print(" - immigration_bilateral_by_age.csv")
    print(" - net_migration_bilateral_total.csv")

def main():
    data_path = "../data/raw/estat_migr_imm5prv.tsv"
    output_path = "../data/cleaned/"
    df_cleaned = clean_imm5prv(data_path)
    save_cleaned_versions(df_cleaned, output_path)

if __name__ == "__main__":
    main()
