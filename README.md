# Out West Septic priority-area map

An interactive reference map for discussing property locations around Palo Pinto County and nearby priority areas. `OutWestSepticServiceAreaMap` validates configured points, renders their names as text, and fits all displayed markers into the map view.

Pins are approximate references. They are not official county boundaries, an office location, a service radius, or a guarantee that a property is served. The map does not calculate property eligibility. Confirm the actual property location and county with Out West Septic.

## Run locally

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`. No build step is needed for the static site.

## Data and source

Edit `data.js` to change the approximate reference points. It exposes `OutWestSepticAreaData` and the browser-compatible `window.OWS_DATA` value. The optional groups are:

```js
{
  reference: { name: "Example reference", lat: 32.78, lon: -98.32 },
  counties: [{ name: "Palo Pinto County", lat: 32.75, lon: -98.30 }],
  towns: [],
  outOfArea: []
}
```

The `reference` field replaces the former unsupported `hq` claim. Coordinates must be finite numeric WGS84 latitude/longitude values in their valid ranges. Empty data disables the map with an explanation; invalid data is rejected rather than silently misplotted. Labels are literal text, including in Leaflet popups. Do not publish customer addresses, access information, or other private notes in this file.

Priority-area wording and the displayed phone number were checked against the [Out West Septic official website](https://outwestseptic.com/) on October 18, 2026. Its map description explicitly treats the working area as an illustration and asks visitors to confirm the actual property location and county. The included coordinates are approximate project reference points, not surveyed or authoritative geographic data. Parker and Tarrant appear only as excluded targets.

Marker labels describe their role:

- **R:** approximate reference location, not an office address.
- **C:** priority county reference, without a whole-county service guarantee.
- **T:** community reference; confirm the property's actual county.
- **X:** excluded target.

## External resources and fallback

The location list renders before any map-provider requests. Clicking **Load interactive map** fetches pinned Leaflet 1.9.4 JavaScript/CSS from `unpkg.com`, using integrity checks, then requests OpenStreetMap tiles. These providers receive network information such as IP addresses and requested map views. The page does not request device geolocation or include analytics.

Nearby pins can overlap at the overview zoom. Zoom in, or focus a named marker with the keyboard and press Enter to open its details.

If Leaflet cannot load, the list remains available and the button permits retry. Tile failures are reported while markers and the list remain usable. With JavaScript disabled, the page supplies a brief fallback and the official contact link. This is an online base map; it does not provide offline geographic data.

Leaflet accepts HTML strings for popups. This implementation instead passes DOM elements populated with `textContent`, as supported by the [Leaflet reference](https://leafletjs.com/reference.html#layer-bindpopup), so configured labels cannot become executable popup markup.

## Tests

Node 22 or newer:

```sh
npm ci
npm test
npx playwright install chromium --only-shell
npm run test:browser
```

Node tests cover data validation and geographic boundaries. Chromium tests load the real pinned Leaflet library from the local test dependency, intercept tile/CDN requests, and check marker visibility, inert markup, empty/invalid data, provider failures, optional loading, and mobile layout. The tests do not send location requests to public map providers. CI pins action commits and dependency versions; local screenshots and test output stay under ignored `output/playwright/`.

## License

MIT. See `LICENSE`. Leaflet is BSD-2-Clause; OpenStreetMap data is ODbL.
