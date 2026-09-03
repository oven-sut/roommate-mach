// ---------------------------------------------------------------- Icons & language
lucide.createIcons();
Chart.defaults.font.family = "'Sarabun', 'Segoe UI', Tahoma, sans-serif";
applyLanguage();
document.getElementById('langSwitch')?.addEventListener('click', toggleLanguage);
document.getElementById('langSwitchLogin')?.addEventListener('click', toggleLanguage);
window.addEventListener('languagechange', () => {
  // Re-render whatever page is currently visible so dynamic text picks up the new language.
  const active = document.querySelector('.nav-item.active')?.dataset.page || 'dashboard';
  loadPage(active);
});

// ---------------------------------------------------------------- API base
const API_BASE = 'http://localhost:18888'; // change to your deployed API origin
const TOKEN_KEY = 'sut_admin_token';

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : null),
      ...(opts.headers || null),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) {
    clearToken();
    showLogin();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.message || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

// ---------------------------------------------------------------- Login gate
const loginScreen = document.getElementById('login-screen');
const appRoot = document.getElementById('app-root');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

function showLogin() {
  loginScreen.classList.remove('hidden');
  appRoot.classList.add('hidden');
}
function showApp() {
  loginScreen.classList.add('hidden');
  appRoot.classList.remove('hidden');
  bootAdmin();
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  try {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    if (data.user.role !== 'ADMIN') {
      loginError.textContent = t('login.notAdmin');
      return;
    }
    setToken(data.access_token);
    document.getElementById('pageTitle').textContent = data.user.displayName || data.user.email;
    showApp();
  } catch (err) {
    loginError.textContent = t('login.invalid');
  }
});

/**
 * Logout wipes every trace of the session client-side, not just the token:
 * cached admin/user/report data can contain PII and must not survive in
 * memory (or in leftover form fields) for the next person at this machine.
 */
function performLogout() {
  clearToken();
  currentAdmin = null;
  usersState = { page: 1, pageSize: 10, total: 0, q: '' };
  verifyState = { page: 1, pageSize: 10, total: 0, q: '' };
  reportsState = { page: 1, pageSize: 10, total: 0, q: '' };
  Object.keys(charts).forEach(destroyChart);
  loginForm?.reset();
  document.getElementById('loginPassword').value = '';
  document.getElementById('currentPassword') && (document.getElementById('currentPassword').value = '');
  document.getElementById('newPassword') && (document.getElementById('newPassword').value = '');
  document.getElementById('confirmPassword') && (document.getElementById('confirmPassword').value = '');
  navItems.forEach(i => i.classList.remove('active'));
  document.querySelector('.nav-item[data-page="dashboard"]')?.classList.add('active');
  pages.forEach(p => p.classList.toggle('hidden', p.id !== 'page-dashboard'));
  showLogin();
}

const logoutConfirm = document.getElementById('logoutConfirm');
document.querySelector('.logout')?.addEventListener('click', () => {
  logoutConfirm.classList.remove('hidden');
});
document.getElementById('logoutCancel')?.addEventListener('click', () => {
  logoutConfirm.classList.add('hidden');
});
document.getElementById('logoutOk')?.addEventListener('click', () => {
  logoutConfirm.classList.add('hidden');
  performLogout();
});
logoutConfirm?.addEventListener('click', (e) => {
  if (e.target === logoutConfirm) logoutConfirm.classList.add('hidden');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !logoutConfirm.classList.contains('hidden')) {
    logoutConfirm.classList.add('hidden');
  }
});

// ---------------------------------------------------------------- Navigation
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const target = item.dataset.page;
    pages.forEach(p => p.classList.toggle('hidden', p.id !== `page-${target}`));
    loadPage(target);
  });
});

function loadPage(name) {
  // Dashboard and analytics are cheap and can refresh each visit.
  if (name === 'dashboard') return loadDashboard();
  if (name === 'analytics') return loadAnalytics();
  if (name === 'users') return loadUsers();
  if (name === 'verification') return loadVerification();
  if (name === 'report') return loadReports();
  if (name === 'setting') return renderProfile();
}

