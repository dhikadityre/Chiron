/**
 * Test Suite for Chiron Page Markers (Favourite, Important, Single Bookmark)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Setup mock window, document, localStorage
const storageStore = {};
const mockLocalStorage = {
  getItem: (key) => storageStore[key] || null,
  setItem: (key, val) => { storageStore[key] = String(val); },
  removeItem: (key) => { delete storageStore[key]; },
  clear: () => { Object.keys(storageStore).forEach(k => delete storageStore[k]); }
};

class MockElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this._className = '';
    this.classList = {
      _classes: new Set(),
      add: (...cls) => {
        cls.forEach(c => this.classList._classes.add(c));
        this._className = Array.from(this.classList._classes).join(' ');
      },
      remove: (...cls) => {
        cls.forEach(c => this.classList._classes.delete(c));
        this._className = Array.from(this.classList._classes).join(' ');
      },
      contains: (c) => this.classList._classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._classes.has(c)) {
            this.classList._classes.delete(c);
            this._className = Array.from(this.classList._classes).join(' ');
            return false;
          } else {
            this.classList._classes.add(c);
            this._className = Array.from(this.classList._classes).join(' ');
            return true;
          }
        } else if (force) {
          this.classList._classes.add(c);
          this._className = Array.from(this.classList._classes).join(' ');
          return true;
        } else {
          this.classList._classes.delete(c);
          this._className = Array.from(this.classList._classes).join(' ');
          return false;
        }
      }
    };
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this.textContent = '';
    this._innerHTML = '';
    this._listeners = {};
    this.style = {};
    this.dataset = {};
  }

  get className() {
    return this._className;
  }

  set className(val) {
    this._className = val || '';
    this.classList._classes.clear();
    (this._className.split(/\s+/)).filter(Boolean).forEach(c => this.classList._classes.add(c));
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = val;
    this.children = [];
    const re = /<([a-z0-9]+)([^>]*?)>/gi;
    let match;
    while ((match = re.exec(val)) !== null) {
      const tag = match[1];
      const attrs = match[2];
      const el = new MockElement(tag);
      el.parentNode = this;
      const idMatch = attrs.match(/id="([^"]+)"/);
      if (idMatch) el.id = idMatch[1];
      const classMatch = attrs.match(/class="([^"]+)"/);
      if (classMatch) el.className = classMatch[1];
      const titleMatch = attrs.match(/title="([^"]+)"/);
      if (titleMatch) el.setAttribute('title', titleMatch[1]);
      const dataFilterMatch = attrs.match(/data-filter="([^"]+)"/);
      if (dataFilterMatch) el.dataset.filter = dataFilterMatch[1];
      this.children.push(el);
    }
  }

  getAttribute(k) { return this.attributes[k] || null; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore(newChild, refChild) {
    newChild.parentNode = this;
    const idx = this.children.indexOf(refChild);
    if (idx !== -1) {
      this.children.splice(idx, 0, newChild);
    } else {
      this.children.push(newChild);
    }
    return newChild;
  }

  addEventListener(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }

  dispatchEvent(event) {
    const list = this._listeners[event.type] || [];
    list.forEach(fn => fn(event));
  }

  querySelector(sel) {
    const all = this.querySelectorAll(sel);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(sel) {
    const results = [];
    function match(el) {
      const parts = sel.split(/[\s,]+/);
      for (const p of parts) {
        if (!p) continue;
        if (p.startsWith('#') && el.id === p.substring(1)) return true;
        if (p.startsWith('.') && el.classList.contains(p.substring(1))) return true;
        if (p.toLowerCase() === el.tagName.toLowerCase()) return true;
      }
      return false;
    }

    function search(node) {
      for (const ch of node.children) {
        if (match(ch)) results.push(ch);
        search(ch);
      }
    }
    search(this);
    return results;
  }
}

// Build mock DOM tree
const mockDoc = {
  readyState: 'complete',
  createElement: (tag) => new MockElement(tag),
  body: new MockElement('body'),
  getElementById: (id) => {
    function find(n) {
      if (n.id === id) return n;
      for (const ch of n.children) {
        const res = find(ch);
        if (res) return res;
      }
      return null;
    }
    return find(mockDoc.body);
  },
  querySelector: (sel) => mockDoc.body.querySelector(sel),
  querySelectorAll: (sel) => mockDoc.body.querySelectorAll(sel),
  addEventListener: () => {}
};

// Topbar tools container
const topbar = new MockElement('div');
topbar.className = 'topbar-tools';
mockDoc.body.appendChild(topbar);

// Tabs strip container
const tabsStrip = new MockElement('div');
tabsStrip.id = 'docTabsStrip';
mockDoc.body.appendChild(tabsStrip);

const tab1 = new MockElement('a');
tab1.className = 'doc-tab';
tab1.setAttribute('href', '01-architecture-overview.html');
tab1.textContent = '01-architecture-overview.html';
tabsStrip.appendChild(tab1);

const tabCurrent = new MockElement('a');
tabCurrent.className = 'doc-tab active';
tabCurrent.setAttribute('href', '#');
tabCurrent.textContent = '03-dependency-direction.html';
tabsStrip.appendChild(tabCurrent);

// Sidebar TOC
const desktopToc = new MockElement('aside');
desktopToc.id = 'desktopTocSidebar';
mockDoc.body.appendChild(desktopToc);

const rootNode = new MockElement('div');
rootNode.className = 'toc-tree-node root-node';
desktopToc.appendChild(rootNode);

const rootRow = new MockElement('div');
rootRow.className = 'toc-node-row';
rootNode.appendChild(rootRow);

const rootLink = new MockElement('a');
rootLink.className = 'toc-tree-link root-link';
rootLink.textContent = '03 — Dependency Direction';
rootRow.appendChild(rootLink);

// Curriculum Drawer
const drawer = new MockElement('div');
drawer.className = 'curriculum-drawer';
mockDoc.body.appendChild(drawer);

const drawerSearch = new MockElement('div');
drawerSearch.className = 'drawer-search';
drawer.appendChild(drawerSearch);

const drawerBody = new MockElement('div');
drawerBody.id = 'curriculumListBody';
drawer.appendChild(drawerBody);

const group1 = new MockElement('div');
group1.className = 'curriculum-level-group';
drawerBody.appendChild(group1);

const drawerLink1 = new MockElement('a');
drawerLink1.className = 'curriculum-item-link';
drawerLink1.setAttribute('href', '../01-project-foundation/01-application-overview.html');
drawerLink1.textContent = '01 — Application Overview';
group1.appendChild(drawerLink1);

const drawerLinkCurrent = new MockElement('a');
drawerLinkCurrent.className = 'curriculum-item-link';
drawerLinkCurrent.setAttribute('href', '03-dependency-direction.html');
drawerLinkCurrent.textContent = '03 — Dependency Direction';
group1.appendChild(drawerLinkCurrent);

// Mock Window
const mockWin = {
  location: {
    pathname: '/courses/samir-mobile-ios/03-understanding-architecture/03-dependency-direction.html',
    href: 'http://localhost:8765/courses/samir-mobile-ios/03-understanding-architecture/03-dependency-direction.html'
  },
  localStorage: mockLocalStorage,
  addEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: function (type, init) { this.type = type; this.detail = init ? init.detail : null; },
  URL: function (path, base) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      this.pathname = '/' + path.split('/').slice(3).join('/');
    } else if (path.startsWith('/')) {
      this.pathname = path;
    } else if (path === '#') {
      this.pathname = '/courses/samir-mobile-ios/03-understanding-architecture/03-dependency-direction.html';
    } else if (path.startsWith('../')) {
      this.pathname = '/courses/samir-mobile-ios/' + path.replace('../', '');
    } else {
      this.pathname = '/courses/samir-mobile-ios/03-understanding-architecture/' + path;
    }
  }
};

global.window = mockWin;
global.document = mockDoc;
global.localStorage = mockLocalStorage;
global.CustomEvent = mockWin.CustomEvent;
global.URL = mockWin.URL;

// Load script
const scriptCode = fs.readFileSync(path.join(__dirname, 'chiron-page-markers.js'), 'utf-8');
eval(scriptCode);

console.log("=== RUNNING CHIRON PAGE MARKERS TEST SUITE ===");

const Markers = mockWin.ChironPageMarkers;
assert(Markers, "ChironPageMarkers should be exported on window");

// 1. Initial State
let state = Markers.getMarkers();
assert.strictEqual(state.course, 'samir-mobile-ios');
assert.strictEqual(state.bookmark, null);
assert.strictEqual(state.favourites.length, 0);
assert.strictEqual(state.importants.length, 0);
console.log("✓ Test 1: Initial state correctly initialized for course 'samir-mobile-ios'");

// 2. Toggle Favourite
Markers.toggleFavourite();
state = Markers.getMarkers();
assert.strictEqual(state.favourites.length, 1);
assert.strictEqual(state.favourites[0], 'courses/samir-mobile-ios/03-understanding-architecture/03-dependency-direction.html');
console.log("✓ Test 2: Toggle Favourite ON successfully added current page to favourites");

// 3. Toggle Important
Markers.toggleImportant();
state = Markers.getMarkers();
assert.strictEqual(state.importants.length, 1);
assert.strictEqual(state.importants[0], 'courses/samir-mobile-ios/03-understanding-architecture/03-dependency-direction.html');
console.log("✓ Test 3: Toggle Important ON successfully added current page to importants");

// 4. Toggle Bookmark
Markers.toggleBookmark();
state = Markers.getMarkers();
assert.strictEqual(state.bookmark, 'courses/samir-mobile-ios/03-understanding-architecture/03-dependency-direction.html');
console.log("✓ Test 4: Toggle Bookmark ON successfully set current page as course bookmark");

// 5. Verify Single Bookmark Exclusivity Rule
// Simulating another page setting bookmark
state.bookmark = 'courses/samir-mobile-ios/01-project-foundation/01-application-overview.html';
Markers.refresh();
assert.strictEqual(Markers.getMarkers().bookmark, 'courses/samir-mobile-ios/01-project-foundation/01-application-overview.html');

// Now toggle bookmark on current page again -> MUST override the old bookmark!
Markers.toggleBookmark();
state = Markers.getMarkers();
assert.strictEqual(state.bookmark, 'courses/samir-mobile-ios/03-understanding-architecture/03-dependency-direction.html');
console.log("✓ Test 5: Single Bookmark Exclusivity verified! Setting bookmark overrides previous page bookmark");

// 6. Verify Badges Rendering in Tabs
const activeTabBadges = tabCurrent.querySelector('.chiron-tab-marker-badges');
assert(activeTabBadges, "Active tab must have marker badges container");
assert(activeTabBadges.innerHTML.includes('pill-bmk'), "Active tab must show bookmark pill");
assert(activeTabBadges.innerHTML.includes('pill-fav'), "Active tab must show favourite pill");
assert(activeTabBadges.innerHTML.includes('pill-imp'), "Active tab must show important pill");
console.log("✓ Test 6: Badges correctly rendered in Document Tabs strip");

// 7. Verify Badges Rendering in Sidebar TOC
const tocBadges = rootRow.querySelector('.chiron-toc-marker-badges');
assert(tocBadges, "TOC root node must have marker badges container");
assert(tocBadges.innerHTML.includes('pill-bmk'), "TOC root node must show bookmark pill");
console.log("✓ Test 7: Badges correctly rendered on Table of Contents root header");

// 8. Verify Badges Rendering in Curriculum Drawer
const drawerBadges = drawerLinkCurrent.querySelector('.chiron-drawer-marker-badges');
assert(drawerBadges, "Curriculum drawer link must have marker badges container");
assert(drawerBadges.innerHTML.includes('pill-bmk'), "Curriculum drawer link must show bookmark pill");
assert(drawerBadges.innerHTML.includes('pill-fav'), "Curriculum drawer link must show favourite pill");
console.log("✓ Test 8: Badges correctly rendered in Curriculum Drawer (Semua Modul)");

// 9. Verify LocalStorage Persistence
const stored = JSON.parse(mockLocalStorage.getItem('chiron_markers_samir-mobile-ios'));
assert(stored, "LocalStorage must contain saved markers");
assert.strictEqual(stored.bookmark, 'courses/samir-mobile-ios/03-understanding-architecture/03-dependency-direction.html');
assert.strictEqual(stored.favourites.length, 1);
assert.strictEqual(stored.importants.length, 1);
console.log("✓ Test 9: LocalStorage persistence verified with correct JSON schema");

// 10. Toggle Off verification
Markers.toggleBookmark();
state = Markers.getMarkers();
assert.strictEqual(state.bookmark, null, "Bookmark should be null after toggle off");
console.log("✓ Test 10: Toggle Bookmark OFF successfully unsets bookmark");

console.log("\n🎉 ALL 10 UNIT & INTEGRATION TESTS PASSED 100%!");
