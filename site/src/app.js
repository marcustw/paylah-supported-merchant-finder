import { filterVendors, formatDistance } from './geo.js';
const $ = id => document.getElementById(id);
let vendors = [], visible = [], origin = null, map, clusters, userLayer, selected = null, choosing = false;
let locationRequest = 0;
const markers = new Map();
let hoverCloseTimer;
const cancelHoverClose = () => clearTimeout(hoverCloseTimer);
const scheduleHoverClose = marker => {
  cancelHoverClose();
  hoverCloseTimer = setTimeout(() => { if (!marker.pinned) marker.closePopup(); }, 300);
};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const setStatus = text => { $('location-status').textContent = text; };
function fit(items) {
  if (map && items.length) map.fitBounds(items.map(v => [v.lat, v.lng]), { padding: [35, 90], maxZoom: 15, animate: false });
}
function popup(v) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${v.name}, Singapore ${v.postal}`)}`;
  const listing = v.stallListing;
  const stalls = listing?.stalls || [];
  const stallList = stalls.length
    ? `<h4 class="stall-heading">${stalls.length} participating listings</h4><div class="stall-scroll" tabindex="0" role="region" aria-label="Participating stalls at ${esc(v.name)}"><ul class="stall-list">${stalls.map(s => `<li><span>${esc(s.name)}</span><span class="stall-unit">${s.unit === '—' ? 'Unit not listed' : esc(s.unit)}</span></li>`).join('')}</ul></div>`
    : `<p class="stall-empty">${listing ? 'No stalls are listed for this location in the supplied stall file.' : 'This location has no entry in the supplied stall file.'}</p>`;
  return `<span class="popup-tag">FROM THE SUPPORTED LIST</span><h3>${esc(v.name)}</h3><p>${esc(v.address)} ${v.postal}</p>${v.distance !== null ? `<strong>${formatDistance(v.distance)} straight-line distance</strong>` : ''}${stallList}<p class="stall-disclaimer">Confirm current eligibility with the vendor.</p><a class="directions" href="${url}" target="_blank" rel="noopener">Get directions ↗</a>`;
}
function selectVendor(id, fromMap = false) {
  selected = id;
  for (const button of document.querySelectorAll('.result')) {
    button.classList.toggle('selected', button.dataset.id === id);
    button.setAttribute('aria-pressed', String(button.dataset.id === id));
  }
  const v = visible.find(v => v.id === id);
  if (!v || !map) return;
  const marker = markers.get(id);
  cancelHoverClose();
  marker.pinned = true;
  if (!fromMap) {
    if (matchMedia('(max-width:760px)').matches) $('map').scrollIntoView({ behavior: 'instant', block: 'center' });
    clusters.zoomToShowLayer(marker, () => { cancelHoverClose(); marker.openPopup(); marker.pinned = true; });
  } else {
    const button = [...document.querySelectorAll('.result')].find(b => b.dataset.id === id);
    if (button) $('results').scrollTop = button.offsetTop - $('results').firstElementChild.offsetTop;
  }
}
function render({ refit = false } = {}) {
  cancelHoverClose();
  visible = filterVendors(vendors, $('search').value, origin, $('radius').value);
  selected = null;
  if (map) { map.stop(); map.closePopup(); }
  $('result-count').textContent = `${visible.length} location${visible.length === 1 ? '' : 's'}${origin ? ' near you' : ' to explore'}`;
  $('sort-label').textContent = origin ? 'Nearest first' : 'A–Z';
  $('clear').hidden = !$('search').value && $('radius').value === 'all';
  $('results').replaceChildren();
  if (!visible.length) {
    const empty = document.createElement('div'); empty.className = 'empty';
    empty.innerHTML = '<strong>No matching locations</strong>Try a different name or a wider distance.<br><button class="secondary">Clear filters</button>';
    empty.querySelector('button').onclick = clearFilters;
    $('results').append(empty);
  }
  if (clusters) clusters.clearLayers();
  markers.clear();
  for (const v of visible) {
    const button = document.createElement('button'); button.className = 'result'; button.dataset.id = v.id; button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `<span class="result-icon" aria-hidden="true">♨</span><span class="result-content"><strong>${esc(v.name)}</strong><small>${esc(v.address.replace(', Singapore', ''))} · ${v.postal}</small></span><span class="distance">${v.distance === null ? '↗' : formatDistance(v.distance)}</span>`;
    button.onclick = () => selectVendor(v.id);
    $('results').append(button);
    if (map) {
      const marker = L.marker([v.lat, v.lng], { title: v.name, alt: v.name, icon: L.divIcon({ className: 'vendor-icon', html: '<div class="vendor-marker"></div>', iconSize: [24, 30], iconAnchor: [12, 27], popupAnchor: [0, -24] }) }).bindPopup(popup(v));
      marker.on('mouseover', () => { if (!choosing && matchMedia('(hover: hover)').matches) { cancelHoverClose(); marker.openPopup(); } });
      marker.on('mouseout', () => scheduleHoverClose(marker));
      marker.on('popupopen', () => {
        const element = marker.getPopup().getElement();
        element.addEventListener('mouseenter', cancelHoverClose);
        element.addEventListener('mouseleave', () => scheduleHoverClose(marker));
      });
      marker.on('popupclose', () => { marker.pinned = false; });
      marker.on('click', () => selectVendor(v.id, true));
      clusters.addLayer(marker); markers.set(v.id, marker);
    }
  }
  if (refit) fit(visible);
}
function clearFilters() { $('search').value = ''; $('radius').value = 'all'; render({ refit: true }); }
function setOrigin(lat, lng, accuracy, manual = false) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) { setStatus('Location unavailable. Try choosing a point on the map.'); return; }
  origin = { lat, lng };
  $('radius').disabled = false;
  if (userLayer) map.removeLayer(userLayer);
  if (map) {
    userLayer = L.featureGroup().addTo(map);
    if (accuracy > 0) L.circle([lat, lng], { radius: accuracy, color: '#4476b8', weight: 1, fillOpacity: .08, interactive: false }).addTo(userLayer);
    L.circleMarker([lat, lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#3474b8', fillOpacity: 1 }).bindTooltip(manual ? 'Your chosen location' : 'Your location').addTo(userLayer);
  }
  setStatus(manual ? 'Distances from your chosen point · straight-line estimates.' : `Nearest first · straight-line estimates. GPS accuracy ±${Math.round(accuracy)} m.`);
  $('map-title').textContent = manual ? 'Good food near this spot.' : 'Good food near you.';
  render();
  fit([origin, ...visible.slice(0, 5)]);
}
function finishChoosing() { choosing = false; $('pick-location').classList.remove('active'); $('pick-location').textContent = '⊕ Choose a location on the map'; if (map) map.getContainer().style.cursor = ''; }
$('locate').onclick = () => {
  if (!navigator.geolocation) { setStatus('This browser does not support location. Choose a point on the map instead.'); return; }
  finishChoosing();
  const request = ++locationRequest;
  $('locate').disabled = true; setStatus('Finding your location… Allow location access when prompted.');
  navigator.geolocation.getCurrentPosition(position => {
    if (request !== locationRequest) return;
    $('locate').disabled = false;
    setOrigin(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
  }, error => {
    if (request !== locationRequest) return;
    $('locate').disabled = false;
    setStatus(error.code === 1 ? 'Location access denied. Search a place or choose a point on the map.' : error.code === 3 ? 'Location request timed out. Try again or choose a point on the map.' : 'Location unavailable. Try again or choose a point on the map.');
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
};
$('search').oninput = () => render({ refit: true });
$('radius').onchange = () => render({ refit: true });
$('clear').onclick = clearFilters;
$('overview').onclick = () => {
  finishChoosing(); ++locationRequest; $('locate').disabled = false; origin = null;
  if (userLayer) { map.removeLayer(userLayer); userLayer = null; }
  $('radius').disabled = true; $('map-title').textContent = 'An island of good food.';
  setStatus('Your location is used only on this device.'); clearFilters();
};
$('pick-location').onclick = () => {
  if (choosing) { finishChoosing(); setStatus(origin ? 'Distances from the last selected location.' : 'Your location is used only on this device.'); return; }
  ++locationRequest; $('locate').disabled = false;
  choosing = true; $('pick-location').classList.add('active'); $('pick-location').textContent = 'Tap the map to set a point · Cancel';
  map.getContainer().style.cursor = 'crosshair'; setStatus('Tap any point on the map to find nearby locations.');
};
$('about-button').onclick = () => $('about').showModal();
$('about').querySelector('.dialog-close').onclick = () => $('about').close();
$('about').onclick = e => { if (e.target === $('about')) { const r = $('about').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $('about').close(); } };
async function init() {
  try {
    const response = await fetch('vendors.json');
    if (!response.ok) throw new Error('Data unavailable');
    vendors = await response.json();
    if (!Array.isArray(vendors) || !vendors.length || vendors.some(v => !v.name || !/^\d{6}$/.test(v.postal) || !Number.isFinite(v.lat) || !Number.isFinite(v.lng))) throw new Error('Invalid data');
    const stallResponse = await fetch('stalls.json');
    if (!stallResponse.ok) throw new Error('Stall data unavailable');
    const stallListings = await stallResponse.json();
    if (!stallListings || typeof stallListings !== 'object' || Object.values(stallListings).some(c => !Array.isArray(c.stalls) || c.stalls.some(s => typeof s.name !== 'string' || typeof s.unit !== 'string'))) throw new Error('Invalid stall data');
    vendors = vendors.map(v => ({ ...v, stallListing: stallListings[v.postal] ?? null }));
  } catch {
    $('result-count').textContent = 'Couldn’t load the locations';
    $('results').innerHTML = '<div class="empty">Check your connection and reload.<br><button class="secondary" id="retry">Try again</button></div>';
    $('retry').onclick = () => location.reload(); return;
  }
  try {
    map = L.map('map', { zoomControl: false, zoomSnap: .25, minZoom: 10, maxZoom: 19 });
    map.on('popupopen', () => document.querySelector('.map-section').classList.add('details-open'));
    map.on('popupclose', () => document.querySelector('.map-section').classList.remove('details-open'));
    L.control.zoom({ position: 'topright' }).addTo(map);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    let failedTiles = 0, loadedTiles = 0;
    tiles.on('loading', () => { failedTiles = 0; loadedTiles = 0; });
    tiles.on('tileerror', () => { failedTiles++; });
    tiles.on('tileload', () => { loadedTiles++; });
    tiles.on('load', () => { $('map-error').hidden = !(failedTiles && !loadedTiles); });
    clusters = L.markerClusterGroup({ maxClusterRadius: 40, showCoverageOnHover: false, animate: false, iconCreateFunction: c => L.divIcon({ html: String(c.getChildCount()), className: 'cluster-marker', iconSize: [42, 42] }) }).addTo(map);
    map.on('click', e => { if (choosing) { finishChoosing(); setOrigin(e.latlng.lat, e.latlng.lng, 0, true); } });
    new ResizeObserver(() => map.invalidateSize()).observe($('map'));
    $('overview').disabled = false; $('pick-location').disabled = false;
  } catch {
    if (map) { map.remove(); map = null; }
    $('map-error').hidden = false; $('map-error').textContent = 'The map couldn’t load. You can still search locations and use your location to sort by distance.';
  }
  $('search').disabled = false; $('locate').disabled = false;
  render({ refit: true });
}
init();
