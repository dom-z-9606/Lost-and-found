/* Campus Lost & Found — data layer.
   Everything is stored in the browser's localStorage (no server).
   Exposes two globals: window.Auth (accounts) and window.Items (lost/found items). */

const STORAGE_KEYS = {
  items: 'lf_items',
  seeded: 'lf_seeded',
  users: 'signupinfo',
  currentUser: 'currentUser',
  loginLog: 'loginfo',
  accountsExport: 'accountsExportTxt'
};

const CATEGORIES = ['Backpack', 'Water Bottle', 'Electronics', 'ID / Badge', 'Keys', 'Wallet', 'Clothing', 'Books', 'Other'];

const LOCATIONS = ['Student Union', 'Library', 'Gym', 'Engineering Building', 'Parking Lot', 'Dining Hall', 'Residence Hall', 'Classroom Building'];

const STATUSES = { LOST: 'lost', FOUND: 'found', RETURNED: 'returned' };

function readJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value == null ? fallback : value;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function toISODate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toISODate(d);
}

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */
class AuthManager {
  getUsers() {
    return readJSON(STORAGE_KEYS.users, []);
  }

  findUser(email) {
    const e = String(email || '').trim().toLowerCase();
    return this.getUsers().find(u => String(u.email || '').toLowerCase() === e) || null;
  }

  getCurrentUser() {
    const cu = readJSON(STORAGE_KEYS.currentUser, null);
    return cu && cu.email ? this.findUser(cu.email) : null;
  }

  login(email, password) {
    const user = this.findUser(email);
    if (!user || user.password !== password) {
      return { success: false, message: 'Invalid email or password. Make sure you signed up first.' };
    }
    writeJSON(STORAGE_KEYS.currentUser, { email: user.email });
    const log = readJSON(STORAGE_KEYS.loginLog, []);
    log.push({ email: user.email, ts: new Date().toISOString() });
    writeJSON(STORAGE_KEYS.loginLog, log);
    return { success: true, user };
  }

  signup({ first, last, email, password }) {
    first = String(first || '').trim();
    last = String(last || '').trim();
    email = String(email || '').trim();
    password = String(password || '');

    if (!first || !last || !email || !password) {
      return { success: false, message: 'Please fill in all fields.' };
    }
    if (!/@(my\.)?erau\.edu$/i.test(email)) {
      return { success: false, message: 'Email must end with @my.erau.edu or @erau.edu.' };
    }
    if (this.findUser(email)) {
      return { success: false, message: 'An account with that email already exists.' };
    }

    const users = this.getUsers();
    users.push({ first, last, email, password, ts: new Date().toISOString() });
    writeJSON(STORAGE_KEYS.users, users);
    this.updateAccountsExport(users);
    return { success: true };
  }

  updateAccountsExport(users) {
    const header = 'first,last,email,password,timestamp';
    const lines = users.map(u => [u.first, u.last, u.email, u.password, u.ts].join(','));
    localStorage.setItem(STORAGE_KEYS.accountsExport, header + '\n' + lines.join('\n'));
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }

  /* Sends the visitor to the login page if nobody is logged in. Returns the user or null. */
  requireLogin() {
    const user = this.getCurrentUser();
    if (!user) {
      const page = location.pathname.split('/').pop() || 'index.html';
      location.replace('login.html?next=' + encodeURIComponent(page + location.search));
    }
    return user;
  }
}

/* ------------------------------------------------------------------ */
/* Items                                                               */
/* ------------------------------------------------------------------ */
function newestFirst(a, b) {
  return b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt));
}

class ItemManager {
  constructor() {
    this.seedIfEmpty();
  }

  getAll() {
    return readJSON(STORAGE_KEYS.items, []);
  }

  saveAll(items) {
    writeJSON(STORAGE_KEYS.items, items);
  }

  getById(id) {
    return this.getAll().find(i => i.id === id) || null;
  }

  /* data: { name, description, location, date, category, type ('lost'|'found'), image } */
  addItem(data, user) {
    const name = String(data.name || '').trim();
    const description = String(data.description || '').trim();
    const location = String(data.location || '').trim();
    const date = String(data.date || '');
    const category = CATEGORIES.includes(data.category) ? data.category : 'Other';
    const type = data.type === STATUSES.FOUND ? STATUSES.FOUND : STATUSES.LOST;

    if (!name) return { success: false, message: 'Please enter an item name.' };
    if (!location) return { success: false, message: 'Please enter where the item was ' + type + '.' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: 'Please choose a valid date.' };
    if (date > toISODate(new Date())) return { success: false, message: 'The date cannot be in the future.' };

    const item = {
      id: 'itm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name,
      description,
      location,
      date,
      category,
      type,            // what was originally reported: lost or found
      status: type,    // current status: lost, found or returned
      image: data.image || '',
      reportedBy: user.email,
      reporterName: (user.first + ' ' + user.last).trim(),
      createdAt: new Date().toISOString(),
      returnedAt: null
    };

    const items = this.getAll();
    items.unshift(item);
    try {
      this.saveAll(items);
    } catch (e) {
      return { success: false, message: 'Could not save the report. The photo may be too large. Try a smaller photo, or none.' };
    }
    return { success: true, item };
  }

  markReturned(id) {
    const items = this.getAll();
    const item = items.find(i => i.id === id);
    if (!item) return { success: false, message: 'Item not found.' };
    if (item.status === STATUSES.RETURNED) return { success: false, message: 'This item is already marked as returned.' };
    item.status = STATUSES.RETURNED;
    item.returnedAt = new Date().toISOString();
    this.saveAll(items);
    return { success: true, item };
  }

