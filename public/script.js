// ============================================================
// STATE
// ============================================================
let listPerusahaan = [];
let deleteTargetId = null;

let searchTerm = "";
let selectedWilayah = "";
let sortOption = "";
let currentPage = 1;
const itemsPerPage = 10;

// DOM refs
const currentDateInfo = document.getElementById('current-date-info');

const cardTotalPerusahaan = document.getElementById('card-total-perusahaan');
const cardAsetOktober = document.getElementById('card-aset-oktober');
const cardAsetNovember = document.getElementById('card-aset-november');
const cardAsetDesember = document.getElementById('card-aset-desember');
const cardTotalKantor = document.getElementById('card-total-kantor');
const cardRataRataAset = document.getElementById('card-rata-rata-aset');

const tableBody = document.getElementById('table-body');
const filterSearch = document.getElementById('filter-search');
const filterWilayah = document.getElementById('filter-wilayah');
const sortAset = document.getElementById('sort-aset');
const paginationInfo = document.getElementById('pagination-info');
const paginationControls = document.getElementById('pagination-controls');

const formTitle = document.getElementById('form-title');
const formPerusahaan = document.getElementById('form-perusahaan');
const formId = document.getElementById('form-id');
const formPerusahaanName = document.getElementById('form-perusahaan-name');
const formWilayah = document.getElementById('form-wilayah');
const formAsetOktober = document.getElementById('form-aset-oktober');
const formAsetNovember = document.getElementById('form-aset-november');
const formAsetDesember = document.getElementById('form-aset-desember');
const formJumlahKantor = document.getElementById('form-jumlah-kantor');
const formError = document.getElementById('form-error');

const btnSubmitSimpan = document.getElementById('btn-submit-simpan');
const btnSubmitUpdate = document.getElementById('btn-submit-update');
const btnReset = document.getElementById('btn-reset');

const modalConfirm = document.getElementById('modal-confirm');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

const skeletonSummary = document.getElementById('skeleton-summary');
const summaryCards = document.getElementById('summary-cards');

// ============================================================
// HELPERS
// ============================================================
function formatRupiah(value) {
  const formatter = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return 'Rp ' + formatter.format(value);
}

function cleanNumber(str) {
  if (!str) return 0;
  return parseInt(str.toString().replace(/\D/g, '')) || 0;
}

function setupCurrencyInput(inputEl) {
  inputEl.addEventListener('input', (e) => {
    let clean = cleanNumber(e.target.value);
    if (clean === 0) e.target.value = '';
    else e.target.value = new Intl.NumberFormat('id-ID').format(clean);
  });
}

function updateDateDisplay() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDateInfo.textContent = new Date().toLocaleDateString('id-ID', options);
}

function showModal(modalEl) {
  modalEl.classList.remove('pointer-events-none', 'opacity-0');
  const box = modalEl.firstElementChild;
  if (box) { box.classList.remove('scale-95');
    box.classList.add('scale-100'); }
}

function hideModal(modalEl) {
  modalEl.classList.add('pointer-events-none', 'opacity-0');
  const box = modalEl.firstElementChild;
  if (box) { box.classList.remove('scale-100');
    box.classList.add('scale-95'); }
}

// ============================================================
// API
// ============================================================
async function fetchPerusahaan() {
  try {
    skeletonSummary.classList.remove('hidden');
    summaryCards.classList.add('hidden');
    tableBody.innerHTML =
      `<tr><td colspan="11" class="py-8 text-center text-slate-400 font-semibold"><span class="inline-block animate-spin mr-2 border-2 border-t-purple-600 border-slate-200 w-4 h-4 rounded-full"></span>Memproses data...</span></td></tr>`;

    const res = await fetch('/api/perusahaan');
    if (!res.ok) throw new Error("Gagal memuat data dari database");
    listPerusahaan = await res.json();

    skeletonSummary.classList.add('hidden');
    summaryCards.classList.remove('hidden');

    populateWilayahDropdown();
    renderDashboard();
    renderProcessedData();
  } catch (err) {
    console.error(err);
    skeletonSummary.classList.add('hidden');
    summaryCards.classList.remove('hidden');
    tableBody.innerHTML = `
        <tr><td colspan="11" class="py-8 text-center text-rose-500 font-semibold">
          <p class="mb-2">Gagal menyambung ke server database.</p>
          <button onclick="fetchPerusahaan()" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md">Coba Lagi</button>
        </td></tr>`;
  }
}