let currentAdmin = null;
async function bootAdmin() {
  try {
    currentAdmin = await api('/api/me');
    if (currentAdmin.role !== 'ADMIN') { clearToken(); showLogin(); return; }
    document.getElementById('pageTitle').textContent = currentAdmin.displayName || currentAdmin.email;
  } catch {
    return; // api() already redirected to login on 401
  }
  loadDashboard();
}

// ---------------------------------------------------------------- Admin profile
function renderProfile() {
  if (!currentAdmin) return;
  document.getElementById('profileName').textContent = currentAdmin.displayName;
  document.getElementById('profileEmail').textContent = currentAdmin.email;
  document.getElementById('profileRole').textContent = currentAdmin.role;
  const locale = getLang() === 'th' ? 'th-TH' : 'en-US';
  document.getElementById('profileSince').textContent =
    t('profile.adminSince') + ' ' + new Date(currentAdmin.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('profileDisplayName').value = currentAdmin.displayName;
}

function setFormMsg(id, text, ok) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'form-msg ' + (ok ? 'success' : 'error');
}

document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const displayName = document.getElementById('profileDisplayName').value.trim();
  try {
    const updated = await api('/api/me', { method: 'PATCH', body: { displayName } });
    currentAdmin = { ...currentAdmin, ...updated };
    document.getElementById('pageTitle').textContent = currentAdmin.displayName;
    renderProfile();
    setFormMsg('profileMsg', t('profile.saveSuccess'), true);
  } catch (err) {
    setFormMsg('profileMsg', err.message || t('profile.saveFailed'), false);
  }
});

document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (newPassword !== confirmPassword) {
    setFormMsg('passwordMsg', t('profile.passwordMismatch'), false);
    return;
  }
  try {
    await api('/api/password', { method: 'PATCH', body: { currentPassword, password: newPassword } });
    e.target.reset();
    setFormMsg('passwordMsg', t('profile.passwordSuccess'), true);
  } catch (err) {
    setFormMsg('passwordMsg', err.message || t('profile.passwordFailed'), false);
  }
});

function renderCalendar() {
  const locale = getLang() === 'th' ? 'th-TH' : 'en-US';
  const today = new Date();
  document.getElementById('calTitle').textContent = today.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const days = [];
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    days.push(`<div class="${offset === 0 ? 'cal-active' : ''}"><small>${d.toLocaleDateString(locale, { weekday: 'short' })}</small><b>${d.getDate()}</b></div>`);
  }
  document.getElementById('calDays').innerHTML = days.join('');
}

// ---------------------------------------------------------------- Dashboard
let charts = {};
function destroyChart(key) { if (charts[key]) { charts[key].destroy(); delete charts[key]; } }

