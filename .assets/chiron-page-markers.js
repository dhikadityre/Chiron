/**
 * ==============================================================================
 * Chiron Page Markers Engine — Favourite, Important & Single-Bookmark Tracker
 * ==============================================================================
 * Features:
 * 1. Mark web pages with:
 *    - ❤️ Favourite (multi-page allowed per course)
 *    - 📌 Important (multi-page allowed per course)
 *    - 🏷️ Bookmark (STRICT SINGLE-PAGE per course — marks where the user last left off reading)
 * 2. Visual indicators rendered consistently with distinctive styling in:
 *    - Document Tabs Strip (#docTabsStrip)
 *    - On-Page Table of Contents Sidebar (#desktopTocSidebar & #mobileTocDrawer root link)
 *    - Full Curriculum Catalog Drawer (#curriculumDrawer)
 * 3. Sticky Topbar toggle controls with instant active states & glow effects.
 * 4. "Lompat ke Bookmark" (Resume Reading) quick navigation button in Topbar & Drawer.
 * 5. Curriculum Drawer Quick Filter Pills (Semua / ❤️ Favorit / 📌 Penting / 🏷️ Bookmark).
 * 6. Hybrid Local-First persistence: LocalStorage instant sync + background daemon sync.
 * 7. Realtime multi-tab synchronization via BroadcastChannel and Storage events.
 */