function populateWilayahDropdown() {
  const currentSelected = filterWilayah.value;
  const wilayahSet = new Set();
  listPerusahaan.forEach(p => { if (p.wilayah && p.wilayah.trim()) wilayahSet.add(p.wilayah.trim()); });
  const sorted = Array.from(wilayahSet).sort();
  filterWilayah.innerHTML = '<option value="">Semua Wilayah</option>' +
    sorted.map(w => `<option value="${w}">${w}</option>`).join('');
  if (wilayahSet.has(currentSelected)) filterWilayah.value = currentSelected;
  else { selectedWilayah = "";
    filterWilayah.value = ""; }
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const total = listPerusahaan.length;
  let okt = 0,
    nov = 0,
    des = 0,
    kantor = 0;
  listPerusahaan.forEach(p => {
    okt += Number(p.asetOktober) || 0;
    nov += Number(p.asetNovember) || 0;
    des += Number(p.asetDesember) || 0;
    kantor += Number(p.jumlahKantor) || 0;
  });
  const totalAset = okt + nov + des;
  const rata = total > 0 ? totalAset / total : 0;

  cardTotalPerusahaan.textContent = `${total} Perusahaan`;
  cardAsetOktober.textContent = formatRupiah(okt);
  cardAsetNovember.textContent = formatRupiah(nov);
  cardAsetDesember.textContent = formatRupiah(des);
  cardTotalKantor.textContent = `${kantor} Kantor`;
  cardRataRataAset.textContent = formatRupiah(rata);

  renderGrowthDashboard();
  renderKantorDashboard();
  renderTopRanking();
  renderCharts();
  renderInsights();
}

