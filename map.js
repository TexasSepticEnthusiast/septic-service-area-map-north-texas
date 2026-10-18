"use strict";

class OutWestSepticServiceAreaMap {
  static normalize(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Map data is missing.");
    const items = [];
    const add = (point, kind) => {
      if (!point || typeof point.name !== "string" || !point.name.trim() || point.name.length > 200 ||
          typeof point.lat !== "number" || !Number.isFinite(point.lat) || point.lat < -90 || point.lat > 90 ||
          typeof point.lon !== "number" || !Number.isFinite(point.lon) || point.lon < -180 || point.lon > 180) {
        throw new Error("A configured map point has an invalid name or coordinates.");
      }
      items.push({name: point.name.trim(), lat: point.lat, lon: point.lon, kind});
    };
    if (data.reference) add(data.reference, "reference");
    for (const [key, kind] of [["counties", "county"], ["towns", "town"], ["outOfArea", "excluded"]]) {
      if (data[key] !== undefined && !Array.isArray(data[key])) throw new Error(`Map ${key} must be a list.`);
      for (const point of data[key] || []) add(point, kind);
    }
    return items;
  }

  static descriptions = {
    reference: "Approximate reference point, not an office or meeting address.",
    county: "Priority county reference point, not a county boundary or whole-county service guarantee.",
    town: "Approximate community reference. Confirm the actual property location and county.",
    excluded: "Excluded from the configured service targets."
  };

  static popup(point, doc = document) {
    const container = doc.createElement("div");
    const title = doc.createElement("strong");
    title.textContent = point.name;
    const description = doc.createElement("p");
    description.textContent = this.descriptions[point.kind];
    container.append(title, description);
    return container;
  }

  constructor(data, doc = document) {
    this.doc = doc;
    this.button = doc.getElementById("load-map");
    this.status = doc.getElementById("map-status");
    this.map = null;
    this.busy = false;
    try {
      this.points = OutWestSepticServiceAreaMap.normalize(data);
      const list = doc.getElementById("area-list");
      list.replaceChildren();
      const labels = {reference: "approximate reference", county: "priority county reference", town: "community reference", excluded: "excluded target"};
      for (const point of this.points) {
        const item = doc.createElement("li");
        item.textContent = `${point.name} - ${labels[point.kind]}`;
        list.append(item);
      }
      if (!this.points.length) throw new Error("No map locations are configured.");
      this.button.disabled = false;
      this.status.textContent = "The location list is ready. Load the interactive map if needed.";
      this.button.addEventListener("click", () => this.load());
    } catch (error) {
      this.button.disabled = true;
      this.status.textContent = `${error.message} Check the official service-area information below.`;
    }
  }

  async loadLeaflet() {
    const resource = (tag, attributes) => new Promise((resolve, reject) => {
      const element = this.doc.createElement(tag);
      Object.assign(element, attributes);
      const timeout = setTimeout(() => { element.remove(); reject(new Error("Map library timed out.")); }, 15000);
      element.onload = () => { clearTimeout(timeout); resolve(); };
      element.onerror = () => { clearTimeout(timeout); element.remove(); reject(new Error("Map library could not load.")); };
      this.doc.head.append(element);
    });
    await Promise.all([
      resource("link", {rel: "stylesheet", href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=", crossOrigin: "anonymous"}),
      resource("script", {src: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", integrity: "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=", crossOrigin: "anonymous"})
    ]);
    if (!globalThis.L) throw new Error("Map library is unavailable.");
    return globalThis.L;
  }

  async load() {
    if (this.busy || this.map || !this.points?.length) return;
    this.busy = true;
    this.button.disabled = true;
    this.status.textContent = "Loading the interactive map...";
    try {
      const L = await this.loadLeaflet();
      const host = this.doc.getElementById("map");
      host.hidden = false;
      this.map = L.map(host, {scrollWheelZoom: false});
      this.map.fitBounds(this.points.map(point => [point.lat, point.lon]), {padding: [35, 35], maxZoom: 11});
      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      tiles.on("tileerror", () => { this.status.textContent = "Some base-map tiles could not load. Reference markers and the location list remain available."; });
      tiles.addTo(this.map);
      const symbols = {reference: "R", county: "C", town: "T", excluded: "X"};
      for (const point of this.points) {
        const icon = L.divIcon({className: `ows-pin ows-${point.kind}`, html: `<div class="pin-inner">${symbols[point.kind]}</div>`, iconSize: [28, 28], iconAnchor: [14, 14]});
        const marker = L.marker([point.lat, point.lon], {icon, title: point.name, alt: point.name})
          .addTo(this.map).bindPopup(OutWestSepticServiceAreaMap.popup(point, this.doc));
        marker.getElement().setAttribute("aria-label", point.name);
      }
      this.status.textContent = "Interactive map loaded. All pins are approximate references; none defines a service boundary.";
    } catch {
      if (this.map) { this.map.remove(); this.map = null; }
      this.doc.getElementById("map").hidden = true;
      this.status.textContent = "The interactive map could not load. Use the location list and official contact link, or try again.";
    } finally {
      this.busy = false;
      this.button.disabled = Boolean(this.map);
    }
  }
}

if (typeof module !== "undefined" && module.exports) module.exports = {OutWestSepticServiceAreaMap};
if (typeof document !== "undefined") new OutWestSepticServiceAreaMap(globalThis.OWS_DATA);
