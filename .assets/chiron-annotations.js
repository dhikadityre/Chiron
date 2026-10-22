/**
 * ==============================================================================
 * Chiron Annotations Engine — Hybrid Selection, Gutter, Filters & Recap Drawer
 * ==============================================================================
 * Features:
 * 1. Desktop Free Text Selection with Floating Action Toolbar (📝 Note / 🤖 Tanya AI).
 * 2. iPad / Touch-Friendly Gutter Action Icons beside paragraphs, code blocks, & lists.
 * 3. Non-destructive DOM Highlighting with Stabilo color coding.
 * 4. Popover Input Dialog with Keyboard shortcuts (Cmd+Enter to save, Esc to cancel).
 * 5. Interactive Popover Card on Hover/Tap of highlighted text.
 * 6. Visibility Filter System (Show All, Notes Only, AI Questions Only, Hide All).
 * 7. Slide-Out Recap Drawer summarizing all notes & AI questions with jump-to links.
 * 8. "Copy AI Queue to Prompt" helper to easily copy pending questions to AI Agent.
 * 9. Real-time silent persistence via ChironSync (Sidecar JSON & LocalStorage fallback).
 */

(function (window, document) {
  'use strict';

  // State
  let activeAnnotations = [];
  let pendingSelection = null; // { exact, prefix, suffix, selector, range }
  let currentFilter = 'all'; // 'all' | 'notes' | 'ai' | 'hide_all'
  let currentDrawerTab = 'all'; // 'all' | 'notes' | 'ai'
  const lessonPath = window.location.pathname.replace(/^\//, '');

  /* ============================================================================
     1. DOM INITIALIZATION & INJECTION OF FLOATING & DRAWER ELEMENTS
     ============================================================================ */

  function initUI() {
    // 1. Floating Toolbar (Desktop Selection)
    if (!document.getElementById('chironFloatingToolbar')) {
      const toolbar = document.createElement('div');
      toolbar.id = 'chironFloatingToolbar';
      toolbar.className = 'chiron-floating-toolbar';
      toolbar.innerHTML = `
        <button class="chiron-tb-btn btn-note" id="chironTbNoteBtn" title="Simpan Catatan Pribadi (Permanen)">
          <span class="icon">📝</span>
          <span class="label">Catatan</span>
        </button>
        <div class="chiron-tb-divider"></div>
        <button class="chiron-tb-btn btn-ai" id="chironTbAiBtn" title="Simpan Pertanyaan untuk AI Agent">
          <span class="icon">🤖</span>
          <span class="label">Tanya AI</span>
        </button>
      `;
      document.body.appendChild(toolbar);

      document.getElementById('chironTbNoteBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        openInputDialog('note');
      });

      document.getElementById('chironTbAiBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        openInputDialog('ai_question');
      });
    }

    // 2. Input Popover Dialog
    if (!document.getElementById('chironInputDialog')) {
      const dialog = document.createElement('div');
      dialog.id = 'chironInputDialog';
      dialog.className = 'chiron-input-dialog-overlay';
      dialog.innerHTML = `
        <div class="chiron-dialog-card" id="chironDialogCard">
          <div class="chiron-dialog-header">
            <span class="chiron-type-pill" id="chironDialogTypePill">📝 Catatan Pribadi</span>
            <button class="chiron-dialog-close-btn" id="chironDialogCloseBtn">✕</button>
          </div>
          <div class="chiron-dialog-quote-box" id="chironDialogQuote"></div>
          <textarea class="chiron-dialog-textarea" id="chironDialogInput" rows="3" placeholder="Tulis catatan atau pertanyaan Anda di sini... (Cmd+Enter untuk simpan)"></textarea>
          <div class="chiron-dialog-footer">
            <span class="chiron-hint">Cmd/Ctrl + Enter untuk simpan</span>
            <div class="chiron-dialog-actions">
              <button class="chiron-btn chiron-btn-secondary" id="chironDialogCancelBtn">Batal</button>
              <button class="chiron-btn chiron-btn-primary" id="chironDialogSubmitBtn">Simpan</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(dialog);

      document.getElementById('chironDialogCloseBtn').addEventListener('click', closeInputDialog);
      document.getElementById('chironDialogCancelBtn').addEventListener('click', closeInputDialog);
      document.getElementById('chironDialogSubmitBtn').addEventListener('click', submitCurrentAnnotation);

      document.getElementById('chironDialogInput').addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          submitCurrentAnnotation();
        } else if (e.key === 'Escape') {
          closeInputDialog();
        }
      });
    }

    // 3. Highlight Details Popover (Hover/Tap Card)
    if (!document.getElementById('chironDetailCard')) {
      const detailCard = document.createElement('div');
      detailCard.id = 'chironDetailCard';
      detailCard.className = 'chiron-detail-card';
      detailCard.innerHTML = `
        <div class="detail-header">
          <span class="detail-type-badge" id="chironDetailType">📝 Catatan</span>
          <button class="detail-close-btn" id="chironDetailClose">✕</button>
        </div>
        <div class="detail-content" id="chironDetailContent"></div>
        <div class="detail-footer">
          <span class="detail-date" id="chironDetailDate"></span>
          <div class="detail-actions">
            <button class="detail-btn-action detail-btn-delete" id="chironDetailDelete" title="Hapus anotasi ini">🗑️ Hapus</button>
          </div>
        </div>
      `;
      document.body.appendChild(detailCard);

      document.getElementById('chironDetailClose').addEventListener('click', hideDetailCard);
      document.getElementById('chironDetailDelete').addEventListener('click', deleteCurrentDetailAnnotation);
    }

    // 4. Toast notification element
    if (!document.getElementById('chironToast')) {
      const toast = document.createElement('div');
      toast.id = 'chironToast';
      toast.className = 'chiron-toast';
      document.body.appendChild(toast);
    }

    // 5. In-Topbar Controls & Slide-Out Recap Drawer
    initFilterAndRecapUI();
  }

  /* ============================================================================
     2. TOPBAR CONTROLS & RECAP DRAWER INITIALIZATION
     ============================================================================ */

  function initFilterAndRecapUI() {
    // A. Inject Controls into .topbar-tools if present
    const topbarTools = document.querySelector('.topbar-tools');
    if (topbarTools && !document.getElementById('chironTopbarControls')) {
      const controlsWrapper = document.createElement('div');
      controlsWrapper.id = 'chironTopbarControls';
      controlsWrapper.className = 'chiron-topbar-controls';
      controlsWrapper.innerHTML = `
        <!-- Filter Dropdown Trigger -->
        <div class="chiron-dropdown-container">
          <button class="tool-btn chiron-filter-btn" id="chironFilterDropdownBtn" title="Filter Visibilitas Stabilo">
            <span id="chironFilterCurrentIcon">👁️</span>
            <span id="chironFilterCurrentLabel">Semua Stabilo</span>
            <span class="arrow">▾</span>
          </button>
          <div class="chiron-dropdown-menu" id="chironFilterMenu">
            <button class="chiron-menu-item active" data-filter="all">
              <span class="icon">👁️</span> Tampilkan Semua Stabilo
            </button>
            <button class="chiron-menu-item" data-filter="notes">
              <span class="icon">📝</span> Hanya Catatan (Sembunyikan AI)
            </button>
            <button class="chiron-menu-item" data-filter="ai">
              <span class="icon">🤖</span> Hanya Tanya AI (Sembunyikan Catatan)
            </button>
            <div class="chiron-menu-divider"></div>
            <button class="chiron-menu-item" data-filter="hide_all">
              <span class="icon">🙈</span> Sembunyikan Semua Stabilo
            </button>
          </div>
        </div>

        <!-- Recap Drawer Open Button -->
        <button class="tool-btn chiron-recap-trigger-btn" id="chironOpenRecapBtn" title="Buka Rekapitulasi Catatan & Antrean AI">
          📑 Catatan & AI
          <span class="chiron-badge" id="chironTopbarTotalBadge">0</span>
        </button>
      `;

      // Insert before other tools or prepend
      topbarTools.insertBefore(controlsWrapper, topbarTools.firstChild);

      // Setup Dropdown Toggle
      const filterBtn = document.getElementById('chironFilterDropdownBtn');
      const filterMenu = document.getElementById('chironFilterMenu');

      filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterMenu.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!controlsWrapper.contains(e.target)) {
          filterMenu.classList.remove('open');
        }
      });

      // Filter Item Click Handlers
      filterMenu.querySelectorAll('.chiron-menu-item').forEach(item => {
        item.addEventListener('click', () => {
          const filter = item.dataset.filter;
          applyVisibilityFilter(filter);
          filterMenu.classList.remove('open');
        });
      });

      // Recap Drawer Trigger
      document.getElementById('chironOpenRecapBtn').addEventListener('click', () => {
        openRecapDrawer();
      });
    }

    // B. Inject Recap Drawer & Overlay into Body
    if (!document.getElementById('chironRecapOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'chironRecapOverlay';
      overlay.className = 'chiron-recap-overlay';
      overlay.addEventListener('click', closeRecapDrawer);
      document.body.appendChild(overlay);

      const drawer = document.createElement('aside');
      drawer.id = 'chironRecapDrawer';
      drawer.className = 'chiron-recap-drawer';
      drawer.innerHTML = `
        <div class="recap-header">
          <div class="recap-title">
            <span>📑 Rekapitulasi Catatan & AI</span>
            <span class="chiron-badge" id="chironDrawerBadge">0</span>
          </div>
          <button class="recap-close-btn" id="chironRecapCloseBtn">✕</button>
        </div>

        <div class="recap-tabs-bar">
          <button class="recap-tab active" data-tab="all" id="recapTabAll">Semua (<span id="recapCountAll">0</span>)</button>
          <button class="recap-tab" data-tab="notes" id="recapTabNotes">📝 Catatan (<span id="recapCountNotes">0</span>)</button>
          <button class="recap-tab" data-tab="ai" id="recapTabAi">🤖 Tanya AI (<span id="recapCountAi">0</span>)</button>
        </div>

        <div class="recap-body" id="chironRecapList">
          <!-- Dynamic Annotation Cards -->
        </div>

        <div class="recap-footer">
          <button class="recap-action-btn btn-copy-prompt" id="chironCopyAiQueueBtn" title="Salin seluruh antrean pertanyaan AI ke format prompt chat">
            📋 Salin Antrean AI ke Prompt
          </button>
          <button class="recap-action-btn btn-export" id="chironExportJsonBtn" title="Unduh berkas JSON sebagai backup lokal">
            📥 Ekspor JSON
          </button>
        </div>
      `;
      document.body.appendChild(drawer);

      document.getElementById('chironRecapCloseBtn').addEventListener('click', closeRecapDrawer);

      // Drawer Tabs
      drawer.querySelectorAll('.recap-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          drawer.querySelectorAll('.recap-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          currentDrawerTab = tab.dataset.tab;
          renderRecapList();
        });
      });

      // Export & Copy Helper Handlers
      document.getElementById('chironExportJsonBtn').addEventListener('click', () => {
        if (window.ChironSync) {
          window.ChironSync.exportToFile(lessonPath, activeAnnotations);
          showToast('📥 Berkas JSON berhasil diunduh!');
        }
      });

      document.getElementById('chironCopyAiQueueBtn').addEventListener('click', copyAiQueueToClipboard);
    }

    // C. Inject Floating Quick Filter Pill (Accessible across all screens)
    if (!document.getElementById('chironFloatingFilterPill')) {
      const pill = document.createElement('div');
      pill.id = 'chironFloatingFilterPill';
      pill.className = 'chiron-floating-pill-widget';
      pill.innerHTML = `
        <button class="chiron-quick-filter-btn" id="chironQuickToggleBtn" title="Ganti Mode Visibilitas Stabilo">
          <span id="chironQuickIcon">👁️</span>
          <span class="counts"><span id="pillNotesCount">0</span>📝 • <span id="pillAiCount">0</span>🤖</span>
        </button>
        <button class="chiron-quick-drawer-btn" id="chironQuickDrawerBtn" title="Buka Rekapitulasi Catatan">
          📑
        </button>
      `;
      document.body.appendChild(pill);

      document.getElementById('chironQuickToggleBtn').addEventListener('click', cycleVisibilityFilter);
      document.getElementById('chironQuickDrawerBtn').addEventListener('click', openRecapDrawer);
    }
  }

  /* ============================================================================
     3. VISIBILITY FILTER LOGIC
     ============================================================================ */

  function applyVisibilityFilter(filter) {
    currentFilter = filter;
    document.body.classList.remove(
      'chiron-filter-notes-only',
      'chiron-filter-ai-only',
      'chiron-filter-hide-all'
    );

    const iconEl = document.getElementById('chironFilterCurrentIcon');
    const labelEl = document.getElementById('chironFilterCurrentLabel');
    const quickIcon = document.getElementById('chironQuickIcon');

    if (filter === 'notes') {
      document.body.classList.add('chiron-filter-notes-only');
      if (iconEl) iconEl.textContent = '📝';
      if (labelEl) labelEl.textContent = 'Hanya Catatan';
      if (quickIcon) quickIcon.textContent = '📝';
      showToast('👁️ Mode: Hanya Catatan terlihat (Stabilo AI disembunyikan)');
    } else if (filter === 'ai') {
      document.body.classList.add('chiron-filter-ai-only');
      if (iconEl) iconEl.textContent = '🤖';
      if (labelEl) labelEl.textContent = 'Hanya Tanya AI';
      if (quickIcon) quickIcon.textContent = '🤖';
      showToast('👁️ Mode: Hanya Pertanyaan AI terlihat (Catatan disembunyikan)');
    } else if (filter === 'hide_all') {
      document.body.classList.add('chiron-filter-hide-all');
      if (iconEl) iconEl.textContent = '🙈';
      if (labelEl) labelEl.textContent = 'Sembunyikan Semua';
      if (quickIcon) quickIcon.textContent = '🙈';
      showToast('👁️ Mode: Semua stabilo disembunyikan (Membaca bersih)');
    } else {
      // All
      if (iconEl) iconEl.textContent = '👁️';
      if (labelEl) labelEl.textContent = 'Semua Stabilo';
      if (quickIcon) quickIcon.textContent = '👁️';
      showToast('👁️ Mode: Semua stabilo ditampilkan');
    }

    // Update active dropdown item
    const menu = document.getElementById('chironFilterMenu');
    if (menu) {
      menu.querySelectorAll('.chiron-menu-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
      });
    }
  }

  function cycleVisibilityFilter() {
    const sequence = ['all', 'notes', 'ai', 'hide_all'];
    const nextIdx = (sequence.indexOf(currentFilter) + 1) % sequence.length;
    applyVisibilityFilter(sequence[nextIdx]);
  }

  /* ============================================================================
     4. RECAP DRAWER RENDERING & INTERACTION
     ============================================================================ */

  function openRecapDrawer() {
    renderRecapList();
    const overlay = document.getElementById('chironRecapOverlay');
    const drawer = document.getElementById('chironRecapDrawer');
    if (overlay && drawer) {
      overlay.classList.add('open');
      drawer.classList.add('open');
    }
  }

  function closeRecapDrawer() {
    const overlay = document.getElementById('chironRecapOverlay');
    const drawer = document.getElementById('chironRecapDrawer');
    if (overlay && drawer) {
      overlay.classList.remove('open');
      drawer.classList.remove('open');
    }
  }

  function renderRecapList() {
    const listEl = document.getElementById('chironRecapList');
    if (!listEl) return;

    updateBadges();

    // Filter by active drawer tab
    let items = activeAnnotations;
    if (currentDrawerTab === 'notes') {
      items = items.filter(a => a.type === 'note');
    } else if (currentDrawerTab === 'ai') {
      items = items.filter(a => a.type === 'ai_question');
    }

    if (items.length === 0) {
      listEl.innerHTML = `
        <div class="recap-empty-state">
          <span class="icon">🍃</span>
          <p>Belum ada ${currentDrawerTab === 'notes' ? 'catatan' : currentDrawerTab === 'ai' ? 'pertanyaan AI' : 'catatan atau pertanyaan AI'} pada modul ini.</p>
          <small>Seleksi teks atau klik ikon 💬 di tepi baris untuk menandai.</small>
        </div>
      `;
      return;
    }

    listEl.innerHTML = items.map((anno, i) => {
      const isNote = anno.type === 'note';
      const dt = new Date(anno.created_at);
      const timeStr = `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const snippet = anno.anchor?.exact || '(Seluruh blok teks)';

      return `
        <div class="recap-item-card ${isNote ? 'card-note' : 'card-ai'}" data-anno-id="${anno.id}">
          <div class="recap-card-header">
            <span class="recap-badge ${isNote ? 'badge-note' : 'badge-ai'}">
              ${isNote ? '📝 Catatan' : '🤖 Tanya AI'}
            </span>
            ${anno.isOrphaned ? '<span class="recap-badge-orphaned" title="Teks asli mungkin telah diedit atau dihapus saat pembaruan materi">⚠️ Teks Bergeser / Diedit</span>' : ''}
            <span class="recap-card-time">${timeStr}</span>
          </div>
          <div class="recap-card-quote">"${escapeHtml(snippet)}"</div>
          <div class="recap-card-content">${escapeHtml(anno.content)}</div>
          <div class="recap-card-actions">
            <button class="recap-btn-jump" onclick="window.ChironAnnotations.jumpTo('${anno.id}')" title="Scroll ke teks terkait">
              🔍 Lompat ke Teks
            </button>
            <button class="recap-btn-delete" onclick="window.ChironAnnotations.deleteById('${anno.id}')" title="Hapus catatan ini">
              🗑️ Hapus
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateBadges() {
    const total = activeAnnotations.length;
    const notesCount = activeAnnotations.filter(a => a.type === 'note').length;
    const aiCount = activeAnnotations.filter(a => a.type === 'ai_question').length;

    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt('chironTopbarTotalBadge', total);
    setTxt('chironDrawerBadge', total);
    setTxt('recapCountAll', total);
    setTxt('recapCountNotes', notesCount);
    setTxt('recapCountAi', aiCount);
    setTxt('pillNotesCount', notesCount);
    setTxt('pillAiCount', aiCount);
  }

  function jumpToAnnotation(annoId) {
    const target = document.querySelector(`[data-chiron-id="${annoId}"]`);
    if (target) {
      closeRecapDrawer();
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('chiron-pulse-highlight');
      setTimeout(() => target.classList.remove('chiron-pulse-highlight'), 2200);
      showDetailCard(annoId, target);
    } else {
      showToast('⚠️ Elemen teks tidak ditemukan di tampilan saat ini.');
    }
  }

  function copyAiQueueToClipboard() {
    const aiQuestions = activeAnnotations.filter(a => a.type === 'ai_question');
    if (aiQuestions.length === 0) {
      showToast('⚠️ Tidak ada antrean pertanyaan AI yang aktif.');
      return;
    }

    let promptText = `Halo AI Agent, saya memiliki ${aiQuestions.length} pertanyaan/arahan dari modul ${lessonPath}:\n\n`;
    aiQuestions.forEach((q, idx) => {
      promptText += `### Pertanyaan #${idx + 1}\n`;
      promptText += `> Kutipan Teks: "${q.anchor?.exact || ''}"\n\n`;
      promptText += `**Pertanyaan / Arahan:**\n${q.content}\n\n`;
      promptText += `---\n`;
    });
    promptText += `Mohon dijawab secara komprehensif, dan setelah selesai, bersihkan pertanyaan ini dari file sidecar ${lessonPath.replace(/\.html$/, '.notes.json')}.`;

    navigator.clipboard.writeText(promptText).then(() => {
      showToast('📋 Antrean pertanyaan AI berhasil disalin ke clipboard!');
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
      showToast('⚠️ Gagal menyalin ke clipboard.');
    });
  }

  /* ============================================================================
     5. GUTTER ACTION ICONS (iPad & Desktop Ergonomics)
     ============================================================================ */

  function injectGutterTriggers() {
    const mainContent = document.querySelector('.docs-content');
    if (!mainContent) return;

    const targetBlocks = mainContent.querySelectorAll('p, li, .callout, pre, .quiz-card');
    targetBlocks.forEach((block) => {
      if (block.closest('.chiron-input-dialog-overlay') || block.closest('.chiron-floating-toolbar')) return;
      if (block.dataset.chironGutterInjected) return;
      block.dataset.chironGutterInjected = 'true';

      const computedPos = window.getComputedStyle(block).position;
      if (computedPos === 'static') {
        block.style.position = 'relative';
      }

      const gutterBtn = document.createElement('button');
      gutterBtn.className = 'chiron-gutter-btn';
      gutterBtn.title = 'Tandai baris/blok ini (Catatan / Tanya AI)';
      gutterBtn.innerHTML = '💬';
      gutterBtn.setAttribute('aria-label', 'Tandai blok teks ini');

      gutterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const text = block.innerText.trim();
        if (!text) return;

        pendingSelection = {
          exact: text.length > 300 ? text.slice(0, 300) + '...' : text,
          fullText: text,
          prefix: '',
          suffix: '',
          selector: getUniqueSelector(block),
          targetElement: block
        };

        const rect = gutterBtn.getBoundingClientRect();
        showToolbarAt(rect.right + 12, rect.top - 8);
      });

      block.appendChild(gutterBtn);
    });
  }

  /* ============================================================================
     6. DESKTOP TEXT SELECTION & FLOATING TOOLBAR
     ============================================================================ */

  function attachSelectionListener() {
    const mainContent = document.querySelector('.docs-content');
    if (!mainContent) return;

    document.addEventListener('mouseup', handleSelectionEvent);
    document.addEventListener('touchend', handleSelectionEvent);

    document.addEventListener('mousedown', (e) => {
      const tb = document.getElementById('chironFloatingToolbar');
      const dialog = document.getElementById('chironInputDialog');
      const detail = document.getElementById('chironDetailCard');

      if (tb && !tb.contains(e.target) && !e.target.classList.contains('chiron-gutter-btn')) {
        hideToolbar();
      }
      if (detail && !detail.contains(e.target) && !e.target.classList.contains('chiron-highlight')) {
        hideDetailCard();
      }
    });
  }

  function handleSelectionEvent(e) {
    if (e.target.closest('#chironInputDialog') || e.target.closest('#chironFloatingToolbar')) {
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      return;
    }

    const text = sel.toString().trim();
    if (!text || text.length < 2) {
      return;
    }

    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const contentArea = document.querySelector('.docs-content');

    if (!contentArea || (!contentArea.contains(container) && contentArea !== container)) {
      return;
    }

    const wholeDocText = contentArea.innerText || '';
    const exact = text;
    const idx = wholeDocText.indexOf(exact);
    const prefix = idx > 0 ? wholeDocText.substring(Math.max(0, idx - 40), idx) : '';
    const suffix = idx >= 0 ? wholeDocText.substring(idx + exact.length, idx + exact.length + 40) : '';

    pendingSelection = {
      exact: exact,
      prefix: prefix,
      suffix: suffix,
      selector: getUniqueSelector(container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement),
      range: range.cloneRange()
    };

    const rect = range.getBoundingClientRect();
    showToolbarAt(rect.left + rect.width / 2, rect.top - 10);
  }

  function showToolbarAt(clientX, clientY) {
    const tb = document.getElementById('chironFloatingToolbar');
    if (!tb) return;

    tb.style.display = 'flex';
    const tbWidth = tb.offsetWidth || 180;
    const tbHeight = tb.offsetHeight || 38;

    let left = clientX - tbWidth / 2;
    let top = clientY - tbHeight - 8 + window.scrollY;

    if (left < 10) left = 10;
    if (left + tbWidth > window.innerWidth - 10) left = window.innerWidth - tbWidth - 10;
    if (top < 10) top = clientY + 16 + window.scrollY;

    tb.style.left = `${left}px`;
    tb.style.top = `${top}px`;
    tb.classList.add('visible');
  }

  function hideToolbar() {
    const tb = document.getElementById('chironFloatingToolbar');
    if (tb) {
      tb.classList.remove('visible');
      tb.style.display = 'none';
    }
  }

  /* ============================================================================
     7. INPUT POPOVER & ANNOTATION CREATION
     ============================================================================ */

  let currentPendingType = 'note';

  function openInputDialog(type) {
    if (!pendingSelection) return;
    currentPendingType = type;
    hideToolbar();

    const dialog = document.getElementById('chironInputDialog');
    const pill = document.getElementById('chironDialogTypePill');
    const quote = document.getElementById('chironDialogQuote');
    const input = document.getElementById('chironDialogInput');
    const submitBtn = document.getElementById('chironDialogSubmitBtn');

    if (type === 'note') {
      pill.textContent = '📝 Catatan Pribadi (Permanen)';
      pill.className = 'chiron-type-pill pill-note';
      submitBtn.textContent = 'Simpan Catatan';
      input.placeholder = 'Tulis catatan, ringkasan, atau referensi Anda di sini...';
    } else {
      pill.textContent = '🤖 Pertanyaan untuk AI Agent (Antrean)';
      pill.className = 'chiron-type-pill pill-ai';
      submitBtn.textContent = 'Simpan Antrean AI';
      input.placeholder = 'Tulis pertanyaan atau saran perubahan yang ingin Anda tanyakan ke AI Agent...';
    }

    quote.textContent = `"${pendingSelection.exact}"`;
    input.value = '';
    dialog.style.display = 'flex';
    setTimeout(() => {
      dialog.classList.add('show');
      input.focus();
    }, 10);
  }

  function closeInputDialog() {
    const dialog = document.getElementById('chironInputDialog');
    if (dialog) {
      dialog.classList.remove('show');
      setTimeout(() => {
        dialog.style.display = 'none';
      }, 150);
    }
  }

  async function submitCurrentAnnotation() {
    const input = document.getElementById('chironDialogInput');
    const content = input.value.trim();
    if (!content) {
      input.focus();
      return;
    }

    const annoId = `anno-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newAnno = {
      id: annoId,
      type: currentPendingType,
      content: content,
      created_at: new Date().toISOString(),
      status: 'active',
      anchor: {
        exact: pendingSelection.exact,
        prefix: pendingSelection.prefix,
        suffix: pendingSelection.suffix,
        selector: pendingSelection.selector
      }
    };

    applyHighlightToRangeOrElement(newAnno, pendingSelection);
    activeAnnotations.push(newAnno);
    await saveAnnotations();

    closeInputDialog();
    window.getSelection()?.removeAllRanges();
    pendingSelection = null;

    showToast(newAnno.type === 'note' ? '📝 Catatan berhasil disimpan!' : '🤖 Pertanyaan ditambahkan ke antrean AI!');
  }

  /* ============================================================================
     8. DOM HIGHLIGHT RENDERING (<mark>)
     ============================================================================ */

  function applyHighlightToRangeOrElement(anno, selData) {
    try {
      if (selData.range) {
        const mark = document.createElement('mark');
        mark.className = `chiron-highlight chiron-highlight-${anno.type === 'note' ? 'note' : 'ai'}`;
        mark.dataset.chironId = anno.id;
        mark.title = `${anno.type === 'note' ? '📝 Catatan' : '🤖 Tanya AI'}: ${anno.content}`;

        try {
          selData.range.surroundContents(mark);
        } catch (e) {
          const fragment = selData.range.extractContents();
          mark.appendChild(fragment);
          selData.range.insertNode(mark);
        }
        attachHighlightListeners(mark);
      } else if (selData.targetElement) {
        const el = selData.targetElement;
        el.classList.add(`chiron-block-highlight`, `chiron-block-${anno.type === 'note' ? 'note' : 'ai'}`);
        el.dataset.chironId = anno.id;
        attachHighlightListeners(el);
      }
    } catch (err) {
      console.warn('[ChironAnnotations] Could not wrap DOM node:', err);
    }
  }

  function attachHighlightListeners(el) {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = el.dataset.chironId;
      showDetailCard(id, el);
    });

    el.addEventListener('mouseenter', (e) => {
      const id = el.dataset.chironId;
      showDetailCard(id, el);
    });
  }

  /* ============================================================================
     9. HIGHLIGHT CARD POPOVER (Hover / Tap)
     ============================================================================ */

  let currentDetailId = null;

  function showDetailCard(annoId, triggerEl) {
    const anno = activeAnnotations.find(a => a.id === annoId);
    if (!anno) return;

    currentDetailId = annoId;
    const card = document.getElementById('chironDetailCard');
    const typeBadge = document.getElementById('chironDetailType');
    const content = document.getElementById('chironDetailContent');
    const date = document.getElementById('chironDetailDate');

    if (anno.type === 'note') {
      typeBadge.textContent = '📝 Catatan Pribadi';
      typeBadge.className = 'detail-type-badge badge-note';
    } else {
      typeBadge.textContent = '🤖 Antrean Tanya AI';
      typeBadge.className = 'detail-type-badge badge-ai';
    }

    content.textContent = anno.content;
    const dt = new Date(anno.created_at);
    date.textContent = `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    card.style.display = 'block';
    const rect = triggerEl.getBoundingClientRect();
    const cardWidth = card.offsetWidth || 280;
    let left = rect.left + rect.width / 2 - cardWidth / 2;
    let top = rect.bottom + window.scrollY + 8;

    if (left < 10) left = 10;
    if (left + cardWidth > window.innerWidth - 10) left = window.innerWidth - cardWidth - 10;

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.classList.add('visible');
  }

  function hideDetailCard() {
    const card = document.getElementById('chironDetailCard');
    if (card) {
      card.classList.remove('visible');
      card.style.display = 'none';
    }
    currentDetailId = null;
  }

  async function deleteCurrentDetailAnnotation() {
    if (!currentDetailId) return;
    await deleteAnnotationById(currentDetailId);
    hideDetailCard();
  }

  async function deleteAnnotationById(annoId) {
    const idx = activeAnnotations.findIndex(a => a.id === annoId);
    if (idx !== -1) {
      const deleted = activeAnnotations.splice(idx, 1)[0];

      const highlights = document.querySelectorAll(`[data-chiron-id="${annoId}"]`);
      highlights.forEach(h => {
        if (h.tagName === 'MARK') {
          const parent = h.parentNode;
          while (h.firstChild) parent.insertBefore(h.firstChild, h);
          parent.removeChild(h);
        } else {
          h.classList.remove('chiron-block-highlight', 'chiron-block-note', 'chiron-block-ai');
          delete h.dataset.chironId;
        }
      });

      await saveAnnotations();
      renderRecapList();
      showToast(deleted.type === 'note' ? 'Catatan telah dihapus.' : 'Pertanyaan AI telah dihapus dari antrean.');
    }
  }

  /* ============================================================================
     10. ANNOTATION HYDRATION ON PAGE LOAD
     ============================================================================ */

  async function loadAndRenderExisting() {
    if (!window.ChironSync) {
      console.warn('[ChironAnnotations] ChironSync client library not loaded.');
      return;
    }

    activeAnnotations = await window.ChironSync.load(lessonPath);

    const contentArea = document.querySelector('.docs-content');
    if (!contentArea) return;

    activeAnnotations.forEach(anno => {
      rehydrateSingleAnnotation(anno, contentArea);
    });

    updateBadges();

    window.dispatchEvent(new CustomEvent('chiron:annotations-loaded', {
      detail: { annotations: activeAnnotations }
    }));
  /* ============================================================================
     10. W3C FUZZY TEXT-QUOTE ANCHORING & REHYDRATION ENGINE
     ============================================================================ */

  function normalizeText(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  function levenshteinDistance(s1, s2) {
    if (s1 === s2) return 0;
    if (!s1) return s2.length;
    if (!s2) return s1.length;

    const len1 = s1.length;
    const len2 = s2.length;
    const d = [];

    for (let i = 0; i <= len1; i++) d[i] = [i];
    for (let j = 0; j <= len2; j++) d[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1.charAt(i - 1) === s2.charAt(j - 1) ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      }
    }
    return d[len1][len2];
  }

  function stringSimilarity(s1, s2) {
    const norm1 = normalizeText(s1).toLowerCase();
    const norm2 = normalizeText(s2).toLowerCase();
    if (norm1 === norm2) return 1.0;
    const maxLen = Math.max(norm1.length, norm2.length);
    if (maxLen === 0) return 1.0;
    return 1.0 - (levenshteinDistance(norm1, norm2) / maxLen);
  }

  function rehydrateSingleAnnotation(anno, contentArea) {
    const exact = anno.anchor?.exact;
    const prefix = anno.anchor?.prefix || '';
    const suffix = anno.anchor?.suffix || '';
    if (!exact) {
      anno.isOrphaned = true;
      return;
    }

    // Step 1: Collect all text nodes
    const walker = document.createTreeWalker(contentArea, NodeFilter.SHOW_TEXT, null, false);
    const candidates = [];
    let node;

    while ((node = walker.nextNode())) {
      if (node.parentElement && (node.parentElement.tagName === 'MARK' || node.parentElement.tagName === 'SCRIPT')) {
        continue;
      }

      const text = node.textContent;
      let pos = text.indexOf(exact);
      while (pos !== -1) {
        candidates.push({ node, index: pos, textLen: exact.length, exactMatch: true });
        pos = text.indexOf(exact, pos + 1);
      }
    }

    // Tier 1 & 2: Exact occurrence matching
    if (candidates.length === 1) {
      wrapTextRange(candidates[0].node, candidates[0].index, candidates[0].textLen, anno);
      anno.isOrphaned = false;
      return;
    }

    if (candidates.length > 1) {
      // Disambiguate using surrounding prefix and suffix
      let bestScore = -1;
      let bestCandidate = candidates[0];

      candidates.forEach(cand => {
        const wholeText = cand.node.textContent;
        const actualPrefix = wholeText.substring(Math.max(0, cand.index - prefix.length), cand.index);
        const actualSuffix = wholeText.substring(cand.index + cand.textLen, cand.index + cand.textLen + suffix.length);

        const prefScore = prefix ? stringSimilarity(actualPrefix, prefix) : 0.5;
        const suffScore = suffix ? stringSimilarity(actualSuffix, suffix) : 0.5;
        let score = (prefScore + suffScore) / 2;

        if (anno.anchor?.selector && cand.node.parentElement.closest(anno.anchor.selector)) {
          score += 0.3; // Boost if within original CSS selector
        }

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = cand;
        }
      });

      wrapTextRange(bestCandidate.node, bestCandidate.index, bestCandidate.textLen, anno);
      anno.isOrphaned = false;
      return;
    }

    // Tier 3: Fuzzy search across text nodes (Minor typo/refactoring drift)
    const fuzzyWalker = document.createTreeWalker(contentArea, NodeFilter.SHOW_TEXT, null, false);
    let bestFuzzyNode = null;
    let bestFuzzyIndex = -1;
    let bestFuzzyScore = 0;
    const windowSize = exact.length;

    while ((node = fuzzyWalker.nextNode())) {
      if (node.parentElement && (node.parentElement.tagName === 'MARK' || node.parentElement.tagName === 'SCRIPT')) {
        continue;
      }
      const text = node.textContent;
      if (text.length < windowSize / 2) continue;

      for (let i = 0; i <= text.length - windowSize; i += 2) {
        const candidate = text.substring(i, i + windowSize);
        const sim = stringSimilarity(candidate, exact);
        if (sim > bestFuzzyScore) {
          bestFuzzyScore = sim;
          bestFuzzyNode = node;
          bestFuzzyIndex = i;
        }
      }
    }

    if (bestFuzzyScore >= 0.75 && bestFuzzyNode) {
      wrapTextRange(bestFuzzyNode, bestFuzzyIndex, windowSize, anno);
      anno.isOrphaned = false;
      return;
    }

    // Tier 4: Teks benar-benar terhapus / berpindah jauh -> Tandai Orphaned tanpa menghapus data
    anno.isOrphaned = true;
  }

  function wrapTextRange(node, start, length, anno) {
    try {
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + length);

      const mark = document.createElement('mark');
      mark.className = `chiron-highlight chiron-highlight-${anno.type === 'note' ? 'note' : 'ai'}`;
      mark.dataset.chironId = anno.id;
      mark.title = `${anno.type === 'note' ? '📝 Catatan' : '🤖 Tanya AI'}: ${anno.content}`;

      range.surroundContents(mark);
      attachHighlightListeners(mark);
    } catch (e) {
      console.warn('[ChironAnnotations] Node wrapping split failure:', e);
    }
  }

  async function saveAnnotations() {
    if (window.ChironSync) {
      await window.ChironSync.save(lessonPath, activeAnnotations);
    }
    updateBadges();
    window.dispatchEvent(new CustomEvent('chiron:annotations-changed', {
      detail: { annotations: activeAnnotations }
    }));
  }

  /* ============================================================================
     11. UTILITIES
     ============================================================================ */

  function getUniqueSelector(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
    if (el.id) return `#${el.id}`;

    let path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE && el.tagName !== 'BODY') {
      let selector = el.tagName.toLowerCase();
      if (el.className && typeof el.className === 'string') {
        const firstClass = el.className.trim().split(/\s+/)[0];
        if (firstClass && !firstClass.startsWith('chiron-')) {
          selector += `.${firstClass}`;
        }
      }
      path.unshift(selector);
      el = el.parentElement;
    }
    return path.join(' > ');
  }

  function showToast(message) {
    const toast = document.getElementById('chironToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ============================================================================
     12. LIFECYCLE BOOTSTRAP & WINDOW FOCUS LIVE RELOAD
     ============================================================================ */

  document.addEventListener('DOMContentLoaded', () => {
    initUI();
    injectGutterTriggers();
    attachSelectionListener();
    loadAndRenderExisting();
  });

  // Window Focus: Saat pengguna beralih dari IDE ke browser, reload highlight secara hening
  window.addEventListener('focus', () => {
    loadAndRenderExisting();
  });

  // Export public API
  window.ChironAnnotations = {
    getAll: () => activeAnnotations,
    getNotes: () => activeAnnotations.filter(a => a.type === 'note'),
    getAiQuestions: () => activeAnnotations.filter(a => a.type === 'ai_question'),
    setFilter: applyVisibilityFilter,
    openRecap: openRecapDrawer,
    closeRecap: closeRecapDrawer,
    jumpTo: jumpToAnnotation,
    deleteById: deleteAnnotationById,
    reload: loadAndRenderExisting
  };

})(window, document);