// ============================================================
// GROWTH
// ============================================================
function calculateGrowth(prev, curr) {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

function getGrowthCategory(growth) {
  if (growth === null || isNaN(growth) || !isFinite(growth)) {
    return { label: 'N/A', color: 'gray', bgColor: 'bg-slate-100', textColor: 'text-slate-500' };
  }
  if (growth > 5) return { label: 'Sangat Baik', color: 'green', bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700' };
  if (growth >= 2) return { label: 'Baik', color: 'blue', bgColor: 'bg-blue-100',
  textColor: 'text-blue-700' };
  if (growth >= 0) return { label: 'Stabil', color: 'yellow', bgColor: 'bg-amber-100',
    textColor: 'text-amber-700' };
  return { label: 'Menurun', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' };
}

function formatGrowth(growth) {
  if (growth === null || isNaN(growth) || !isFinite(growth)) return '-';
  const sign = growth > 0 ? '+' : '';
  return `${sign}${growth.toFixed(1)}%`;
}

function calculateGrowthStats(data) {
  let totalOktNov = 0,
    totalNovDes = 0,
    countOktNov = 0,
    countNovDes = 0;
  const cats = { 'Sangat Baik': { oktNov: 0, novDes: 0 }, 'Baik': { oktNov: 0, novDes: 0 },
    'Stabil': { oktNov: 0, novDes: 0 }, 'Menurun': { oktNov: 0, novDes: 0 }, 'N/A': { oktNov: 0,
      novDes: 0 } };
  data.forEach(p => {
    const gON = calculateGrowth(Number(p.asetOktober) || 0, Number(p.asetNovember) || 0);
    const gND = calculateGrowth(Number(p.asetNovember) || 0, Number(p.asetDesember) || 0);
    if (gON !== null && isFinite(gON)) { totalOktNov += gON;
      countOktNov++; }
    if (gND !== null && isFinite(gND)) { totalNovDes += gND;
      countNovDes++; }
    cats[getGrowthCategory(gON).label].oktNov++;
    cats[getGrowthCategory(gND).label].novDes++;
  });
  return {
    avgOktNov: countOktNov > 0 ? totalOktNov / countOktNov : null,
    avgNovDes: countNovDes > 0 ? totalNovDes / countNovDes : null,
    categories: cats
  };
}

function renderGrowthDashboard() {
  const stats = calculateGrowthStats(listPerusahaan);
  const el1 = document.getElementById('card-avg-growth-oktnov');
  const el2 = document.getElementById('card-avg-growth-novdes');
  if (el1) {
    el1.textContent = stats.avgOktNov !== null ? formatGrowth(stats.avgOktNov) : '-';
    if (stats.avgOktNov !== null) {
      const cat = getGrowthCategory(stats.avgOktNov);
      el1.className = `card-value ${cat.textColor}`;
    }
  }
  if (el2) {
    el2.textContent = stats.avgNovDes !== null ? formatGrowth(stats.avgNovDes) : '-';
    if (stats.avgNovDes !== null) {
      const cat = getGrowthCategory(stats.avgNovDes);
      el2.className = `card-value ${cat.textColor}`;
    }
  }
  document.getElementById('card-sangat-baik-oktnov').textContent = stats.categories['Sangat Baik'].oktNov +
    ' perusahaan';
  document.getElementById('card-menurun-oktnov').textContent = stats.categories['Menurun'].oktNov + ' perusahaan';
  document.getElementById('card-sangat-baik-novdes').textContent = stats.categories['Sangat Baik'].novDes +
    ' perusahaan';
  document.getElementById('card-menurun-novdes').textContent = stats.categories['Menurun'].novDes + ' perusahaan';
}

// ============================================================
// KANTOR
// ============================================================
function getKantorCategory(jumlah) {
  if (jumlah > 12) return { label: 'Besar', color: 'blue', bgColor: 'bg-blue-100',
  textColor: 'text-blue-700' };
  if (jumlah >= 7) return { label: 'Menengah', color: 'yellow', bgColor: 'bg-amber-100',
    textColor: 'text-amber-700' };
  return { label: 'Kecil', color: 'gray', bgColor: 'bg-slate-100', textColor: 'text-slate-600' };
}

function calculateKantorStats(data) {
  let besar = 0,
    menengah = 0,
    kecil = 0;
  data.forEach(p => {
    const j = Number(p.jumlahKantor) || 0;
    if (j > 12) besar++;
    else if (j >= 7) menengah++;
    else kecil++;
  });
  return { besar, menengah, kecil };
}

function renderKantorDashboard() {
  const s = calculateKantorStats(listPerusahaan);
  document.getElementById('card-kantor-besar').textContent = s.besar + ' perusahaan';
  document.getElementById('card-kantor-menengah').textContent = s.menengah + ' perusahaan';
  document.getElementById('card-kantor-kecil').textContent = s.kecil + ' perusahaan';
}

// ============================================================
// TOP RANKING (tampilan baru)
// ============================================================
function renderTopRanking() {
  const cBesar = document.getElementById('top-ranking-terbesar');
  const cKecil = document.getElementById('top-ranking-terkecil');
  const withData = listPerusahaan.filter(p => (Number(p.asetDesember) || 0) > 0);
  if (withData.length === 0) {
    cBesar.innerHTML =
      `<div class="px-5 py-8 text-center text-slate-400 text-sm">Belum ada data aset Desember.</div>`;
    cKecil.innerHTML =
      `<div class="px-5 py-8 text-center text-slate-400 text-sm">Belum ada data aset Desember.</div>`;
    return;
  }
  const sorted = [...withData].sort((a, b) => (Number(b.asetDesember) || 0) - (Number(a.asetDesember) || 0));
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  const renderItem = (item, rank, isTop) => {
    const cls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default';
    const aset = Number(item.asetDesember) || 0;
    return `
        <div class="rank-item flex items-center justify-between px-5 py-3 hover:bg-purple-50/50 transition-colors duration-150">
          <div class="flex items-center space-x-3 min-w-0">
            <span class="rank-badge ${cls}">${rank}</span>
            <div class="min-w-0">
              <p class="font-bold text-slate-800 text-sm truncate">${item.perusahaan}</p>
              <p class="text-xs text-slate-400 truncate">${item.wilayah}</p>
            </div>
          </div>
          <div class="text-right flex-shrink-0 ml-3">
            <span class="font-extrabold text-slate-800 text-sm">${formatRupiah(aset)}</span>
            ${rank === 1 ? (isTop ? '<span class="ml-1.5 text-xs">👑</span>' : '<span class="ml-1.5 text-xs">⚠️</span>') : ''}
          </div>
        </div>
      `;
  };
  cBesar.innerHTML = top5.map((p, i) => renderItem(p, i + 1, true)).join('');
  cKecil.innerHTML = bottom5.map((p, i) => renderItem(p, i + 1, false)).join('');
}

// ============================================================
// CHARTS (tetap sama)
// ============================================================
function renderCharts() {
  if (chartTotalAset) { chartTotalAset.destroy();
    chartTotalAset = null; }
  if (chartTop10) { chartTop10.destroy();
    chartTop10 = null; }
  if (chartWilayah) { chartWilayah.destroy();
    chartWilayah = null; }
  if (chartKantor) { chartKantor.destroy();
    chartKantor = null; }
  if (listPerusahaan.length === 0) return;

  // Chart 1
  let okt = 0,
    nov = 0,
    des = 0;
  listPerusahaan.forEach(p => { okt += Number(p.asetOktober) || 0;
    nov += Number(p.asetNovember) || 0;
    des += Number(p.asetDesember) || 0; });
  chartTotalAset = new Chart(document.getElementById('chartTotalAset'), {
    type: 'bar',
    data: {
      labels: ['Oktober 2025', 'November 2025', 'Desember 2025'],
      datasets: [{ label: 'Total Aset', data: [okt, nov, des],
        backgroundColor: ['#8b5cf6', '#a78bfa', '#14b8a6'], borderRadius: 6, borderSkipped: false }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false },
        tooltip: { callbacks: { label: ctx => formatRupiah(ctx.parsed.y) } } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => 'Rp ' + (v / 1e6).toFixed(1) + 'M' } } } }
  });

  // Chart 2
  const sortedByDes = [...listPerusahaan].sort((a, b) => (Number(b.asetDesember) || 0) - (Number(a.asetDesember) || 0));
  const top10 = sortedByDes.slice(0, 10);
  chartTop10 = new Chart(document.getElementById('chartTop10'), {
    type: 'bar',
    data: {
      labels: top10.map(p => p.perusahaan),
      datasets: [{ label: 'Aset Desember 2025', data: top10.map(p => Number(p.asetDesember) || 0),
        backgroundColor: ['#8b5cf6', '#a78bfa', '#c084fc', '#7c3aed', '#6d28d9', '#14b8a6', '#2dd4bf',
          '#5eead4', '#f472b6', '#ec4899'
        ], borderRadius: 6, borderSkipped: false }]
    },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false },
        tooltip: { callbacks: { label: ctx => formatRupiah(ctx.parsed.x) } } },
      scales: { x: { beginAtZero: true, ticks: { callback: v => 'Rp ' + (v / 1e6).toFixed(1) + 'M' } } } }
  });

  // Chart 3
  const wMap = {};
  listPerusahaan.forEach(p => { const w = p.wilayah || 'Tidak Diketahui';
    wMap[w] = (wMap[w] || 0) + 1; });
  chartWilayah = new Chart(document.getElementById('chartWilayah'), {
    type: 'pie',
    data: {
      labels: Object.keys(wMap),
      datasets: [{ data: Object.values(wMap), backgroundColor: ['#8b5cf6', '#a78bfa', '#14b8a6', '#f59e0b',
          '#ec4899', '#2dd4bf', '#f472b6'
        ], borderWidth: 2, borderColor: '#fff' }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom',
          labels: { boxWidth: 12, font: { size: 10 } } } } }
  });

  // Chart 4
  const ks = calculateKantorStats(listPerusahaan);
  chartKantor = new Chart(document.getElementById('chartKantor'), {
    type: 'doughnut',
    data: {
      labels: ['Besar (>12)', 'Menengah (7-12)', 'Kecil (<7)'],
      datasets: [{ data: [ks.besar, ks.menengah, ks.kecil], backgroundColor: ['#8b5cf6', '#f59e0b',
          '#94a3b8'
        ], borderWidth: 2, borderColor: '#fff' }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom',
          labels: { boxWidth: 12, font: { size: 10 } } } } }
  });
}