async function loadDashboard() {
  renderCalendar();
  try {
    const d = await api('/api/admin/dashboard');
    document.getElementById('statPending').textContent = d.pendingVerifications;
    document.getElementById('statMatched').textContent = d.matches;
    document.getElementById('statUnmatched').textContent = d.unmatched;
    document.getElementById('usersTotal').textContent = d.members.toLocaleString();
    document.getElementById('pendingBarFill').style.width =
      Math.min(100, (d.pendingVerifications / Math.max(1, d.members)) * 100) + '%';

    destroyChart('safety');
    charts.safety = new Chart(document.getElementById('safetyChart'), {
      type: 'bar',
      data: { labels: ['Messages', 'Reports', 'Active Matches'],
        datasets: [{ label: 'Count', data: [d.messages, d.reports, d.active], backgroundColor: ['#bcd4f2', '#c0453a', '#8fc48a'] }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });

    destroyChart('swipe');
    charts.swipe = new Chart(document.getElementById('swipeChart'), {
      type: 'bar',
      data: { labels: ['Swiped', 'Matched', 'Talking'],
        datasets: [{ data: [d.swipes, d.matches, d.conversations], backgroundColor: '#bcd4f2' }] },
      options: { responsive: true, plugins: { legend: { display: false } },
        scales: { y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.2)' }, beginAtZero: true },
                  x: { ticks: { color: '#fff' }, grid: { display: false } } } },
    });

    destroyChart('peak');
    charts.peak = new Chart(document.getElementById('peakChart'), {
      type: 'line',
      data: { labels: ['Members', 'Active', 'Matches', 'Messages'],
        datasets: [{ data: [d.members, d.active, d.matches, d.messages], borderColor: '#c0453a', backgroundColor: 'rgba(192,69,58,0.2)', fill: true, tension: 0.4 }] },
      options: { responsive: true, plugins: { legend: { display: false } } },
    });
  } catch (err) {
    console.error(err);
  }
}

// ---------------------------------------------------------------- Analytics
async function loadAnalytics() {
  try {
    const d = await api('/api/admin/analytics');
    const funnel = d.swipeFunnel;

    document.getElementById('statSwiped').textContent = funnel.swiped.toLocaleString();
    document.getElementById('statMatchedA').textContent = funnel.matched.toLocaleString();
    document.getElementById('statTalking').textContent = funnel.talking.toLocaleString();
    document.getElementById('statConvRate').textContent =
      (funnel.swiped ? Math.round((funnel.matched / funnel.swiped) * 100) : 0) + '%';

    renderDistList('yearList', d.yearDistribution.map((y) => ({ name: `Year ${y.year}`, value: y.count })));
    renderDistList('facultyList', d.facultyDistribution.slice(0, 6).map(f => ({ name: f.major, value: f.count })));

    destroyChart('matchedBar');
    charts.matchedBar = new Chart(document.getElementById('matchedBar'), {
      type: 'bar',
      data: { labels: ['Swiped', 'Matched', 'Talking'], datasets: [{ data: [funnel.swiped, funnel.matched, funnel.talking], backgroundColor: ['#5b7fb5', '#f2d98d', '#8fc48a'], borderRadius: 8, maxBarThickness: 64 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });

    const w = d.lifestyleWeights;
    const lifestyleLabels = ['Sleep & Wake', 'Guest', 'Cleanliness', 'Temp & Study'];
    const lifestyleValues = [w.sleep, w.guests, w.cleanliness, w.temperature];
    const lifestyleColors = ['#5b7fb5', '#f2d98d', '#8fc48a', '#c0453a'];

    destroyChart('lifestyleDonut');
    charts.lifestyleDonut = new Chart(document.getElementById('lifestyleDonut'), {
      type: 'doughnut',
      data: { labels: lifestyleLabels, datasets: [{ data: lifestyleValues, backgroundColor: lifestyleColors, borderWidth: 0 }] },
      options: { cutout: '68%', plugins: { legend: { display: false } } },
    });

    const lifestyleTotal = lifestyleValues.reduce((a, b) => a + b, 0) || 1;
    document.getElementById('lifestyleLegend').innerHTML = lifestyleLabels.map((label, idx) => `
      <li class="legend-row">
        <span class="legend-dot" style="background:${lifestyleColors[idx]}"></span>
        <span class="legend-label">${label}</span>
        <span class="legend-value">${Math.round((lifestyleValues[idx] / lifestyleTotal) * 100)}%</span>
      </li>`).join('');
  } catch (err) {
    console.error(err);
  }
}

function renderDistList(id, items) {
  const ul = document.getElementById(id);
  if (!items.length) { ul.innerHTML = `<li class="muted">${t('analytics.noData')}</li>`; return; }
  const max = Math.max(...items.map(it => it.value), 1);
  ul.innerHTML = items.map((it, idx) => `
    <li class="dist-row">
      <div class="dist-row-top">
        <div class="dist-rank">${idx + 1}</div>
        <div class="dist-name">${it.name}</div>
        <div class="dist-val">${it.value}</div>
      </div>
      <div class="dist-track"><div class="dist-fill" style="width:${(it.value / max) * 100}%"></div></div>
    </li>
  `).join('');
}

// ---------------------------------------------------------------- Pagination helper
/**
 * Every admin list is paged server-side (default 10 rows/page) so the
 * browser never has to fetch or hold a table the size of the whole student
 * body at once. `onPage` re-fetches with the new page number.
 */
function renderPagination(containerId, state, onPage) {
  const el = document.getElementById(containerId);
  const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
  const from = state.total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const to = Math.min(state.page * state.pageSize, state.total);

  const pageNumbers = [];
  const start = Math.max(1, state.page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) pageNumbers.push(p);

  el.innerHTML = `
    <span>${from}-${to} ${t('common.of')} ${state.total}</span>
    <div class="pagination-controls">
      <button class="page-btn" id="${containerId}-prev" ${state.page <= 1 ? 'disabled' : ''}><i data-lucide="chevron-left"></i></button>
      ${pageNumbers.map(p => `<button class="page-btn" data-current="${p === state.page}" data-page="${p}">${p}</button>`).join('')}
      <button class="page-btn" id="${containerId}-next" ${state.page >= totalPages ? 'disabled' : ''}><i data-lucide="chevron-right"></i></button>
    </div>`;
  lucide.createIcons();

  el.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => onPage(Number(btn.dataset.page)));
  });
  document.getElementById(`${containerId}-prev`)?.addEventListener('click', () => onPage(state.page - 1));
  document.getElementById(`${containerId}-next`)?.addEventListener('click', () => onPage(state.page + 1));
}

/** Delays a search request until typing pauses, so every keystroke doesn't fire a request. */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function facultyYear(u) {
  const major = u.profile?.major || '-';
  const year = u.profile?.year ? `year${u.profile.year}` : '-';
  return `${major}, ${year}`;
}

// ---------------------------------------------------------------- Users
let usersState = { page: 1, pageSize: 10, total: 0, q: '' };
async function loadUsers() {
  try {
    const res = await api(`/api/admin/users?page=${usersState.page}&pageSize=${usersState.pageSize}&q=${encodeURIComponent(usersState.q)}`);
    usersState.total = res.total;
    document.getElementById('usersBody').innerHTML = res.items.map(u => `
      <tr>
        <td>${u.sutId || u.id.slice(0, 8)}</td>
        <td>${u.displayName}</td>
        <td><span class="badge ${u.verification?.status === 'VERIFIED' ? 'badge-verified' : 'badge-unverified'}">${u.verification?.status || 'PENDING'}</span></td>
        <td>${facultyYear(u)}</td>
        <td>${u.email}</td>
        <td><button class="btn-view" onclick="toggleSuspend('${u.id}', ${!u.suspended})">${u.suspended ? t('common.unsuspend') : t('common.suspend')}</button></td>
      </tr>`).join('') || `<tr><td colspan="6" class="muted">${t('common.noUsersFound')}</td></tr>`;
    renderPagination('usersPagination', usersState, (page) => { usersState.page = page; loadUsers(); });
  } catch (err) {
    console.error(err);
  }
}

window.toggleSuspend = async (id, suspended) => {
  try {
    await api(`/api/admin/users/${id}/suspend`, { method: 'PATCH', body: { suspended } });
    await loadUsers();
  } catch (err) { alert(err.message); }
};

document.getElementById('usersSearch')?.addEventListener('input', debounce((e) => {
  usersState.q = e.target.value;
  usersState.page = 1;
  loadUsers();
}, 350));

// ---------------------------------------------------------------- Verification
let verifyState = { page: 1, pageSize: 10, total: 0, q: '' };
async function loadVerification() {
  try {
    const res = await api(`/api/admin/users?page=${verifyState.page}&pageSize=${verifyState.pageSize}&q=${encodeURIComponent(verifyState.q)}&verified=false`);
    verifyState.total = res.total;
    document.getElementById('verifyBody').innerHTML = res.items.map(u => `
      <tr>
        <td>${u.sutId || u.id.slice(0, 8)}</td>
        <td>${u.displayName}</td>
        <td><span class="badge ${u.verification?.status === 'VERIFIED' ? 'badge-verified' : 'badge-unverified'}">${u.verification?.status || 'PENDING'}</span></td>
        <td>${facultyYear(u)}</td>
        <td>${u.email}</td>
        <td><button class="btn-view" onclick="verifyUser('${u.id}', true)">${t('common.verify')}</button>
            <button class="btn-view" style="background:#f0c3ba;color:#a13930" onclick="verifyUser('${u.id}', false)">${t('common.reject')}</button></td>
      </tr>`).join('') || `<tr><td colspan="6" class="muted">${t('common.nothingPending')}</td></tr>`;
    renderPagination('verifyPagination', verifyState, (page) => { verifyState.page = page; loadVerification(); });
  } catch (err) {
    console.error(err);
  }
}

window.verifyUser = async (id, approve) => {
  try {
    await api(`/api/admin/users/${id}/verify`, { method: 'PATCH', body: { status: approve ? 'VERIFIED' : 'REJECTED' } });
    await loadVerification();
  } catch (err) { alert(err.message); }
};

document.getElementById('verifySearch')?.addEventListener('input', debounce((e) => {
  verifyState.q = e.target.value;
  verifyState.page = 1;
  loadVerification();
}, 350));

// ---------------------------------------------------------------- Report
let reportsState = { page: 1, pageSize: 10, total: 0, q: '' };

async function loadReportSummary() {
  try {
    const summary = await api('/api/admin/reports/summary');
    document.getElementById('reportAllCase').textContent = summary.total;
    document.getElementById('reportTodoCount').textContent = summary.pending;
    document.getElementById('reportTodoTotal').textContent = summary.total;
    const pct = summary.total ? Math.round((summary.pending / summary.total) * 100) : 0;
    document.getElementById('reportTodoFill').style.width = pct + '%';

    const top3 = summary.byReason.slice(0, 3);
    document.querySelectorAll('.rcard').forEach((card, idx) => {
      const entry = top3[idx];
      card.querySelector('.rcard-title').textContent = entry ? entry.reason : '—';
      card.querySelector('.rcard-case-count').textContent = entry ? entry.count : 0;
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadReports() {
  await loadReportSummary();
  try {
    const res = await api(`/api/admin/reports?page=${reportsState.page}&pageSize=${reportsState.pageSize}&q=${encodeURIComponent(reportsState.q)}`);
    reportsState.total = res.total;
    document.getElementById('reportBody').innerHTML = res.items.map(r => `
      <tr>
        <td>${r.reportedId.slice(0, 8)}</td>
        <td>${r.reported?.displayName || '-'}</td>
        <td><span class="tag tag-chat">${r.reason}</span></td>
        <td>${new Date(r.createdAt).toLocaleString(getLang() === 'th' ? 'th-TH' : 'en-US')}</td>
        <td>${r.details || '-'}</td>
        <td>
          ${r.status === 'PENDING'
            ? `<button class="btn-view" onclick="resolveReport('${r.id}', 'RESOLVED')">${t('common.resolve')}</button>
               <button class="btn-view" style="background:#f0c3ba;color:#a13930" onclick="resolveReport('${r.id}', 'DISMISSED')">${t('common.dismiss')}</button>`
            : `<span class="badge ${r.status === 'RESOLVED' ? 'badge-verified' : 'badge-unverified'}">${r.status}</span>`}
        </td>
      </tr>`).join('') || `<tr><td colspan="6" class="muted">${t('common.noReports')}</td></tr>`;
    renderPagination('reportPagination', reportsState, (page) => { reportsState.page = page; loadReports(); });
  } catch (err) {
    console.error(err);
  }
}

window.resolveReport = async (id, status) => {
  try {
    await api(`/api/admin/reports/${id}`, { method: 'PATCH', body: { status } });
    await loadReports();
  } catch (err) { alert(err.message); }
};

document.getElementById('reportSearch')?.addEventListener('input', debounce((e) => {
  reportsState.q = e.target.value;
  reportsState.page = 1;
  loadReports();
}, 350));

// ---------------------------------------------------------------- boot
if (getToken()) showApp(); else showLogin();