  deleteItem(id, user) {
    const items = this.getAll();
    const item = items.find(i => i.id === id);
    if (!item) return { success: false, message: 'Item not found.' };
    if (!user || item.reportedBy.toLowerCase() !== user.email.toLowerCase()) {
      return { success: false, message: 'You can only delete your own reports.' };
    }
    this.saveAll(items.filter(i => i.id !== id));
    return { success: true };
  }

  /* filters: { query, category, status, location } — empty values are ignored */
  search(filters = {}) {
    const terms = String(filters.query || '').toLowerCase().split(/\s+/).filter(Boolean);
    return this.getAll().filter(item => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.location && item.location !== filters.location) return false;
      if (!terms.length) return true;
      const haystack = [item.name, item.description, item.location, item.category, item.status].join(' ').toLowerCase();
      return terms.every(t => haystack.includes(t));
    }).sort(newestFirst);
  }

  getRecent(limit = 6) {
    return this.getAll().sort(newestFirst).slice(0, limit);
  }

  getByReporter(email) {
    const e = String(email || '').toLowerCase();
    return this.getAll().filter(i => String(i.reportedBy).toLowerCase() === e).sort(newestFirst);
  }

  getStats() {
    const stats = { lost: 0, found: 0, returned: 0, total: 0 };
    this.getAll().forEach(i => {
      if (stats[i.status] !== undefined) stats[i.status]++;
      stats.total++;
    });
    return stats;
  }

  /* Locations where items are most often LOST (counts every item originally reported lost). */
  getCommonLocations(limit = 5) {
    const counts = {};
    this.getAll().filter(i => i.type === STATUSES.LOST).forEach(i => {
      counts[i.location] = (counts[i.location] || 0) + 1;
    });
    return Object.keys(counts)
      .map(location => ({ location, count: counts[location] }))
      .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location))
      .slice(0, limit);
  }

  getAllLocations() {
    const set = new Set(LOCATIONS);
    this.getAll().forEach(i => set.add(i.location));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  /* Adds a few example reports the first time the site is opened so the pages aren't empty. */
  seedIfEmpty() {
    if (localStorage.getItem(STORAGE_KEYS.seeded)) return;
    const reporter = { email: 'lostandfound@erau.edu', name: 'Campus Safety' };
    const seed = [
      ['Black Backpack', 'Backpack', 'Student Union', 1, 'lost', 'lost', 'Black backpack with a laptop sleeve and a silver keychain on the front zipper.'],
      ['Blue Water Bottle', 'Water Bottle', 'Library', 2, 'found', 'found', 'Blue insulated bottle with a few stickers. Found on the 2nd floor study tables.'],
      ['Wireless Earbuds Case', 'Electronics', 'Gym', 2, 'lost', 'lost', 'White earbuds charging case, left near the free-weights area.'],
      ['iPhone in Clear Case', 'Electronics', 'Student Union', 3, 'lost', 'lost', 'iPhone with a clear case and a student ID tucked in the back.'],
      ['Student ID Card', 'ID / Badge', 'Engineering Building', 4, 'found', 'found', 'Student ID card found in a lecture hall on the first floor.'],
      ['Keys', 'Keys', 'Parking Lot', 5, 'lost', 'lost', 'Two silver keys and a car fob on a red lanyard.'],
      ['Laptop Charger', 'Electronics', 'Library', 6, 'found', 'found', 'Black 65W USB-C laptop charger left plugged in at a study carrel.'],
      ['Gray Hoodie', 'Clothing', 'Student Union', 7, 'lost', 'returned', 'Gray zip-up hoodie, size M.'],
      ['Calculus Textbook', 'Books', 'Classroom Building', 8, 'found', 'returned', 'Calculus textbook with a name written inside the cover.'],
      ['Brown Leather Wallet', 'Wallet', 'Student Union', 9, 'lost', 'lost', 'Brown bifold wallet. No cash, but has cards and a driver’s license.'],
      ['Wireless Earbuds', 'Electronics', 'Library', 10, 'lost', 'returned', 'White wireless earbuds in a charging case with a blue cover.'],
      ['Sunglasses', 'Other', 'Gym', 11, 'lost', 'lost', 'Black polarized sunglasses in a soft case.'],
      ['Umbrella', 'Other', 'Dining Hall', 12, 'found', 'found', 'Large navy umbrella left by the entrance.'],
      ['Spiral Notebook', 'Books', 'Library', 13, 'lost', 'lost', 'Green spiral notebook with physics notes.'],
      ['Graphing Calculator', 'Electronics', 'Engineering Building', 14, 'lost', 'lost', 'Graphing calculator with initials on the back.'],
      ['Reading Glasses', 'Other', 'Library', 15, 'lost', 'returned', 'Thin black-framed reading glasses.']
    ];
    const now = Date.now();
    const items = seed.map(([name, category, location, days, type, status, description], i) => ({
      id: 'seed_' + (i + 1),
      name, description, location, category, type, status,
      date: daysAgoISO(days),
      image: '',
      reportedBy: reporter.email,
      reporterName: reporter.name,
      createdAt: new Date(now - days * 86400000).toISOString(),
      returnedAt: status === 'returned' ? new Date(now - Math.max(0, days - 1) * 86400000).toISOString() : null
    }));
    this.saveAll(items.concat(this.getAll()));
    localStorage.setItem(STORAGE_KEYS.seeded, '1');
  }
}

window.Auth = new AuthManager();
window.Items = new ItemManager();
