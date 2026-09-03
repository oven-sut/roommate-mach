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
      loginError.textContent = 'บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ';
      return;
    }
    setToken(data.access_token);
    document.getElementById('pageTitle').textContent = data.user.displayName || data.user.email;
    showApp();
  } catch (err) {
    loginError.textContent = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  }
});

document.querySelector('.logout')?.addEventListener('click', () => {
  clearToken();
  showLogin();
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

const loaded = new Set();
function loadPage(name) {
  // Dashboard and analytics are cheap and can refresh each visit.
  if (name === 'dashboard') return loadDashboard();
  if (name === 'analytics') return loadAnalytics();
  if (name === 'users' && !loaded.has('users')) { loaded.add('users'); return loadUsers(); }
  if (name === 'verification' && !loaded.has('verification')) { loaded.add('verification'); return loadUsers(); }
  if (name === 'report' && !loaded.has('report')) { loaded.add('report'); return loadReports(); }
}

async function bootAdmin() {
  renderCalendar();
  try {
    const me = await api('/api/me');
    if (me.role !== 'ADMIN') { clearToken(); showLogin(); return; }
    document.getElementById('pageTitle').textContent = me.displayName || me.email;
  } catch {
    return; // api() already redirected to login on 401
  }
  loadDashboard();
}

function renderCalendar() {
  const today = new Date();
  document.getElementById('calTitle').textContent = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = [];
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    days.push(`<div class="${offset === 0 ? 'cal-active' : ''}"><small>${d.toLocaleDateString('en-US', { weekday: 'short' })}</small><b>${d.getDate()}</b></div>`);
  }
  document.getElementById('calDays').innerHTML = days.join('');
}

// ---------------------------------------------------------------- Dashboard
let charts = {};
function destroyChart(key) { if (charts[key]) { charts[key].destroy(); delete charts[key]; } }

async function loadDashboard() {
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

    renderDistList('yearList', d.yearDistribution.map((y) => ({ code: `Y${y.year}`, name: `Year ${y.year}`, value: y.count })));
    renderDistList('facultyList', d.facultyDistribution.slice(0, 8).map(f => ({ code: f.major.slice(0, 2).toUpperCase(), name: f.major, value: f.count })));

    const funnel = d.swipeFunnel;
    destroyChart('matchedPie');
    charts.matchedPie = new Chart(document.getElementById('matchedPie'), {
      type: 'pie',
      data: { labels: ['Swiped', 'Matched', 'Talking'],
        datasets: [{ data: [funnel.swiped, funnel.matched, funnel.talking], backgroundColor: ['#f2d98d', '#5b7fb5', '#8fc48a'] }] },
      options: { plugins: { legend: { position: 'bottom' } } },
    });
    destroyChart('matchedBar');
    charts.matchedBar = new Chart(document.getElementById('matchedBar'), {
      type: 'bar',
      data: { labels: ['Swiped', 'Matched', 'Talking'], datasets: [{ data: [funnel.swiped, funnel.matched, funnel.talking], backgroundColor: ['#5b7fb5', '#f2d98d', '#8fc48a'] }] },
      options: { plugins: { legend: { display: false } } },
    });

    const w = d.lifestyleWeights;
    destroyChart('lifestyleDonut');
    charts.lifestyleDonut = new Chart(document.getElementById('lifestyleDonut'), {
      type: 'doughnut',
      data: { labels: ['Sleep & Wake', 'Guest', 'Cleanliness', 'Temp & Study'],
        datasets: [{ data: [w.sleep, w.guests, w.cleanliness, w.temperature], backgroundColor: ['#5b7fb5', '#f2d98d', '#8fc48a', '#bcd4f2'] }] },
      options: { plugins: { legend: { display: false } } },
    });
    destroyChart('lifestyleBar');
    charts.lifestyleBar = new Chart(document.getElementById('lifestyleBar'), {
      type: 'bar',
      data: { labels: ['Sleep', 'Guest', 'Clean', 'Temp'], datasets: [{ data: [w.sleep, w.guests, w.cleanliness, w.temperature], backgroundColor: ['#5b7fb5', '#8fc48a', '#f2d98d', '#bcd4f2'] }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { max: 100 } } },
    });
  } catch (err) {
    console.error(err);
  }
}

function renderDistList(id, items) {
  const colors = ['#c0453a', '#3a4a73', '#e0ac2c', '#8a2f5a'];
  const ul = document.getElementById(id);
  if (!items.length) { ul.innerHTML = '<li class="muted">No data yet</li>'; return; }
  ul.innerHTML = items.map((it, idx) => `
    <li>
      <div class="dist-badge" style="background:${colors[idx % colors.length]}">${it.code}</div>
      <div class="dist-name">${it.name}</div>
      <div class="dist-val">${it.value}</div>
    </li>
  `).join('');
}

// ---------------------------------------------------------------- Users / Verification
let allUsers = [];
async function loadUsers() {
  try {
    allUsers = await api('/api/admin/users');
    renderUsersTable();
    renderVerificationTable();
  } catch (err) {
    console.error(err);
  }
}

function facultyYear(u) {
  const major = u.profile?.major || '-';
  const year = u.profile?.year ? `year${u.profile.year}` : '-';
  return `${major}, ${year}`;
}

