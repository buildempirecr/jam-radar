/* Jam Radar — live Dhaka waterlogging + jam map.
 * Plain static site: no build step, no backend, no login.
 * Data: seed reports from data/seed.json (clearly labelled demo data)
 * plus the visitor's own reports, saved in localStorage.
 * Reports expire after 3 hours.
 */
'use strict';

// ---------- Constants ----------
var DHAKA = [23.8103, 90.4125]; // Dhaka centre
var DEFAULT_ZOOM = 12;
var EXPIRY_MS = 3 * 60 * 60 * 1000; // 3 hours
var STORAGE_KEY = 'jamRadar.userReports.v1';
var SEED_URL = 'data/seed.json';

// Areas shown in the area filter (seed areas + the main Dhaka areas).
var AREA_ORDER = [
  'Mirpur', 'Dhanmondi', 'Panthapath', 'Green Road', 'Mohammadpur',
  'Kalshi', 'Uttara', 'Gulshan', 'Motijheel', 'Banani',
  'Farmgate', 'Tejgaon', 'Shyamoli', 'Badda', 'Rampura'
];

// ---------- i18n ----------
// Default language is Bangla; the toggle switches to English.
var STRINGS = {
  bn: {
    pitch: 'ঢাকার লাইভ জ্যাম ও জলাবদ্ধতার ম্যাপ — বের হওয়ার আগে দেখে নিন কোন রাস্তা চলাচলের উপযোগী।',
    seedNotice: 'ডেমো ডেটা: নিচের কিছু পিন “Seed / demo data” হিসেবে দেওয়া আছে — এগুলো লাইভ রিপোর্ট নয়। আপনার নিজের রিপোর্টই আসল লাইভ ডেটা। শেষ যাচাই: ২৫ নভেম্বর ২০২৬।',
    statTotal: 'রিপোর্ট', statWater: 'জলাবদ্ধতা', statJam: 'জ্যাম', statAvoid: 'এড়িয়ে চলুন',
    chipAll: 'সব', chipWater: '💧 জলাবদ্ধতা', chipJam: '🚗 জ্যাম',
    areaLabel: 'এলাকা', areaAll: 'সব এলাকা', severityLabel: 'তীব্রতা', severityAll: 'সব তীব্রতা',
    reportHere: 'এখানে রিপোর্ট করুন',
    mapHint: 'ম্যাপে ট্যাপ করে লোকেশন বেছে রিপোর্ট করুন',
    areasTitle: 'এলাকা অনুযায়ী অবস্থা',
    areaEmpty: 'এখনো কোনো রিপোর্ট নেই — আপনিই প্রথম রিপোর্ট করুন।',
    legendTitle: 'রঙের মানে',
    legendW1: 'জলাবদ্ধতা — হালকা (গোড়ালি)', legendW2: 'জলাবদ্ধতা — মাঝারি (হাঁটু)',
    legendW3: 'জলাবদ্ধতা — চলাচল অসম্ভব',
    legendJ1: 'জ্যাম — ধীর', legendJ2: 'জ্যাম — ভারী', legendJ3: 'জ্যাম — আটকে আছে',
    expiryNote: 'রিপোর্ট ৩ ঘণ্টা পর মেয়াদোত্তীর্ণ হয়।',
    footer: 'Jam Radar — Arohon Build for Bangladesh। আপনার রিপোর্ট শুধু আপনার ব্রাউজারেই থাকে, কোনো অ্যাকাউন্ট লাগে না।',
    sheetTitle: 'রিপোর্ট করুন', typeLegend: 'কী দেখছেন?', severityLegend: 'তীব্রতা কত?',
    sevHintWater: 'জলাবদ্ধতা: গোড়ালি / হাঁটু / চলাচল অসম্ভব',
    sevHintJam: 'জ্যাম: ধীর / ভারী / আটকে আছে',
    noteLabel: 'সংক্ষিপ্ত নোট (ঐচ্ছিক)', notePlaceholder: 'যেমন: মিরপুর ১০-এ হাঁটু পানি',
    cancel: 'বাতিল', submit: 'রিপোর্ট পাঠান',
    sev1: '১ · হালকা', sev2: '২ · মাঝারি', sev3: '৩ · অসম্ভব',
    typeWater: 'জলাবদ্ধতা', typeJam: 'জ্যাম',
    seedBadge: 'Seed / demo data', liveBadge: 'লাইভ রিপোর্ট',
    toastAdded: 'ধন্যবাদ! আপনার রিপোর্ট ম্যাপে যোগ হয়েছে।',
    toastNeedLocation: 'আগে ম্যাপে ট্যাপ করে লোকেশন বেছে নিন।',
    toastSeedFailed: 'ডেমো ডেটা লোড হয়নি — তবুও রিপোর্ট করতে পারবেন।',
    toastMapFailed: 'ম্যাপ লোড হয়নি — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।',
    mapLoading: 'ম্যাপ লোড হচ্ছে…',
    justNow: 'এইমাত্র', minAgo: 'মিনিট আগে', hourAgo: 'ঘণ্টা আগে',
    passable: 'চলাচলযোগ্য', slow: 'ধীরে চলুন', avoid: 'এড়িয়ে চলুন',
    reports: 'টি রিপোর্ট', sheetLocCentre: 'লোকেশন: ম্যাপের মাঝখান',
    langBtn: 'English'
  },
  en: {
    pitch: 'Live Dhaka jam & waterlogging map — see which roads are passable before you leave.',
    seedNotice: 'Demo data: some pins below are “Seed / demo data” — not live reports. Your own reports are the real live data. Last verified: 25 Nov 2026.',
    statTotal: 'Reports', statWater: 'Waterlogging', statJam: 'Jam', statAvoid: 'Avoid',
    chipAll: 'All', chipWater: '💧 Waterlogging', chipJam: '🚗 Jam',
    areaLabel: 'Area', areaAll: 'All areas', severityLabel: 'Severity', severityAll: 'All severities',
    reportHere: 'Report here',
    mapHint: 'Tap the map to pick a location and report',
    areasTitle: 'Status by area',
    areaEmpty: 'No reports here yet — be the first to report.',
    legendTitle: 'What the colours mean',
    legendW1: 'Waterlogging — light (ankle)', legendW2: 'Waterlogging — medium (knee)',
    legendW3: 'Waterlogging — impassable',
    legendJ1: 'Jam — slow', legendJ2: 'Jam — heavy', legendJ3: 'Jam — blocked',
    expiryNote: 'Reports expire after 3 hours.',
    footer: 'Jam Radar — Arohon Build for Bangladesh. Your reports stay only in your browser, no account needed.',
    sheetTitle: 'Report', typeLegend: 'What do you see?', severityLegend: 'How bad is it?',
    sevHintWater: 'Water: ankle / knee / impassable',
    sevHintJam: 'Jam: slow / heavy / blocked',
    noteLabel: 'Short note (optional)', notePlaceholder: 'e.g. Knee-deep water at Mirpur 10',
    cancel: 'Cancel', submit: 'Submit report',
    sev1: '1 · Light', sev2: '2 · Medium', sev3: '3 · Severe',
    typeWater: 'Waterlogging', typeJam: 'Jam',
    seedBadge: 'Seed / demo data', liveBadge: 'Live report',
    toastAdded: 'Thank you! Your report is now on the map.',
    toastNeedLocation: 'Tap the map first to pick a location.',
    toastSeedFailed: 'Demo data did not load — you can still report.',
    toastMapFailed: 'Map did not load — check your connection and retry.',
    mapLoading: 'Loading map…',
    justNow: 'just now', minAgo: 'min ago', hourAgo: 'h ago',
    passable: 'Passable', slow: 'Go slow', avoid: 'Avoid',
    reports: 'reports', sheetLocCentre: 'Location: map centre',
    langBtn: 'বাংলা'
  }
};