// ============================================================
// INSIGHT (tampilan baru)
// ============================================================
function renderInsights() {
  const container = document.getElementById('insight-container');
  if (listPerusahaan.length === 0) {
    container.innerHTML =
      `<div class="col-span-full empty-state"><div class="text-4xl mb-3 opacity-50">📭</div><p class="text-slate-600 font-medium text-sm">Belum ada data perusahaan</p><p class="text-slate-400 text-xs mt-1">Tambahkan data melalui form di samping.</p></div>`;
    return;
  }
  const total = listPerusahaan.length;
  let okt = 0,
    nov = 0,
    des = 0;
  listPerusahaan.forEach(p => { okt += Number(p.asetOktober) || 0;
    nov += Number(p.asetNovember) || 0;
    des += Number(p.asetDesember) || 0; });
  const gON = okt > 0 ? ((nov - okt) / okt) * 100 : null;
  const gND = nov > 0 ? ((des - nov) / nov) * 100 : null;

  const wMap = {};
  listPerusahaan.forEach(p => { const w = p.wilayah || 'Tidak Diketahui';
    wMap[w] = (wMap[w] || 0) + 1; });
  let wTop = '',
    wMax = 0;
  for (const [w, c] of Object.entries(wMap)) { if (c > wMax) { wMax = c;
      wTop = w; } }

  const sortedByDes = [...listPerusahaan].sort((a, b) => (Number(b.asetDesember) || 0) - (Number(a.asetDesember) || 0));
  const asetTerbesar = sortedByDes[0];
  let growthTertinggi = -Infinity,
    perusahaanGrowth = null;
  listPerusahaan.forEach(p => {
    const prev = Number(p.asetNovember) || 0,
      curr = Number(p.asetDesember) || 0;
    if (prev > 0) { const g = ((curr - prev) / prev) * 100; if (g > growthTertinggi) { growthTertinggi = g;
        perusahaanGrowth = p; } }
  });
  const totalAset = okt + nov + des;
  const rata = total > 0 ? totalAset / total : 0;
  const ks = calculateKantorStats(listPerusahaan);

  const insights = [{
    icon: '🏢',
    label: 'Total Perusahaan',
    value: total + ' perusahaan',
    sub: 'Data dianalisis',
    color: 'purple'
  }, {
    icon: '📈',
    label: 'Kenaikan Okt→Nov',
    value: gON !== null ? (gON > 0 ? '+' : '') + gON.toFixed(1) + '%' : '-',
    sub: gON !== null ? 'Dari total aset' : 'Data tidak cukup',
    color: gON !== null ? (gON > 0 ? 'teal' : gON < 0 ? 'rose' : 'amber') : 'slate'
  }, {
    icon: '📈',
    label: 'Kenaikan Nov→Des',
    value: gND !== null ? (gND > 0 ? '+' : '') + gND.toFixed(1) + '%' : '-',
    sub: gND !== null ? 'Dari total aset' : 'Data tidak cukup',
    color: gND !== null ? (gND > 0 ? 'teal' : gND < 0 ? 'rose' : 'amber') : 'slate'
  }, {
    icon: '📍',
    label: 'Wilayah Terbanyak',
    value: wTop || '-',
    sub: wMax > 0 ? wMax + ' perusahaan' : 'Tidak ada data',
    color: 'indigo'
  }, {
    icon: '👑',
    label: 'Aset Terbesar (Des)',
    value: asetTerbesar ? asetTerbesar.perusahaan : '-',
    sub: asetTerbesar ? formatRupiah(Number(asetTerbesar.asetDesember) || 0) : 'Tidak ada data',
    color: 'amber'
  }, {
    icon: '🚀',
    label: 'Growth Tertinggi',
    value: perusahaanGrowth ? perusahaanGrowth.perusahaan : '-',
    sub: perusahaanGrowth ? formatGrowth(growthTertinggi) : '-',
    color: 'teal'
  }, {
    icon: '📊',
    label: 'Rata-rata Aset',
    value: formatRupiah(rata),
    sub: 'Seluruh perusahaan',
    color: 'indigo'
  }, {
    icon: '🏗️',
    label: 'Distribusi Kantor',
    value: `Besar ${ks.besar}, Menengah ${ks.menengah}, Kecil ${ks.kecil}`,
    sub: 'Total ' + total + ' perusahaan',
    color: 'purple'
  }];

  const colorMap = {
    purple: { border: 'border-purple-500', bg: 'bg-purple-50/60', icon: 'text-purple-600' },
    teal: { border: 'border-teal-500', bg: 'bg-teal-50/60', icon: 'text-teal-600' },
    rose: { border: 'border-rose-500', bg: 'bg-rose-50/60', icon: 'text-rose-600' },
    amber: { border: 'border-amber-500', bg: 'bg-amber-50/60', icon: 'text-amber-600' },
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-50/60', icon: 'text-indigo-600' },
    slate: { border: 'border-slate-400', bg: 'bg-slate-50/60', icon: 'text-slate-600' }
  };

  container.innerHTML = insights.map(ins => {
    const c = colorMap[ins.color] || colorMap.slate;
    return `
        <div class="insight-card rounded-xl p-4 shadow-sm ${c.border}">
          <div class="flex items-start space-x-3">
            <div class="insight-icon ${c.bg} ${c.icon}">${ins.icon}</div>
            <div class="flex-1 min-w-0">
              <div class="insight-label">${ins.label}</div>
              <div class="insight-value truncate" title="${ins.value}">${ins.value}</div>
              <div class="insight-sub">${ins.sub}</div>
            </div>
          </div>
        </div>
      `;
  }).join('');
}