function renderUsersTable() {
  const q = (document.getElementById('usersSearch')?.value || '').toLowerCase();
  const rows = allUsers.filter(u => !q || u.sutId?.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q));
  document.getElementById('usersBody').innerHTML = rows.map(u => `
    <tr>
      <td>${u.sutId || u.id.slice(0, 8)}</td>
      <td>${u.displayName}</td>
      <td><span class="badge ${u.verification?.status === 'VERIFIED' ? 'badge-verified' : 'badge-unverified'}">${u.verification?.status || 'PENDING'}</span></td>
      <td>${facultyYear(u)}</td>
      <td>${u.email}</td>
      <td><button class="btn-view" onclick="toggleSuspend('${u.id}', ${!u.suspended})">${u.suspended ? 'Unsuspend' : 'Suspend'}</button></td>
    </tr>`).join('') || '<tr><td colspan="6" class="muted">No users found</td></tr>';
}

function renderVerificationTable() {
  const q = (document.getElementById('verifySearch')?.value || '').toLowerCase();
  const rows = allUsers.filter(u => (!q || u.sutId?.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)) && u.verification?.status !== 'VERIFIED');
  document.getElementById('verifyBody').innerHTML = rows.map(u => `
    <tr>
      <td>${u.sutId || u.id.slice(0, 8)}</td>
      <td>${u.displayName}</td>
      <td><span class="badge ${u.verification?.status === 'VERIFIED' ? 'badge-verified' : 'badge-unverified'}">${u.verification?.status || 'PENDING'}</span></td>
      <td>${facultyYear(u)}</td>
      <td>${u.email}</td>
      <td><button class="btn-view" onclick="verifyUser('${u.id}', true)">Verify</button>
          <button class="btn-view" style="background:#f0c3ba;color:#a13930" onclick="verifyUser('${u.id}', false)">Reject</button></td>
    </tr>`).join('') || '<tr><td colspan="6" class="muted">Nothing pending</td></tr>';
}

window.toggleSuspend = async (id, suspended) => {
  try {
    await api(`/api/admin/users/${id}/suspend`, { method: 'PATCH', body: { suspended } });
    await loadUsers();
  } catch (err) { alert(err.message); }
};

window.verifyUser = async (id, approve) => {
  try {
    await api(`/api/admin/users/${id}/verify`, { method: 'PATCH', body: { status: approve ? 'VERIFIED' : 'REJECTED' } });
    await loadUsers();
  } catch (err) { alert(err.message); }
};

document.getElementById('usersSearch')?.addEventListener('input', renderUsersTable);
document.getElementById('verifySearch')?.addEventListener('input', renderVerificationTable);

// ---------------------------------------------------------------- Report
let allReports = [];
async function loadReports() {
  try {
    allReports = await api('/api/admin/reports');
    renderReportCards();
    renderReportsTable();
  } catch (err) {
    console.error(err);
  }
}

function renderReportCards() {
  const pending = allReports.filter(r => r.status === 'PENDING');
  const total = allReports.length;
  document.getElementById('reportAllCase').textContent = total;
  document.getElementById('reportTodoCount').textContent = pending.length;
  document.getElementById('reportTodoTotal').textContent = total;
  const pct = total ? Math.round((pending.length / total) * 100) : 0;
  document.getElementById('reportTodoFill').style.width = pct + '%';

  const byReason = {};
  for (const r of allReports) byReason[r.reason] = (byReason[r.reason] || 0) + 1;
  const top3 = Object.entries(byReason).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const cards = document.querySelectorAll('.rcard');
  cards.forEach((card, idx) => {
    const entry = top3[idx];
    card.querySelector('.rcard-title').textContent = entry ? entry[0] : '—';
    card.querySelector('.rcard-case-count').textContent = entry ? entry[1] : 0;
  });
}

function renderReportsTable() {
  const q = (document.getElementById('reportSearch')?.value || '').toLowerCase();
  const rows = allReports.filter(r => !q || r.reported?.displayName?.toLowerCase().includes(q));
  document.getElementById('reportBody').innerHTML = rows.map(r => `
    <tr>
      <td>${r.reportedId.slice(0, 8)}</td>
      <td>${r.reported?.displayName || '-'}</td>
      <td><span class="tag tag-chat">${r.reason}</span></td>
      <td>${new Date(r.createdAt).toLocaleString()}</td>
      <td>${r.details || '-'}</td>
      <td>
        ${r.status === 'PENDING'
          ? `<button class="btn-view" onclick="resolveReport('${r.id}', 'RESOLVED')">Resolve</button>
             <button class="btn-view" style="background:#f0c3ba;color:#a13930" onclick="resolveReport('${r.id}', 'DISMISSED')">Dismiss</button>`
          : `<span class="badge ${r.status === 'RESOLVED' ? 'badge-verified' : 'badge-unverified'}">${r.status}</span>`}
      </td>
    </tr>`).join('') || '<tr><td colspan="6" class="muted">No reports</td></tr>';
}

window.resolveReport = async (id, status) => {
  try {
    await api(`/api/admin/reports/${id}`, { method: 'PATCH', body: { status } });
    await loadReports();
  } catch (err) { alert(err.message); }
};

document.getElementById('reportSearch')?.addEventListener('input', renderReportsTable);

// ---------------------------------------------------------------- boot
if (getToken()) showApp(); else showLogin();
