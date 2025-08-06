# Embedding the EU Migration Dashboard

This dashboard can be easily embedded on other websites using iframes. The dashboard automatically adapts its layout and functionality when embedded.

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

The dashboard supports various URL parameters for customization:

### Core Parameters
- `embedded=true` - Enables embedded mode (required)
- `compact=true` - Enables compact mode for smaller containers

### Data Parameters
- `country=XX` - Set initial country (e.g., `country=DE` for Germany)
- `year=YYYY` - Set initial year (2004-2023)

### Examples

**Basic embedded dashboard:**
```
https://eu-dashboard.stellux.org/?embedded=true
```

**Compact mode:**
```
https://eu-dashboard.stellux.org/?embedded=true&compact=true
```

**Pre-configured for Germany in 2020:**
```
https://eu-dashboard.stellux.org/?embedded=true&country=DE&year=2020
```

**Compact mode with specific country:**
```
https://eu-dashboard.stellux.org/?embedded=true&compact=true&country=FR
```

## Available Countries

Use these country codes in the `country` parameter:

- `RO` - Romania
- `DE` - Germany
- `FR` - France
- `IT` - Italy
- `ES` - Spain
- `PL` - Poland
- `NL` - Netherlands
- `BE` - Belgium
- `AT` - Austria
- `SE` - Sweden
- `DK` - Denmark
- `FI` - Finland
- `PT` - Portugal
- `IE` - Ireland
- `LU` - Luxembourg
- `MT` - Malta
- `CY` - Cyprus
- `EE` - Estonia
- `LV` - Latvia
- `LT` - Lithuania
- `SI` - Slovenia
- `CZ` - Czech Republic
- `SK` - Slovakia
- `HU` - Hungary
- `HR` - Croatia
- `BG` - Bulgaria
- `GR` - Greece

## Embedding Features

### Automatic Adaptations
When embedded, the dashboard automatically:
- Starts with the sidebar closed for more map space
- Uses smaller fonts and compact spacing
- Removes unnecessary margins and padding
- Optimizes for iframe display

### Compact Mode
When `compact=true` is used:
- Further reduces font sizes
- Minimizes padding and margins
- Optimizes for smaller containers
- Reduces sidebar width limits

### Responsive Design
The dashboard is fully responsive and will adapt to:
- Different screen sizes
- Various aspect ratios
- Mobile devices
- Different container sizes

## Security Considerations

The dashboard includes security headers that allow embedding:
- `X-Frame-Options: ALLOWALL`
- `Content-Security-Policy: frame-ancestors 'self' *`

## Performance Tips

1. **Use appropriate iframe dimensions** - Don't make the iframe too small
2. **Consider loading time** - The dashboard loads migration data on demand
3. **Mobile optimization** - Use responsive iframe containers for mobile
4. **Caching** - The dashboard can be cached by browsers

## Troubleshooting

### Common Issues

**Dashboard doesn't load in iframe:**
- Ensure the domain allows iframe embedding
- Check that `embedded=true` parameter is included
- Verify the URL is accessible

**Dashboard appears cut off:**
- Increase iframe height
- Use responsive iframe container
- Check for CSS conflicts on parent page

**Performance issues:**
- Reduce iframe size if necessary
- Consider using compact mode
- Ensure stable internet connection

### Browser Compatibility

The dashboard works in all modern browsers:
- Chrome/Chromium
- Firefox
- Safari
- Edge

## Example Implementation

Here's a complete example of embedding the dashboard:

```html
<!DOCTYPE html>
<html>
<head>
    <title>EU Migration Dashboard</title>
    <style>
        .dashboard-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
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
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <h1>EU Migration Patterns</h1>
        <div class="responsive-iframe">
            <iframe 
                src="https://eu-dashboard.stellux.org/?embedded=true&compact=true" 
                title="EU Migration Dashboard"
                allowfullscreen>
            </iframe>
        </div>
    </div>
</body>
</html>
```

## Support

For questions about embedding the dashboard, please refer to the main project documentation or create an issue in the project repository. 