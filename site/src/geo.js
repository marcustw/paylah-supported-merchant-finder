export function distanceKm(a, b) {
  const radians = n => n * Math.PI / 180;
  const dLat = radians(b.lat - a.lat), dLng = radians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function filterVendors(vendors, query = '', origin = null, radius = 'all') {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return vendors.map(v => ({ ...v, distance: origin ? distanceKm(origin, v) : null }))
    .filter(v => terms.every(term => `${v.name} ${v.address} ${v.postal}`.toLowerCase().includes(term)))
    .filter(v => !origin || radius === 'all' || v.distance <= Number(radius))
    .sort((a, b) => origin ? a.distance - b.distance || a.name.localeCompare(b.name) : a.name.localeCompare(b.name));
}
export function formatDistance(km) { return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`; }
