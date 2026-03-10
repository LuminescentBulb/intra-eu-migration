# Embedding the EU Migration & Capital Flows Dashboard

This dashboard can be embedded on other websites using iframes. It automatically adapts its layout when embedded.

## Basic Embedding

### Simple iframe
```html
<iframe
    src="https://eu-dashboard.stellux.org/?embedded=true"
    width="100%"
    height="600px"
    frameborder="0"
    allowfullscreen>
</iframe>
```

### Responsive iframe
```html
<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%;">
    <iframe
        src="https://eu-dashboard.stellux.org/?embedded=true"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
        allowfullscreen>
    </iframe>
</div>
```

## URL Parameters

### Core Parameters
| Parameter | Values | Description |
|-----------|--------|-------------|
| `embedded` | `true` | Enables embedded mode (required) |
| `compact` | `true` | Compact mode for smaller containers |
| `mode` | `migration` \| `capital` | Initial dashboard mode (default: `migration`) |
| `country` | ISO 2-letter code | Initial selected country (default: `RO`) |
| `year` | `2004`–`2023` (migration) or `2013`–`2024` (capital) | Initial year |

### Dashboard Modes

**Migration mode** (`mode=migration`): Shows intra-EU population flows as arcs between countries. Year range 2004–2023.

**Capital Flows mode** (`mode=capital`): Shows bilateral FDI positions and income between EU/EEA countries using a choropleth. Green = selected country is net investor, red = the other country invests more. Year range 2013–2024.

## Examples

**Migration dashboard, Germany 2020:**
```
https://eu-dashboard.stellux.org/?embedded=true&mode=migration&country=DE&year=2020
```

**Capital flows dashboard, France 2022:**
```
https://eu-dashboard.stellux.org/?embedded=true&mode=capital&country=FR&year=2022
```

**Compact capital flows, Netherlands:**
```
https://eu-dashboard.stellux.org/?embedded=true&compact=true&mode=capital&country=NL
```

**Default (migration, Romania 2016):**
```
https://eu-dashboard.stellux.org/?embedded=true
```

## Available Country Codes

EU member states: `AT` `BE` `BG` `HR` `CY` `CZ` `DK` `EE` `FI` `FR` `DE` `GR` `HU` `IE` `IT` `LV` `LT` `LU` `MT` `NL` `PL` `PT` `RO` `SK` `SI` `ES` `SE`

EEA + associated: `NO` `IS` `LI` `CH` `UK`

## Embedded Mode Behaviour

When `embedded=true`:
- Sidebar starts closed (more map space)
- Smaller fonts and compact spacing

When `compact=true` (in addition to the above):
- Further reduced font sizes and padding
- Narrower sidebar width limits

## Security Headers

The dashboard allows iframe embedding via:
- `X-Frame-Options: ALLOWALL`
- `Content-Security-Policy: frame-ancestors 'self' *`

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>EU Dashboard</title>
    <style>
        .responsive-iframe {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 75%;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .responsive-iframe iframe {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <!-- Migration flows -->
    <div class="responsive-iframe">
        <iframe src="https://eu-dashboard.stellux.org/?embedded=true&mode=migration&country=PL" allowfullscreen></iframe>
    </div>

    <!-- Capital flows -->
    <div class="responsive-iframe">
        <iframe src="https://eu-dashboard.stellux.org/?embedded=true&mode=capital&country=DE&year=2022" allowfullscreen></iframe>
    </div>
</body>
</html>
```