(function (window, document) {
  'use strict';

  // Prevent double initialization
  if (window.ChironPageMarkers) return;

  // Course & Lesson Context
  let currentCourseId = 'default';
  let currentRelLessonPath = '';
  let activeMarkers = {
    course: 'default',
    bookmark: null,
    favourites: [],
    importants: []
  };

  let courseUpdates = (typeof window !== 'undefined' && window.CHIRON_COURSE_UPDATES) ? window.CHIRON_COURSE_UPDATES : null;
  let activeDrawerMarkerFilter = 'all'; // 'all' | 'updated' | 'fav' | 'imp' | 'bmk'
  const broadcastChan = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('chiron_course_markers') : null;

  /* ============================================================================
     1. CONTEXT & PATH NORMALIZATION
     ============================================================================ */

  function initContext() {
    let path = window.location.pathname.replace(/^\//, '');
    const idx = path.indexOf('courses/');
    if (idx !== -1) {
      path = path.substring(idx);
    }
    currentRelLessonPath = path;

    const parts = path.split('/');
    if (parts.length >= 2 && parts[0] === 'courses') {
      currentCourseId = parts[1];
    } else {
      currentCourseId = 'default';
    }
    activeMarkers.course = currentCourseId;

    if (!courseUpdates && typeof window !== 'undefined' && window.CHIRON_COURSE_UPDATES) {
      courseUpdates = window.CHIRON_COURSE_UPDATES;
    }
  }

  function isPageUpdated(targetPath) {
    if (!courseUpdates || !courseUpdates.updated_pages) return false;
    const clean = targetPath.replace(/^\/?courses\/[^\/]+\//, '').replace(/^\//, '');
    return Boolean(courseUpdates.updated_pages[clean] || courseUpdates.updated_pages[targetPath]);
  }

  function getPageUpdateInfo(targetPath) {
    if (!courseUpdates || !courseUpdates.updated_pages) return null;
    const clean = targetPath.replace(/^\/?courses\/[^\/]+\//, '').replace(/^\//, '');
    return courseUpdates.updated_pages[clean] || courseUpdates.updated_pages[targetPath] || null;
  }

  function normalizeLessonPath(hrefOrPath) {
    if (!hrefOrPath || hrefOrPath === '#') return currentRelLessonPath;
    try {
      const parsed = new URL(hrefOrPath, window.location.href);
      let p = parsed.pathname.replace(/^\//, '');
      const idx = p.indexOf('courses/');
      return idx !== -1 ? p.substring(idx) : p;
    } catch (e) {
      let p = String(hrefOrPath).replace(/^\//, '');
      const idx = p.indexOf('courses/');
      return idx !== -1 ? p.substring(idx) : p;
    }
  }

  /* ============================================================================
     2. UI INITIALIZATION & INJECTION
     ============================================================================ */

  function initUI() {
    initContext();
    injectTopbarControls();
    injectDrawerFilterPills();
    loadAndRenderMarkers();
    setupEvents();
  }

  function injectTopbarControls() {
    const topbarTools = document.querySelector('.topbar-tools');
    if (!topbarTools) return;

    if (!document.getElementById('chironMarkersGroup')) {
      const group = document.createElement('div');
      group.id = 'chironMarkersGroup';
      group.className = 'chiron-page-markers-group';
      group.innerHTML = `
        <!-- Quick Jump to Bookmark (Resume Reading) -->
        <button class="tool-btn chiron-jump-bookmark-btn" id="chironJumpBookmarkBtn" title="Lompat ke Halaman Terakhir Dibaca (Bookmark)">
          <span class="icon">🏷️</span>
          <span class="label">Ke Bookmark</span>
        </button>

        <!-- Divider -->
        <div class="chiron-tb-divider"></div>

        <!-- Marker Toggles -->
        <button class="tool-btn chiron-marker-btn marker-btn-fav" id="chironBtnFav" title="Tandai Halaman Ini Sebagai Favorit">
          <span class="icon">❤️</span>
          <span class="label">Favorit</span>
        </button>
        <button class="tool-btn chiron-marker-btn marker-btn-imp" id="chironBtnImp" title="Tandai Halaman Ini Sebagai Penting">
          <span class="icon">📌</span>
          <span class="label">Penting</span>
        </button>
        <button class="tool-btn chiron-marker-btn marker-btn-bmk" id="chironBtnBmk" title="Tandai Halaman Ini Sebagai Buku Terakhir Dibaca (Bookmark Tunggal)">
          <span class="icon">🏷️</span>
          <span class="label">Bookmark</span>
        </button>
      `;

      // Prepend to topbarTools or insert before other buttons
      topbarTools.insertBefore(group, topbarTools.firstChild);

      // Event listeners
      document.getElementById('chironJumpBookmarkBtn').addEventListener('click', handleJumpToBookmark);
      document.getElementById('chironBtnFav').addEventListener('click', toggleFavourite);
      document.getElementById('chironBtnImp').addEventListener('click', toggleImportant);
      document.getElementById('chironBtnBmk').addEventListener('click', toggleBookmark);
    }
  }

  function injectDrawerFilterPills() {
    const drawerSearch = document.querySelector('.curriculum-drawer .drawer-search');
    if (drawerSearch && !document.getElementById('curriculumMarkerFilters')) {
      const filterBar = document.createElement('div');
      filterBar.id = 'curriculumMarkerFilters';
      filterBar.className = 'curriculum-marker-filters';
      filterBar.innerHTML = `
        <button class="marker-filter-pill active" data-filter="all">Semua</button>
        <button class="marker-filter-pill pill-updated" data-filter="updated">✨ Diperbarui (<span id="curriculumUpdatedCount">0</span>)</button>
        <button class="marker-filter-pill pill-fav" data-filter="fav">❤️ Favorit (<span id="curriculumFavCount">0</span>)</button>
        <button class="marker-filter-pill pill-imp" data-filter="imp">📌 Penting (<span id="curriculumImpCount">0</span>)</button>
        <button class="marker-filter-pill pill-bmk" data-filter="bmk">🏷️ Bookmark (<span id="curriculumBmkCount">0</span>)</button>
      `;
      drawerSearch.appendChild(filterBar);

      filterBar.querySelectorAll('.marker-filter-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          filterBar.querySelectorAll('.marker-filter-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeDrawerMarkerFilter = btn.dataset.filter;
          applyCurriculumFilters();
        });
      });

      // Hook into existing filterCurriculum function if present
      const origInput = document.getElementById('moduleSearchInput');
      if (origInput) {
        origInput.addEventListener('input', applyCurriculumFilters);
      }
    }
  }

  function setupEvents() {
    // Cross-tab broadcast listener
    if (broadcastChan) {
      broadcastChan.onmessage = (event) => {
        if (event.data && event.data.course === currentCourseId) {
          activeMarkers = event.data.markers;
          renderAllIndicators();
        }
      };
    }

    // Storage event listener fallback
    window.addEventListener('storage', (e) => {
      if (e.key === `chiron_markers_${currentCourseId}` && e.newValue) {
        try {
          activeMarkers = JSON.parse(e.newValue);
          renderAllIndicators();
        } catch (err) {}
      }
    });

    // Custom Chiron sync listener
    window.addEventListener('chiron:markers-updated', (e) => {
      if (e.detail && e.detail.courseId === currentCourseId) {
        activeMarkers = e.detail.markers;
        renderAllIndicators();
      }
    });
  }

  /* ============================================================================
     3. DATA PERSISTENCE & ACTIONS
     ============================================================================ */

  async function loadAndRenderMarkers() {
    if (!courseUpdates) {
      if (typeof window !== 'undefined' && window.CHIRON_COURSE_UPDATES) {
        courseUpdates = window.CHIRON_COURSE_UPDATES;
      } else if (typeof fetch === 'function') {
        try {
          const res = await fetch(`courses/${currentCourseId}/course_updates.json`);
          if (res.ok) {
            courseUpdates = await res.json();
          }
        } catch (e) {}
      }
    }

    if (window.ChironSync && typeof window.ChironSync.loadCourseMarkers === 'function') {
      try {
        const loaded = await window.ChironSync.loadCourseMarkers(currentCourseId);
        if (loaded) {
          activeMarkers = {
            course: currentCourseId,
            bookmark: loaded.bookmark || null,
            favourites: Array.isArray(loaded.favourites) ? loaded.favourites : [],
            importants: Array.isArray(loaded.importants) ? loaded.importants : []
          };
        }
      } catch (err) {
        console.warn('[ChironMarkers] Failed to load markers from ChironSync:', err);
      }
    } else {
      // Fallback directly to localStorage
      try {
        const raw = localStorage.getItem(`chiron_markers_${currentCourseId}`);
        if (raw) activeMarkers = JSON.parse(raw);
      } catch (e) {}
    }

    renderAllIndicators();
  }

  async function saveMarkers() {
    renderAllIndicators();

    // Broadcast cross-tab
    if (broadcastChan) {
      try {
        broadcastChan.postMessage({ course: currentCourseId, markers: activeMarkers });
      } catch (e) {}
    }

    if (window.ChironSync && typeof window.ChironSync.saveCourseMarkers === 'function') {
      try {
        await window.ChironSync.saveCourseMarkers(currentCourseId, activeMarkers);
      } catch (err) {
        console.warn('[ChironMarkers] Error saving to ChironSync:', err);
      }
    } else {
      try {
        localStorage.setItem(`chiron_markers_${currentCourseId}`, JSON.stringify(activeMarkers));
      } catch (e) {}
    }
  }

  function toggleFavourite() {
    const idx = activeMarkers.favourites.indexOf(currentRelLessonPath);
    if (idx !== -1) {
      activeMarkers.favourites.splice(idx, 1);
      showToast('💔 Halaman dihapus dari Favorit', 'info');
    } else {
      activeMarkers.favourites.push(currentRelLessonPath);
      showToast('❤️ Halaman ditambahkan ke Favorit!', 'success');
    }
    saveMarkers();
  }

  function toggleImportant() {
    const idx = activeMarkers.importants.indexOf(currentRelLessonPath);
    if (idx !== -1) {
      activeMarkers.importants.splice(idx, 1);
      showToast('Tanda Penting dihapus', 'info');
    } else {
      activeMarkers.importants.push(currentRelLessonPath);
      showToast('📌 Halaman ditandai sebagai Penting!', 'success');
    }
    saveMarkers();
  }

  function toggleBookmark() {
    // Single bookmark exclusivity rule per course:
    if (activeMarkers.bookmark === currentRelLessonPath) {
      activeMarkers.bookmark = null;
      showToast('🏷️ Bookmark baca terakhir dilepas', 'info');
    } else {
      activeMarkers.bookmark = currentRelLessonPath;
      showToast('🏷️ Bookmark ditetapkan! (Halaman terakhir dibaca)', 'success');
    }
    saveMarkers();
  }

  function handleJumpToBookmark() {
    if (!activeMarkers.bookmark) {
      showToast('Belum ada bookmark yang diset pada buku ini.', 'info');
      return;
    }

    if (activeMarkers.bookmark === currentRelLessonPath) {
      showToast('🏷️ Anda sudah berada di halaman bookmark terakhir!', 'info');
      return;
    }

    // Determine target URL relative to Chiron root
    // Compute relative link between currentRelLessonPath and target bookmark
    const rootRel = computeRelativePath(currentRelLessonPath, activeMarkers.bookmark);
    showToast('🏷️ Melompat ke bookmark terakhir dibaca...', 'info');
    setTimeout(() => {
      window.location.href = rootRel;
    }, 300);
  }

  function computeRelativePath(fromPath, toPath) {
    const fromDirs = fromPath.split('/').slice(0, -1);
    const toDirs = toPath.split('/');
    let common = 0;
    while (common < fromDirs.length && common < toDirs.length && fromDirs[common] === toDirs[common]) {
      common++;
    }
    const upCount = fromDirs.length - common;
    const upStr = '../'.repeat(upCount);
    const downStr = toDirs.slice(common).join('/');
    return (upStr + downStr) || './';
  }

  /* ============================================================================
     4. RENDERING INDICATORS (TOPBAR, TABS, TOC & DRAWER)
     ============================================================================ */

  function renderAllIndicators() {
    renderTopbarButtons();
    renderTabBadges();
    renderTocBadges();
    renderCurriculumDrawerBadges();
    updateDrawerFilterCounts();
    applyCurriculumFilters();
  }

  function renderTopbarButtons() {
    const isFav = activeMarkers.favourites.includes(currentRelLessonPath);
    const isImp = activeMarkers.importants.includes(currentRelLessonPath);
    const isBmk = activeMarkers.bookmark === currentRelLessonPath;

    const btnFav = document.getElementById('chironBtnFav');
    const btnImp = document.getElementById('chironBtnImp');
    const btnBmk = document.getElementById('chironBtnBmk');
    const btnJump = document.getElementById('chironJumpBookmarkBtn');

    if (btnFav) btnFav.classList.toggle('active', isFav);
    if (btnImp) btnImp.classList.toggle('active', isImp);
    if (btnBmk) btnBmk.classList.toggle('active', isBmk);

    if (btnJump) {
      if (activeMarkers.bookmark) {
        btnJump.classList.add('has-bookmark');
        btnJump.title = `Lompat ke Bookmark Terakhir: ${activeMarkers.bookmark.split('/').pop()}`;
        btnJump.disabled = false;
      } else {
        btnJump.classList.remove('has-bookmark');
        btnJump.title = 'Belum ada bookmark pada kursus ini';
      }
    }
  }

  function renderTabBadges() {
    const tabsStrip = document.getElementById('docTabsStrip');
    if (!tabsStrip) return;

    const tabs = tabsStrip.querySelectorAll('.doc-tab');
    tabs.forEach(tab => {
      const isCurrentActive = tab.classList.contains('active');
      const href = tab.getAttribute('href');
      const targetPath = isCurrentActive ? currentRelLessonPath : normalizeLessonPath(href);

      const isFav = activeMarkers.favourites.includes(targetPath);
      const isImp = activeMarkers.importants.includes(targetPath);
      const isBmk = activeMarkers.bookmark === targetPath;
      const isUpdated = isPageUpdated(targetPath);

      let badgeContainer = tab.querySelector('.chiron-tab-marker-badges');
      if (!badgeContainer) {
        badgeContainer = document.createElement('span');
        badgeContainer.className = 'chiron-tab-marker-badges';
        const closeBtn = tab.querySelector('.tab-close');
        if (closeBtn) {
          tab.insertBefore(badgeContainer, closeBtn);
        } else {
          tab.appendChild(badgeContainer);
        }
      }

      badgeContainer.innerHTML = buildBadgesHTML(isBmk, isFav, isImp, isUpdated, true);
    });
  }

  function renderTocBadges() {
    // Render on root header in desktop and mobile TOC
    const rootNodes = document.querySelectorAll('#desktopTocSidebar .toc-tree-node.root-node, #mobileTocDrawer .toc-tree-node.root-node');
    const isFav = activeMarkers.favourites.includes(currentRelLessonPath);
    const isImp = activeMarkers.importants.includes(currentRelLessonPath);
    const isBmk = activeMarkers.bookmark === currentRelLessonPath;
    const isUpdated = isPageUpdated(currentRelLessonPath);

    rootNodes.forEach(node => {
      const row = node.querySelector('.toc-node-row');
      if (!row) return;

      let badgeContainer = row.querySelector('.chiron-toc-marker-badges');
      if (!badgeContainer) {
        badgeContainer = document.createElement('span');
        badgeContainer.className = 'chiron-toc-marker-badges';
        row.appendChild(badgeContainer);
      }
      badgeContainer.innerHTML = buildBadgesHTML(isBmk, isFav, isImp, isUpdated, true);
    });
  }

  function renderCurriculumDrawerBadges() {
    const links = document.querySelectorAll('.curriculum-drawer .curriculum-item-link');
    links.forEach(link => {
      const href = link.getAttribute('href');
      const targetPath = normalizeLessonPath(href);

      const isFav = activeMarkers.favourites.includes(targetPath);
      const isImp = activeMarkers.importants.includes(targetPath);
      const isBmk = activeMarkers.bookmark === targetPath;
      const isUpdated = isPageUpdated(targetPath);

      // Mark metadata on element for filtering
      link.dataset.chironFav = isFav ? 'true' : 'false';
      link.dataset.chironImp = isImp ? 'true' : 'false';
      link.dataset.chironBmk = isBmk ? 'true' : 'false';
      link.dataset.chironUpdated = isUpdated ? 'true' : 'false';

      let badgeContainer = link.querySelector('.chiron-drawer-marker-badges');
      if (!badgeContainer) {
        badgeContainer = document.createElement('span');
        badgeContainer.className = 'chiron-drawer-marker-badges';
        link.appendChild(badgeContainer);
      }
      badgeContainer.innerHTML = buildBadgesHTML(isBmk, isFav, isImp, isUpdated, false);
    });
  }

  function buildBadgesHTML(isBmk, isFav, isImp, isUpdated = false, isCompact = false) {
    let html = '';
    // Display updated badge first as a prominent highlight
    if (isUpdated) {
      const text = isCompact ? '✨' : '✨ UPDATED';
      html += `<span class="marker-pill pill-updated" title="Halaman ini baru saja diperbarui">${text}</span>`;
    }
    // Single bookmark is the most primary reader landmark: display next
    if (isBmk) {
      html += `<span class="marker-pill pill-bmk" title="Bookmark Terakhir Dibaca">🏷️</span>`;
    }
    if (isFav) {
      html += `<span class="marker-pill pill-fav" title="Halaman Favorit">❤️</span>`;
    }
    if (isImp) {
      html += `<span class="marker-pill pill-imp" title="Halaman Penting">📌</span>`;
    }
    return html;
  }

  function updateDrawerFilterCounts() {
    const favCountEl = document.getElementById('curriculumFavCount');
    const impCountEl = document.getElementById('curriculumImpCount');
    const bmkCountEl = document.getElementById('curriculumBmkCount');
    const updatedCountEl = document.getElementById('curriculumUpdatedCount');

    if (favCountEl) favCountEl.textContent = activeMarkers.favourites.length;
    if (impCountEl) impCountEl.textContent = activeMarkers.importants.length;
    if (bmkCountEl) bmkCountEl.textContent = activeMarkers.bookmark ? 1 : 0;
    if (updatedCountEl) {
      const totalUpdated = (courseUpdates && courseUpdates.updated_pages)
        ? Object.keys(courseUpdates.updated_pages).length
        : 0;
      updatedCountEl.textContent = totalUpdated;
    }
  }

  function applyCurriculumFilters() {
    const searchInput = document.getElementById('moduleSearchInput');
    const query = searchInput ? (searchInput.value || '').toLowerCase().trim() : '';
    const links = document.querySelectorAll('.curriculum-drawer .curriculum-item-link');

    links.forEach(link => {
      const text = (link.innerText || link.textContent || '').toLowerCase();
      const textMatch = !query || text.includes(query);
      let filterMatch = true;

      if (activeDrawerMarkerFilter === 'updated') {
        filterMatch = link.dataset.chironUpdated === 'true';
      } else if (activeDrawerMarkerFilter === 'fav') {
        filterMatch = link.dataset.chironFav === 'true';
      } else if (activeDrawerMarkerFilter === 'imp') {
        filterMatch = link.dataset.chironImp === 'true';
      } else if (activeDrawerMarkerFilter === 'bmk') {
        filterMatch = link.dataset.chironBmk === 'true';
      }

      link.style.display = (textMatch && filterMatch) ? 'flex' : 'none';
    });

    // Also toggle parent groups if all children are hidden
    const groups = document.querySelectorAll('.curriculum-drawer .curriculum-level-group');
    groups.forEach(group => {
      const visibleChildren = group.querySelectorAll('.curriculum-item-link[style*="display: flex"]');
      group.style.display = visibleChildren.length > 0 ? 'block' : 'none';
    });
  }

  function showToast(message, type = 'info') {
    let toast = document.getElementById('chironToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'chironToast';
      toast.className = 'chiron-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `chiron-toast show toast-${type}`;
    if (toast._timer) clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  /* ============================================================================
     5. BOOTSTRAP ON LOAD
     ============================================================================ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }

  window.ChironPageMarkers = {
    toggleFavourite,
    toggleImportant,
    toggleBookmark,
    handleJumpToBookmark,
    getMarkers: () => activeMarkers,
    getCourseUpdates: () => courseUpdates,
    setCourseUpdates: (updates) => {
      courseUpdates = updates;
      renderAllIndicators();
    },
    refresh: renderAllIndicators
  };

})(window, document);