// ---------- State ----------
var state = {
  lang: 'bn',
  reports: [],            // merged seed + user reports, all unexpired
  filters: { type: 'all', area: 'all', severity: 'all' },
  pendingLocation: null,  // {lat, lng} chosen on the map
  pendingMarker: null,
  formType: 'waterlogging',
  formSeverity: 1
};

var map = null;
var markers = []; // Leaflet markers currently on the map

// ---------- Helpers ----------
function t(key) { return STRINGS[state.lang][key]; }
function $(id) { return document.getElementById(id); }

function showToast(msg) {
  var el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(function () { el.classList.add('hidden'); }, 3200);
}

// "25 min ago" / "২৫ মিনিট আগে" — hours for older reports.
function formatAge(createdAt) {
  var mins = Math.max(0, Math.round((Date.now() - createdAt) / 60000));
  if (mins < 1) return t('justNow');
  if (mins < 60) return mins + ' ' + t('minAgo');
  return Math.floor(mins / 60) + ' ' + t('hourAgo');
}

function isExpired(r) { return Date.now() - r.createdAt >= EXPIRY_MS; }

// Severity label depends on type: water = ankle/knee/impassable,
// jam = slow/heavy/blocked.
function severityLabel(r) {
  var n = r.severity;
  if (r.type === 'waterlogging') {
    return n === 1 ? t('legendW1') : n === 2 ? t('legendW2') : t('legendW3');
  }
  return n === 1 ? t('legendJ1') : n === 2 ? t('legendJ2') : t('legendJ3');
}

