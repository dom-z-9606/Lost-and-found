/* Campus Lost & Found — shared page helpers: icons, item cards, and navbar. */

const ICON_PATHS = {
  backpack: '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M8 22v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/><path d="M8 10h8"/>',
  bottle: '<path d="M10 2h4v3h-4z"/><path d="M10 5 8 8v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8l-2-3"/><path d="M8 12h8"/>',
  headphones: '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/>',
  idcard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16a3 3 0 0 1 6 0"/><path d="M14 10h5M14 14h4"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 9-9"/><path d="m17 6 3 3"/><path d="m14.5 8.5 2 2"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="15" r="1"/>',
  shirt: '<path d="M8 3 4 5 2 9l3 2 1-1v11h12V10l1 1 3-2-2-4-4-2a4 4 0 0 1-8 0z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5"/><path d="M12 16.2v.3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'
};

const CATEGORY_ICONS = {
  'Backpack': 'backpack',
  'Water Bottle': 'bottle',
  'Electronics': 'headphones',
  'ID / Badge': 'idcard',
  'Keys': 'key',
  'Wallet': 'wallet',
  'Clothing': 'shirt',
  'Books': 'book',
  'Other': 'tag'
};

function icon(name, cls) {
  return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name] || ICON_PATHS.tag) + '</svg>';
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* "2026-11-09" -> "Nov 9, 2026" (parsed as a local date, so it never shifts a day) */
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusLabel(status) {
  return { lost: 'Lost', found: 'Found', returned: 'Returned' }[status] || status;
}

function statusBadge(status) {
  return '<span class="badge badge-' + esc(status) + '">' + esc(statusLabel(status)) + '</span>';
}

/* Photo if one was uploaded, otherwise the category icon. */
function itemMedia(item) {
  if (item.image) return '<img src="' + esc(item.image) + '" alt="Photo of ' + esc(item.name) + '">';
  return '<div class="thumb-icon">' + icon(CATEGORY_ICONS[item.category] || 'tag') + '</div>';
}

function itemCard(item) {
  return '<a class="item-card" href="item.html?id=' + encodeURIComponent(item.id) + '">' +
    '<div class="thumb">' + itemMedia(item) + '</div>' +
    '<div class="item-body">' +
      '<h3 class="item-name">' + esc(item.name) + '</h3>' +
      '<div class="item-meta">' +
        '<div><span class="meta-label">Category:</span> <span class="truncate">' + esc(item.category) + '</span></div>' +
        '<div>' + icon('pin') + '<span class="truncate">Location: ' + esc(item.location) + '</span></div>' +
        '<div>' + icon('calendar') + '<span class="truncate">Date: ' + esc(formatDate(item.date)) + '</span></div>' +
      '</div>' +
      statusBadge(item.status) +
    '</div>' +
  '</a>';
}

function emptyState(title, text, actionHtml) {
  return '<div class="empty"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + (actionHtml || '') + '</div>';
}

const NAV_LINKS = [
  ['home', 'index.html', 'Home'],
  ['search', 'search.html', 'Search Items'],
  ['report', 'report.html', 'Report Item'],
  ['mine', 'my-reports.html', 'My Reports']
];

function renderNav(active, user) {
  const el = document.getElementById('site-nav');
  if (!el) return;
  const links = NAV_LINKS.map(([key, href, label]) =>
    '<li><a href="' + href + '"' + (key === active ? ' class="active" aria-current="page"' : '') + '>' + label + '</a></li>'
  ).join('');

  el.className = 'navbar';
  el.innerHTML =
    '<div class="container nav-inner">' +
      '<a class="brand" href="index.html">' + icon('backpack', 'brand-icon') + '<span>Campus Lost &amp; Found</span></a>' +
      '<ul class="nav-links">' + links + '</ul>' +
      '<div class="user-menu">' +
        '<button class="avatar" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">' + icon('user') + '</button>' +
        '<div class="user-dropdown" hidden>' +
          '<p class="ud-name">' + esc(user.first + ' ' + user.last) + '</p>' +
          '<p class="ud-email">' + esc(user.email) + '</p>' +
          '<a href="my-reports.html">My Reports</a>' +
          '<button type="button" class="ud-logout">' + icon('logout') + ' Log out</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  const btn = el.querySelector('.avatar');
  const menu = el.querySelector('.user-dropdown');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
    btn.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('click', e => {
    if (!menu.hidden && !menu.contains(e.target)) {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
  });
  el.querySelector('.ud-logout').addEventListener('click', () => {
    Auth.logout();
    location.href = 'login.html';
  });
}

/* Call at the top of every logged-in page. Returns the user, or null (and redirects to login). */
function initPage(active) {
  const user = Auth.requireLogin();
  if (!user) return null;
  renderNav(active, user);
  return user;
}

/* Only allow redirects back to one of our own pages. */
function safeNextPage() {
  const next = new URLSearchParams(location.search).get('next') || '';
  return /^[a-z-]+\.html(\?[^#]*)?$/i.test(next) && !/^(login|signup)\.html/i.test(next) ? next : 'index.html';
}
