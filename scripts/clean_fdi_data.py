import pandas as pd
import numpy as np
import os

EU_EEA_CH_UK = [
    'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
    'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
    'UK','CH','NO','IS','LI'
]

# Eurostat FDI data uses EL for Greece instead of the standard GR
REMAP = {'EL': 'GR'}

def clean_fdi_positions(file_path):
    """
    Extract bilateral FDI asset positions (stk_flow=ASS).
    geo = investing country (holds assets abroad)
    partner = host country (where assets are held)
    Result: investor, host, year, position_mio_eur
    """
    print("Loading positions file...")
    df = pd.read_csv(file_path, low_memory=False)

    # Filter to cleanest aggregate slice
    df['geo'] = df['geo'].replace(REMAP)
    df['partner'] = df['partner'].replace(REMAP)

    mask = (
        df['freq'].eq('A') &
        df['currency'].eq('MIO_EUR') &
        df['nace_r2'].eq('FDI') &
        df['fdi_item'].eq('DI__D__F') &
        df['entity'].eq('TOTAL') &
        df['stk_flow'].eq('ASS') &
        df['partner'].isin(EU_EEA_CH_UK) &
        df['geo'].isin(EU_EEA_CH_UK) &
        df['OBS_VALUE'].notna()
    )
    df = df[mask][['geo', 'partner', 'TIME_PERIOD', 'OBS_VALUE']].copy()
    df = df[df['geo'] != df['partner']]

    df = df.rename(columns={
        'geo': 'investor',
        'partner': 'host',
        'TIME_PERIOD': 'year',
        'OBS_VALUE': 'position_mio_eur',
    })
    df['year'] = pd.to_numeric(df['year'], errors='coerce')
    df['position_mio_eur'] = pd.to_numeric(df['position_mio_eur'], errors='coerce')
    df = df.dropna(subset=['year', 'position_mio_eur'])
    df['year'] = df['year'].astype(int)

    print(f"  Positions rows: {len(df)}, unique pairs: {df.groupby(['investor','host']).ngroups}")
    return df


def clean_fdi_income(file_path):
    """
    Extract bilateral FDI outward income (stk_flow=IO, fdi_item=DO__D4P__D__F).
    geo = investing country (earns income from abroad)
    partner = host country (where income is generated)
    Result: investor, host, year, income_mio_eur
    """
    print("Loading income file...")
    df = pd.read_csv(file_path, low_memory=False)

    df['geo'] = df['geo'].replace(REMAP)
    df['partner'] = df['partner'].replace(REMAP)

    mask = (
        df['freq'].eq('A') &
        df['currency'].eq('MIO_EUR') &
        df['nace_r2'].eq('FDI') &
        df['fdi_item'].eq('DO__D4P__D__F') &
        df['entity'].eq('TOTAL') &
        df['stk_flow'].eq('IO') &
        df['partner'].isin(EU_EEA_CH_UK) &
        df['geo'].isin(EU_EEA_CH_UK) &
        df['OBS_VALUE'].notna()
    )
    df = df[mask][['geo', 'partner', 'TIME_PERIOD', 'OBS_VALUE']].copy()
    df = df[df['geo'] != df['partner']]

    df = df.rename(columns={
        'geo': 'investor',
        'partner': 'host',
        'TIME_PERIOD': 'year',
        'OBS_VALUE': 'income_mio_eur',
    })
    df['year'] = pd.to_numeric(df['year'], errors='coerce')
    df['income_mio_eur'] = pd.to_numeric(df['income_mio_eur'], errors='coerce')
    df = df.dropna(subset=['year', 'income_mio_eur'])
    df['year'] = df['year'].astype(int)

    print(f"  Income rows: {len(df)}, unique pairs: {df.groupby(['investor','host']).ngroups}")
    return df


def merge_and_save(df_pos, df_inc, out_dir):
    os.makedirs(out_dir, exist_ok=True)

    df = df_pos.merge(df_inc, on=['investor', 'host', 'year'], how='outer')

    # Drop rows where both values are missing
    df = df.dropna(subset=['position_mio_eur', 'income_mio_eur'], how='all')

    # Sort for readability
    df = df.sort_values(['investor', 'host', 'year']).reset_index(drop=True)

    out_path = os.path.join(out_dir, 'fdi_bilateral.csv')
    df.to_csv(out_path, index=False)

    print(f"\nSaved: fdi_bilateral.csv")
    print(f"  Total rows:     {len(df)}")
    print(f"  With position:  {df['position_mio_eur'].notna().sum()}")
    print(f"  With income:    {df['income_mio_eur'].notna().sum()}")
    print(f"  Year range:     {int(df['year'].min())} – {int(df['year'].max())}")
    print(f"  Unique pairs:   {df.groupby(['investor','host']).ngroups}")


def main():
    raw_dir = "../data/raw"
    out_dir = "../data/cleaned"

    df_pos = clean_fdi_positions(os.path.join(raw_dir, "bop_fdi6_pos_linear_2_0.csv"))
    df_inc = clean_fdi_income(os.path.join(raw_dir, "bop_fdi6_inc_linear_2_0.csv"))
    merge_and_save(df_pos, df_inc, out_dir)


if __name__ == "__main__":
    main()