// ============================================================
// TABLE & PAGINATION (tampilan baru)
// ============================================================
function renderProcessedData() {
  let processed = [...listPerusahaan];
  if (searchTerm) { const t = searchTerm.toLowerCase();
    processed = processed.filter(p => p.perusahaan && p.perusahaan.toLowerCase().includes(t)); }
  if (selectedWilayah) { processed = processed.filter(p => p.wilayah === selectedWilayah); }
  if (sortOption) {
    const [col, dir] = sortOption.split('-');
    const mult = dir === 'asc' ? 1 : -1;
    processed.sort((a, b) => {
      let va = 0,
        vb = 0;
      if (col === 'okt') { va = a.asetOktober || 0;
        vb = b.asetOktober || 0; } else if (col === 'nov') { va = a.asetNovember || 0;
        vb = b.asetNovember || 0; } else if (col === 'des') { va = a.asetDesember || 0;
        vb = b.asetDesember || 0; }
      return (va - vb) * mult;
    });
  }
  const totalItems = processed.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * itemsPerPage;
  const end = Math.min(start + itemsPerPage, totalItems);
  const pageData = processed.slice(start, end);
  renderTableRows(pageData, start);
  renderPaginationInfo(start, end, totalItems);
  renderPaginationControls(totalPages);
}

