// Approximate planning reference points for Out West Septic, not service boundaries.
// Priority-area source: https://outwestseptic.com/ (checked 2026-10-18).
// Coordinates are illustrative and do not identify an office or property.
// Coordinates are WGS84 lat/lon. Centroids are approximate.

const OutWestSepticAreaData = {
  reference: {
    name: "Lone Camp vicinity",
    lat: 32.78,
    lon: -98.32
  },
  counties: [
    { name: "Palo Pinto County",     lat: 32.75, lon: -98.30 },
    { name: "Hood County",           lat: 32.43, lon: -97.83 },
    { name: "Erath County",          lat: 32.23, lon: -98.22 },
    { name: "Stephens County",       lat: 32.71, lon: -98.83 },
    { name: "Young County",          lat: 33.18, lon: -98.69 },
    { name: "Jack County",           lat: 33.23, lon: -98.17 },
    { name: "Eastland County",       lat: 32.40, lon: -98.83 }
  ],
  towns: [
    { name: "Mineral Wells",     lat: 32.81, lon: -98.11 },
    { name: "Graford",           lat: 32.94, lon: -98.25 },
    { name: "Possum Kingdom Lake", lat: 32.87, lon: -98.43 },
    { name: "Eastland",          lat: 32.40, lon: -98.82 }
  ],
  outOfArea: [
    { name: "Parker County", lat: 32.78, lon: -97.80 },
    { name: "Tarrant County", lat: 32.77, lon: -97.29 }
  ]
};

if (typeof module !== "undefined" && module.exports) module.exports = OutWestSepticAreaData;
if (typeof window !== "undefined") window.OWS_DATA = OutWestSepticAreaData;