// ---------- Data loading ----------
// Seed timestamps are relative: offsetMinutes before page load, so the
// map never looks stale on first open. Seed is labelled, never live.
// Any failure (no network, fetch unavailable) resolves to [] instead of
// throwing — the page must still render and reporting must still work.
function loadSeedReports() {
  try {
    return fetch(SEED_URL)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var now = Date.now();
        return (data.reports || []).map(function (r) {
          return {
            id: r.id, lat: r.lat, lng: r.lng, area: r.area,
            type: r.type, severity: r.severity, note: r.note || '',
            source: 'seed',
            createdAt: now - (r.offsetMinutes || 60) * 60000
          };
        });
      })
      .catch(function () { return []; });
  } catch (e) {
    return Promise.resolve([]);
  }
}

function loadUserReports() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    var list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return []; // Private mode / storage blocked: reports just won't persist.
  }
}

function saveUserReports(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
}

// ---------- Map ----------
function initMap() {
  if (typeof L === 'undefined') {
    $('mapLoading').textContent = t('toastMapFailed');
    return false;
  }
  map = L.map('map').setView(DHAKA, DEFAULT_ZOOM);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // Hide the loading overlay once tiles arrive (or after 3s, whichever first).
  var done = false;
  function hideLoading() {
    if (done) return;
    done = true;
    $('mapLoading').classList.add('gone');
  }
  map.on('load', hideLoading);
  setTimeout(hideLoading, 3000);

  // Tap the map to pick a report location.
  map.on('click', function (e) { pickLocation(e.latlng.lat, e.latlng.lng); });
  return true;
}

// Coloured teardrop pin; size grows with severity, emoji shows the type.
function pinIcon(r) {
  var cls = 'pin s' + r.severity + ' ' + (r.type === 'waterlogging' ? 'w' : 'j') + r.severity;
  var emoji = r.type === 'waterlogging' ? '💧' : '🚗';
  return L.divIcon({
    className: '',
    html: '<div class="' + cls + '"><span>' + emoji + '</span></div>',
    iconSize: [38, 38],
    iconAnchor: [19, 36],
    popupAnchor: [0, -32]
  });
}