function renderTableRows(data, start) {
  if (data.length === 0) {
    tableBody.innerHTML =
      `<tr><td colspan="11" class="py-12 text-center text-slate-400"><div class="flex flex-col items-center"><svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><p class="font-medium text-sm mt-2">Data tidak ditemukan.</p></div></td></tr>`;
    return;
  }
  tableBody.innerHTML = data.map((p, idx) => {
    const no = start + idx + 1;
    const okt = Number(p.asetOktober) || 0,
      nov = Number(p.asetNovember) || 0,
      des = Number(p.asetDesember) || 0;
    const gON = calculateGrowth(okt, nov),
      gND = calculateGrowth(nov, des);
    const cON = getGrowthCategory(gON),
      cND = getGrowthCategory(gND);
    const kCat = getKantorCategory(Number(p.jumlahKantor) || 0);
    // Tampilan baru: warna lebih segar, badge lebih modern, tombol dengan gradasi
    return `
        <tr class="hover:bg-purple-50/50 transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}">
          <td class="py-3 px-4 text-center font-semibold text-slate-500">${no}</td>
          <td class="py-3 px-4 font-bold text-slate-800">${p.perusahaan}</td>
          <td class="py-3 px-4 text-slate-600"><span class="inline-block px-2 py-0.5 rounded-full bg-purple-100/60 text-purple-700 text-xs font-medium">${p.wilayah}</span></td>
          <td class="py-3 px-4 text-right font-semibold text-slate-700">${formatRupiah(okt)}</td>
          <td class="py-3 px-4 text-right font-semibold text-slate-700">${formatRupiah(nov)}</td>
          <td class="py-3 px-4 text-right font-semibold text-slate-700">${formatRupiah(des)}</td>
          <td class="py-3 px-4 text-center">
            <span class="font-bold ${cON.textColor}">${formatGrowth(gON)}</span><br>
            <span class="growth-badge ${cON.bgColor} ${cON.textColor}">${cON.label}</span>
          </td>
          <td class="py-3 px-4 text-center">
            <span class="font-bold ${cND.textColor}">${formatGrowth(gND)}</span><br>
            <span class="growth-badge ${cND.bgColor} ${cND.textColor}">${cND.label}</span>
          </td>
          <td class="py-3 px-4 text-center font-semibold text-slate-700">${p.jumlahKantor}</td>
          <td class="py-3 px-4 text-center">
            <span class="kategori-badge ${kCat.bgColor} ${kCat.textColor}">${kCat.label}</span>
          </td>
          <td class="py-3 px-4 text-center">
            <div class="flex items-center justify-center space-x-1.5">
              <button onclick="editData(${p.no})" class="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors text-xs font-semibold">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                <span>Edit</span>
              </button>
              <button onclick="confirmHapus(${p.no})" class="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                <span>Hapus</span>
              </button>
            </div>
          </td>
        </tr>
      `;
  }).join('');
}

function renderPaginationInfo(start, end, total) {
  paginationInfo.textContent = total === 0 ? "Menampilkan 0–0 dari 0 data" :
    `Menampilkan ${start+1}–${end} dari ${total} data`;
}

function renderPaginationControls(totalPages) {
  let html = `
      <button onclick="changePage(${currentPage-1})" ${currentPage===1?'disabled':''} class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${currentPage===1?'text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed':'text-slate-600 border-slate-200 hover:bg-slate-50'}">
        Sebelumnya
      </button>
    `;
  for (let i = 1; i <= totalPages; i++) {
    html += `
        <button onclick="changePage(${i})" class="w-8 h-8 rounded-lg text-xs font-bold transition-all ${i===currentPage?'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20':'border border-slate-200 text-slate-600 hover:bg-slate-50'}">
          ${i}
        </button>
      `;
  }
  html += `
      <button onclick="changePage(${currentPage+1})" ${currentPage===totalPages?'disabled':''} class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${currentPage===totalPages?'text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed':'text-slate-600 border-slate-200 hover:bg-slate-50'}">
        Berikutnya
      </button>
    `;
  paginationControls.innerHTML = html;
}

window.changePage = function(target) { currentPage = target;
  renderProcessedData(); };

// ============================================================
// CRUD (tetap sama)
// ============================================================
function resetForm() {
  formPerusahaan.reset();
  formId.value = "";
  formTitle.textContent = "Tambah Data Perusahaan";
  formError.classList.add('hidden');
  formError.textContent = "";
  btnSubmitSimpan.classList.remove('hidden');
  btnSubmitUpdate.classList.add('hidden');
}