function popupHtml(r) {
  var badge = r.source === 'seed'
    ? '<span class="popup-badge">' + t('seedBadge') + '</span>'
    : '<span class="popup-badge">' + t('liveBadge') + '</span>';
  var note = r.note ? '<br>' + escapeHtml(r.note) : '';
  return '<strong>' + (r.type === 'waterlogging' ? t('typeWater') : t('typeJam')) +
    ' — ' + r.area + '</strong><br>' +
    severityLabel(r) + note +
    '<br><span class="popup-age">' + formatAge(r.createdAt) + '</span><br>' + badge;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// ---------- Rendering ----------
function filteredReports() {
  var f = state.filters;
  return state.reports.filter(function (r) {
    if (f.type !== 'all' && r.type !== f.type) return false;
    if (f.area !== 'all' && r.area !== f.area) return false;
    if (f.severity !== 'all' && r.severity !== Number(f.severity)) return false;
    return true;
  });
}

function renderPins() {
  if (!map) return;
  markers.forEach(function (m) { map.removeLayer(m); });
  markers = [];
  filteredReports().forEach(function (r) {
    var marker = L.marker([r.lat, r.lng], { icon: pinIcon(r) })
      .bindPopup(popupHtml(r))
      .addTo(map);
    markers.push(marker);
  });
}

function renderSummary() {
  var live = state.reports;
  var water = live.filter(function (r) { return r.type === 'waterlogging'; }).length;
  var jam = live.filter(function (r) { return r.type === 'jam'; }).length;
  // "Avoid" = areas whose worst report is severity 3.
  var avoidAreas = new Set();
  live.forEach(function (r) { if (r.severity === 3) avoidAreas.add(r.area); });
  $('statTotal').textContent = live.length;
  $('statWater').textContent = water;
  $('statJam').textContent = jam;
  $('statAvoid').textContent = avoidAreas.size;
}

function renderAreas() {
  var byArea = {};
  state.reports.forEach(function (r) {
    if (!byArea[r.area]) byArea[r.area] = { count: 0, worst: 0 };
    byArea[r.area].count += 1;
    byArea[r.area].worst = Math.max(byArea[r.area].worst, r.severity);
  });
  var names = Object.keys(byArea).sort(function (a, b) {
    return byArea[b].worst - byArea[a].worst || byArea[b].count - byArea[a].count;
  });
  var list = $('areaList');
  list.innerHTML = '';
  $('areaEmpty').classList.toggle('hidden', names.length > 0);
  names.forEach(function (name) {
    var info = byArea[name];
    var status = info.worst === 3 ? 'avoid' : info.worst === 2 ? 'slow' : 'passable';
    var li = document.createElement('li');
    var left = document.createElement('span');
    left.innerHTML = '<span class="area-name">' + escapeHtml(name) + '</span> ' +
      '<span class="area-count">· ' + info.count + ' ' + t('reports') + '</span>';
    var pill = document.createElement('span');
    pill.className = 'pill ' + (status === 'avoid' ? 'bad' : status === 'slow' ? 'warn' : 'ok');
    pill.textContent = t(status);
    li.appendChild(left);
    li.appendChild(pill);
    list.appendChild(li);
  });
}

function renderAll() {
  // Drop expired reports first (seed + user), then render everything.
  state.reports = state.reports.filter(function (r) { return !isExpired(r); });
  renderPins();
  renderSummary();
  renderAreas();
}

// ---------- Filters ----------
function populateAreaFilter() {
  var select = $('areaFilter');
  var current = select.value || 'all';
  // Keep the fixed order, then any other area present in the data.
  var areas = AREA_ORDER.filter(function (a) {
    return state.reports.some(function (r) { return r.area === a; });
  });
  state.reports.forEach(function (r) {
    if (areas.indexOf(r.area) === -1) areas.push(r.area);
  });
  select.innerHTML = '';
  var all = document.createElement('option');
  all.value = 'all';
  all.textContent = t('areaAll');
  select.appendChild(all);
  areas.forEach(function (a) {
    var opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    select.appendChild(opt);
  });
  select.value = areas.indexOf(current) !== -1 || current === 'all' ? current : 'all';
}

// Nearest named area to a lat/lng, from the seed spots.
function nearestArea(lat, lng) {
  var best = null, bestD = Infinity;
  state.reports.forEach(function (r) {
    var d = Math.pow(r.lat - lat, 2) + Math.pow(r.lng - lng, 2);
    if (d < bestD) { bestD = d; best = r.area; }
  });
  return best || 'Dhaka';
}

// ---------- Report flow ----------
function pickLocation(lat, lng) {
  state.pendingLocation = { lat: lat, lng: lng };
  if (map) {
    if (state.pendingMarker) map.removeLayer(state.pendingMarker);
    state.pendingMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: '<div class="pin pending"><span>📍</span></div>',
        iconSize: [38, 38], iconAnchor: [19, 36]
      })
    }).addTo(map);
  }
  $('sheetLoc').textContent = nearestArea(lat, lng) +
    ' · ' + lat.toFixed(4) + ', ' + lng.toFixed(4);
  openSheet();
}

function openSheet() {
  $('reportSheet').classList.remove('hidden');
  $('sheetBackdrop').classList.remove('hidden');
}

function closeSheet() {
  $('reportSheet').classList.add('hidden');
  $('sheetBackdrop').classList.add('hidden');
  if (map && state.pendingMarker) {
    map.removeLayer(state.pendingMarker);
    state.pendingMarker = null;
  }
  state.pendingLocation = null;
}

function submitReport() {
  if (!state.pendingLocation) {
    showToast(t('toastNeedLocation'));
    return;
  }
  var report = {
    id: 'user-' + Date.now(),
    lat: state.pendingLocation.lat,
    lng: state.pendingLocation.lng,
    area: nearestArea(state.pendingLocation.lat, state.pendingLocation.lng),
    type: state.formType,
    severity: state.formSeverity,
    note: $('noteInput').value.trim(),
    source: 'user',
    createdAt: Date.now()
  };
  var users = loadUserReports();
  users.push(report);
  saveUserReports(users);
  state.reports.push(report);
  $('noteInput').value = '';
  closeSheet();
  renderAll();
  showToast(t('toastAdded'));
}