function getFormData() {
  const name = formPerusahaanName.value.trim();
  const wilayah = formWilayah.value.trim();
  const okt = cleanNumber(formAsetOktober.value);
  const nov = cleanNumber(formAsetNovember.value);
  const des = cleanNumber(formAsetDesember.value);
  const kantor = parseInt(formJumlahKantor.value) || 0;
  if (!name || !wilayah) {
    formError.textContent = "Nama perusahaan dan wilayah wajib diisi!";
    formError.classList.remove('hidden');
    return null;
  }
  return { perusahaan: name, wilayah: wilayah, asetOktober: okt, asetNovember: nov, asetDesember: des,
    jumlahKantor: kantor };
}

async function submitSimpan() {
  const payload = getFormData();
  if (!payload) return;
  try {
    const res = await fetch('/api/perusahaan', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload) });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal menyimpan data ke server"); }
    resetForm();
    await fetchPerusahaan();
  } catch (err) { formError.textContent = err.message;
    formError.classList.remove('hidden'); }
}

async function submitUpdate() {
  const id = formId.value;
  const payload = getFormData();
  if (!payload || !id) return;
  try {
    const res = await fetch(`/api/perusahaan/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload) });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal memperbarui data"); }
    resetForm();
    await fetchPerusahaan();
  } catch (err) { formError.textContent = err.message;
    formError.classList.remove('hidden'); }
}

window.editData = function(no) {
  const item = listPerusahaan.find(p => p.no === no);
  if (!item) return;
  formTitle.textContent = "Edit Data Perusahaan";
  formId.value = item.no;
  formPerusahaanName.value = item.perusahaan;
  formWilayah.value = item.wilayah;
  formAsetOktober.value = item.asetOktober ? new Intl.NumberFormat('id-ID').format(item.asetOktober) : '';
  formAsetNovember.value = item.asetNovember ? new Intl.NumberFormat('id-ID').format(item.asetNovember) : '';
  formAsetDesember.value = item.asetDesember ? new Intl.NumberFormat('id-ID').format(item.asetDesember) : '';
  formJumlahKantor.value = item.jumlahKantor;
  formError.classList.add('hidden');
  btnSubmitSimpan.classList.add('hidden');
  btnSubmitUpdate.classList.remove('hidden');
  formPerusahaan.scrollIntoView({ behavior: 'smooth' });
};

window.confirmHapus = function(id) { deleteTargetId = id;
  showModal(modalConfirm); };

// ============================================================
// EVENT LISTENERS (tetap sama)
// ============================================================
filterSearch.addEventListener('input', (e) => { searchTerm = e.target.value;
  currentPage = 1;
  renderProcessedData(); });
filterWilayah.addEventListener('change', (e) => { selectedWilayah = e.target.value;
  currentPage = 1;
  renderProcessedData(); });
sortAset.addEventListener('change', (e) => { sortOption = e.target.value;
  renderProcessedData(); });

btnSubmitSimpan.addEventListener('click', submitSimpan);
btnSubmitUpdate.addEventListener('click', submitUpdate);
btnReset.addEventListener('click', resetForm);

btnCancelDelete.addEventListener('click', () => { deleteTargetId = null;
  hideModal(modalConfirm); });
btnConfirmDelete.addEventListener('click', async () => {
  if (!deleteTargetId) return;
  try {
    const res = await fetch(`/api/perusahaan/${deleteTargetId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Gagal menghapus data dari database");
    hideModal(modalConfirm);
    deleteTargetId = null;
    await fetchPerusahaan();
  } catch (err) { alert(err.message); }
});

setupCurrencyInput(formAsetOktober);
setupCurrencyInput(formAsetNovember);
setupCurrencyInput(formAsetDesember);

updateDateDisplay();
fetchPerusahaan();