// ---------- Language ----------
function applyLanguage() {
  document.documentElement.lang = state.lang;
  $('pitch').textContent = t('pitch');
  $('seedNotice').textContent = t('seedNotice');
  $('statTotalLabel').textContent = t('statTotal');
  $('statWaterLabel').textContent = t('statWater');
  $('statJamLabel').textContent = t('statJam');
  $('statAvoidLabel').textContent = t('statAvoid');
  $('chipAll').textContent = t('chipAll');
  $('chipWater').textContent = t('chipWater');
  $('chipJam').textContent = t('chipJam');
  $('areaLabel').textContent = t('areaLabel');
  $('severityLabel').textContent = t('severityLabel');
  $('reportHereLabel').textContent = t('reportHere');
  $('mapHint').textContent = t('mapHint');
  $('areasTitle').textContent = t('areasTitle');
  $('areaEmpty').textContent = t('areaEmpty');
  $('legendTitle').textContent = t('legendTitle');
  $('expiryNote').textContent = t('expiryNote');
  $('footerText').textContent = t('footer');
  $('sheetTitle').textContent = t('sheetTitle');
  $('typeLegend').textContent = t('typeLegend');
  $('severityLegend').textContent = t('severityLegend');
  $('noteLabel').textContent = t('noteLabel');
  $('noteInput').placeholder = t('notePlaceholder');
  $('cancelReport').textContent = t('cancel');
  $('submitReport').textContent = t('submit');
  $('sev1').textContent = t('sev1');
  $('sev2').textContent = t('sev2');
  $('sev3').textContent = t('sev3');
  $('langToggle').textContent = t('langBtn');
  $('mapLoading').textContent = t('mapLoading');
  updateSeverityHint();
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  populateAreaFilter();
  renderAll();
}

function updateSeverityHint() {
  $('severityHint').textContent =
    state.formType === 'waterlogging' ? t('sevHintWater') : t('sevHintJam');
}

// Segmented control helper: one active button per group.
function wireSeg(containerId, onPick) {
  var container = $(containerId);
  container.addEventListener('click', function (e) {
    var btn = e.target.closest('.seg-btn');
    if (!btn) return;
    container.querySelectorAll('.seg-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    onPick(btn.getAttribute('data-value'));
  });
}

// ---------- Boot ----------
function init() {
  var mapOk = initMap();

  // Type filter chips.
  $('typeFilters').addEventListener('click', function (e) {
    var btn = e.target.closest('.chip');
    if (!btn) return;
    document.querySelectorAll('#typeFilters .chip').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    state.filters.type = btn.getAttribute('data-type');
    renderAll();
  });
  $('areaFilter').addEventListener('change', function (e) {
    state.filters.area = e.target.value;
    renderAll();
  });
  $('severityFilter').addEventListener('change', function (e) {
    state.filters.severity = e.target.value;
    renderAll();
  });

  // Report flow.
  $('reportHereBtn').addEventListener('click', function () {
    if (!map) return;
    var c = map.getCenter();
    pickLocation(c.lat, c.lng);
  });
  $('cancelReport').addEventListener('click', closeSheet);
  $('sheetBackdrop').addEventListener('click', closeSheet);
  $('submitReport').addEventListener('click', submitReport);
  wireSeg('typeSeg', function (v) { state.formType = v; updateSeverityHint(); });
  wireSeg('severitySeg', function (v) { state.formSeverity = Number(v); });

  // Language toggle.
  $('langToggle').addEventListener('click', function () {
    state.lang = state.lang === 'bn' ? 'en' : 'bn';
    applyLanguage();
  });

  // Load data, then render. Seed failure is non-fatal: reporting still works.
  loadSeedReports()
    .catch(function () {
      showToast(t('toastSeedFailed'));
      return [];
    })
    .then(function (seed) {
      state.reports = seed.concat(loadUserReports()).filter(function (r) { return !isExpired(r); });
      applyLanguage();
      // Re-render every minute so ages and expiry stay correct.
      setInterval(renderAll, 60000);
    });

  if (!mapOk) showToast(t('toastMapFailed'));
}

document.addEventListener('DOMContentLoaded', init);
