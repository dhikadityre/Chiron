/**
 * Chiron Multi-IDE Launcher & GitLab URL Parser
 * ==============================================================================
 * Provides client-side parsing of GitLab code links, repository path mapping,
 * hybrid execution (daemon /api/open with browser URI scheme fallback),
 * and an interactive visual toast feedback system.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CommonJS / Node.js test environment
    module.exports = factory();
  } else {
    // Browser global
    root.ChironIdeLauncher = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // Cached configuration
  let cachedConfig = null;
  const DAEMON_BASE_URL = 'http://localhost:8765';

  /**
   * Parse a GitLab URL into project, branch, relative file path, and line numbers.
   * Example URL:
   * http://gitlab.samir.co.id/samir_it/samir-mobile/-/blob/learn/iOS-Arch/ios/.../IDSamirMainModule.swift#L54-L75
   */
  function parseGitLabUrl(rawUrl, config = null) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return null;
    }

    // 1. Extract hash line numbers: #L54 or #L54-L75
    let startLine = null;
    let endLine = null;
    const hashIndex = rawUrl.indexOf('#');
    let urlWithoutHash = rawUrl;

    if (hashIndex !== -1) {
      const hash = rawUrl.substring(hashIndex);
      urlWithoutHash = rawUrl.substring(0, hashIndex);
      const lineMatch = hash.match(/#L(\d+)(?:-L(\d+))?/i);
      if (lineMatch) {
        startLine = parseInt(lineMatch[1], 10);
        if (lineMatch[2]) {
          endLine = parseInt(lineMatch[2], 10);
        }
      }
    }

    // 2. Identify GitLab blob separator: "/-/blob/" or "/blob/"
    const blobRegex = /(?:-\/)?blob\//i;
    const blobMatch = urlWithoutHash.match(blobRegex);
    if (!blobMatch) {
      return null;
    }

    const blobIndex = blobMatch.index;
    const beforeBlob = urlWithoutHash.substring(0, blobIndex);
    const afterBlob = urlWithoutHash.substring(blobIndex + blobMatch[0].length);

    // 3. Extract GitLab project namespace (e.g. "samir_it/samir-mobile")
    let project = beforeBlob;
    // Remove protocol and domain if present
    const domainMatch = project.match(/^https?:\/\/[^\/]+\/(.+)$/i);
    if (domainMatch) {
      project = domainMatch[1];
    }
    project = project.replace(/^\/+|\/+$/g, '');

    // 4. Resolve branch and filePath from afterBlob
    let branch = '';
    let filePath = '';

    // Collect known branches from config if available
    const knownBranches = [];
    if (config && config.repositories) {
      for (const repo of Object.values(config.repositories)) {
        if (repo.default_branch && !knownBranches.includes(repo.default_branch)) {
          knownBranches.push(repo.default_branch);
        }
        if (repo.branch_mappings) {
          for (const b of Object.keys(repo.branch_mappings)) {
            if (!knownBranches.includes(b)) {
              knownBranches.push(b);
            }
          }
        }
      }
    }

    // Sort known branches by length descending so longer matching branch names take precedence
    knownBranches.sort((a, b) => b.length - a.length);

    let matchedBranch = null;
    for (const kb of knownBranches) {
      if (afterBlob === kb || afterBlob.startsWith(kb + '/')) {
        matchedBranch = kb;
        break;
      }
    }

    if (matchedBranch) {
      branch = matchedBranch;
      filePath = afterBlob.substring(matchedBranch.length).replace(/^\/+/, '');
    } else {
      // Fallback heuristics: if afterBlob starts with "learn/...", consider 2 segments as branch
      const parts = afterBlob.split('/');
      if (parts.length >= 2 && (parts[0] === 'learn' || parts[0] === 'feature' || parts[0] === 'bugfix')) {
        branch = parts[0] + '/' + parts[1];
        filePath = parts.slice(2).join('/');
      } else if (parts.length >= 1) {
        branch = parts[0];
        filePath = parts.slice(1).join('/');
      }
    }

    return {
      project,
      branch,
      filePath,
      startLine,
      endLine,
      rawUrl
    };
  }

  /**
   * Resolves the local absolute file path using configuration repository mappings.
   */
  function resolveLocalPath(parsedInfo, config) {
    if (!parsedInfo || !config || !config.repositories) {
      return null;
    }

    const repos = config.repositories;
    let targetRepo = null;

    const cleanProject = (parsedInfo.project || '').toLowerCase().trim();
    for (const [key, repo] of Object.entries(repos)) {
      if ((repo.gitlab_project && repo.gitlab_project.toLowerCase().trim() === cleanProject) ||
          key.toLowerCase().trim() === cleanProject) {
        targetRepo = repo;
        break;
      }
    }

    if (!targetRepo) {
      return null;
    }

    let repoLocalPath = targetRepo.local_path || '';
    if (parsedInfo.branch && targetRepo.branch_mappings && targetRepo.branch_mappings[parsedInfo.branch]) {
      repoLocalPath = targetRepo.branch_mappings[parsedInfo.branch];
    }

    if (!repoLocalPath) {
      return null;
    }

    const cleanBase = repoLocalPath.replace(/\/+$/, '');
    const cleanRel = (parsedInfo.filePath || '').replace(/^\/+/, '');
    return `${cleanBase}/${cleanRel}`;
  }

  /**
   * Constructs browser deep-link URI scheme for supported desktop IDEs.
   */
  function buildIdeUri(ide, localFilePath, line = 1) {
    if (!localFilePath) return null;
    const cleanLine = Math.max(1, parseInt(line, 10) || 1);
    const cleanIde = (ide || '').toLowerCase().trim();

    switch (cleanIde) {
      case 'antigravity':
        return `antigravity-ide://file/${localFilePath}:${cleanLine}`;
      case 'cursor':
        return `cursor://file/${localFilePath}:${cleanLine}`;
      case 'vscode':
        return `vscode://file/${localFilePath}:${cleanLine}`;
      default:
        return null;
    }
  }

  /**
   * Displays an interactive toast notification in the bottom right corner of the page.
   */
  function showToast(message, type = 'info', duration = 3500) {
    if (typeof document === 'undefined') {
      return; // Node.js environment
    }

    let container = document.getElementById('chiron-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'chiron-toast-container';
      container.className = 'chiron-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `chiron-toast chiron-toast-${type}`;

    const icons = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠',
      error: '✕'
    };

    const iconSpan = document.createElement('span');
    iconSpan.className = 'chiron-toast-icon';
    iconSpan.textContent = icons[type] || 'ℹ';

    const msgSpan = document.createElement('span');
    msgSpan.className = 'chiron-toast-message';
    msgSpan.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'chiron-toast-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => removeToast(toast);

    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('chiron-toast-show');
    });

    // Auto dismiss
    const timer = setTimeout(() => {
      removeToast(toast);
    }, duration);

    function removeToast(el) {
      clearTimeout(timer);
      el.classList.remove('chiron-toast-show');
      el.classList.add('chiron-toast-hide');
      setTimeout(() => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 300);
    }
  }

  /**
   * Fetches configuration from local daemon or static root fallback.
   */
  async function fetchConfig() {
    if (cachedConfig) {
      return cachedConfig;
    }

    // Try local daemon endpoint first
    try {
      const res = await fetch(`${DAEMON_BASE_URL}/api/config`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.config) {
          cachedConfig = data.config;
          return cachedConfig;
        }
      }
    } catch (e) {
      // Daemon not reachable, proceed to static fallback
    }

    // Fallback: fetch /chiron_config.json relative to host
    try {
      const res = await fetch('/chiron_config.json', { cache: 'no-store' });
      if (res.ok) {
        cachedConfig = await res.json();
        return cachedConfig;
      }
    } catch (e) {
      console.warn('[ChironLauncher] Could not fetch chiron_config.json:', e);
    }

    // Default built-in fallback
    cachedConfig = {
      version: '1.0',
      repositories: {
        'samir-mobile': {
          gitlab_project: 'samir_it/samir-mobile',
          local_path: '/Users/samir/Documents/Workspace/SAMIR/Mobile/Nexus/samir-mobile-nexus',
          default_branch: 'learn/iOS-Arch',
          branch_mappings: {
            'learn/iOS-Arch': '/Users/samir/Documents/Workspace/SAMIR/Mobile/Nexus/samir-mobile-nexus',
            'develop': '/Users/samir/Documents/Workspace/SAMIR/Mobile/Develop/samir-mobile-develop'
          }
        }
      }
    };
    return cachedConfig;
  }

  /**
   * Main entry point to open a file in a given IDE.
   */
  async function openInIde(ide, gitlabUrlOrParams, options = {}) {
    const ideNames = {
      gitlab: 'GitLab',
      antigravity: 'Antigravity IDE',
      cursor: 'Cursor IDE',
      vscode: 'VS Code',
      xcode: 'Xcode'
    };

    const cleanIde = (ide || '').toLowerCase().trim();
    const displayName = ideNames[cleanIde] || cleanIde;

    // 1. Handle GitLab directly
    if (cleanIde === 'gitlab') {
      const targetUrl = typeof gitlabUrlOrParams === 'string' ? gitlabUrlOrParams : gitlabUrlOrParams.rawUrl;
      if (targetUrl && typeof window !== 'undefined') {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // 2. Parse target parameters
    const config = await fetchConfig();
    let parsed = null;

    if (typeof gitlabUrlOrParams === 'string') {
      parsed = parseGitLabUrl(gitlabUrlOrParams, config);
    } else if (gitlabUrlOrParams && typeof gitlabUrlOrParams === 'object') {
      parsed = gitlabUrlOrParams;
    }

    if (!parsed) {
      showToast('Gagal membaca informasi file dari link.', 'error');
      return;
    }

    const line = options.line || parsed.startLine || 1;
    const localFilePath = resolveLocalPath(parsed, config);

    // 3. Attempt to launch via Daemon REST API (/api/open)
    let daemonSuccess = false;
    try {
      const payload = {
        ide: cleanIde,
        project: parsed.project,
        branch: parsed.branch,
        file: parsed.filePath,
        file_path: localFilePath || undefined,
        line: line,
        dry_run: false
      };

      const res = await fetch(`${DAEMON_BASE_URL}/api/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        daemonSuccess = true;
        const data = await res.json();
        showToast(`Membuka di ${displayName} (baris ${line})...`, 'success');
        return;
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 404) {
          showToast(`File tidak ditemukan di disk lokal: ${parsed.filePath}`, 'error');
          return;
        } else if (res.status === 403) {
          showToast(`Akses file di luar workspace ditolak.`, 'error');
          return;
        }
      }
    } catch (err) {
      // Network error / Daemon offline
      daemonSuccess = false;
    }

    // 4. Fallback execution when daemon is offline
    if (!daemonSuccess) {
      if (cleanIde === 'xcode') {
        showToast('Xcode memerlukan daemon lokal aktif untuk melompat ke baris. Jalankan: python3 .assets/chiron_sync.py', 'warning', 5000);
        return;
      }

      if (localFilePath) {
        const uri = buildIdeUri(cleanIde, localFilePath, line);
        if (uri && typeof window !== 'undefined') {
          showToast(`Membuka via ${displayName} URI Scheme...`, 'info');
          window.location.href = uri;
          return;
        }
      }

      showToast(`Daemon sync offline dan path lokal belum terpetakan. Jalankan: python3 .assets/chiron_sync.py`, 'warning');
    }
  }

  // Supported IDEs registry & metadata
  const SUPPORTED_IDES = [
    { id: 'gitlab', label: 'GitLab', icon: '🦊', title: 'Buka di GitLab Web Browser', desc: 'Web viewer & cloud diff' },
    { id: 'antigravity', label: 'Antigravity IDE', icon: '🪐', title: 'Buka di Google Antigravity IDE (Lokal)', desc: 'IDE utama dengan Google Agent' },
    { id: 'cursor', label: 'Cursor', icon: '⚡', title: 'Buka di Cursor IDE (Lokal)', desc: 'AI code editor lokal' },
    { id: 'vscode', label: 'VS Code', icon: '💻', title: 'Buka di VS Code (Lokal)', desc: 'Visual Studio Code lokal' },
    { id: 'xcode', label: 'Xcode', icon: '🛠️', title: 'Buka di Apple Xcode (Lokal)', desc: 'Apple Xcode IDE via xed' }
  ];

  // User Preferences Management
  const PREFS_STORAGE_KEY = 'chiron_ide_preferences';
  const DEFAULT_PREFERENCES = {
    displayMode: 'popover', // 'popover' (responsive default) | 'fullbar' (cara lama)
    enabledIdes: ['gitlab', 'antigravity', 'cursor', 'vscode', 'xcode']
  };

  let inMemoryPreferences = null;

  function getPreferences() {
    if (inMemoryPreferences) {
      return Object.assign({}, inMemoryPreferences);
    }
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(PREFS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          inMemoryPreferences = {
            displayMode: parsed.displayMode === 'fullbar' ? 'fullbar' : 'popover',
            enabledIdes: Array.isArray(parsed.enabledIdes) && parsed.enabledIdes.length > 0
              ? parsed.enabledIdes
              : DEFAULT_PREFERENCES.enabledIdes.slice()
          };
          return Object.assign({}, inMemoryPreferences);
        }
      } catch (e) {
        // Fallback to default
      }
    }
    inMemoryPreferences = Object.assign({}, DEFAULT_PREFERENCES);
    return Object.assign({}, inMemoryPreferences);
  }

  function savePreferences(newPrefs) {
    const current = getPreferences();
    const updated = Object.assign({}, current, newPrefs);
    inMemoryPreferences = updated;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('[ChironLauncher] Error saving preferences:', e);
      }
    }

    // Notify document and re-render action bars
    refreshAllCodeNavBars();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chiron:ide-prefs-changed', { detail: updated }));
    }
    return updated;
  }

  /**
   * Detects whether an element sits inline within a running paragraph or list item,
   * versus being a standalone block link.
   */
  function isInlineContext(link) {
    const parent = link.parentNode;
    if (!parent) return false;
    const parentTag = (parent.tagName || '').toLowerCase();
    if (['p', 'li', 'td', 'th', 'blockquote', 'span', 'em', 'strong'].includes(parentTag)) {
      const fullText = (parent.textContent || '').trim();
      const linkText = (link.textContent || '').trim();
      const nonLinkText = fullText.replace(linkText, '').replace(/[\s\n\r\t]+/g, ' ').trim();
      // If there is significant text besides "Path:" or whitespace, treat as inline sentence
      if (nonLinkText && !/^path\s*:\s*$/i.test(nonLinkText)) {
        return true;
      }
    }
    return false;
  }

  // Active popover references & debounce timers
  let activeTrigger = null;
  let popoverHideTimer = null;
  let popoverShowTimer = null;
  const registryNodes = [];

  /**
   * Returns or creates the singleton Popover Dialog element in the document.
   */
  function getOrCreatePopoverDialog() {
    if (typeof document === 'undefined') return null;

    let popover = document.getElementById('chiron-ide-popover-dialog');
    let backdrop = document.getElementById('chiron-popover-backdrop');

    if (!backdrop && document.body) {
      backdrop = document.createElement('div');
      backdrop.id = 'chiron-popover-backdrop';
      backdrop.className = 'chiron-popover-backdrop';
      backdrop.addEventListener('click', () => hidePopover(true));
      document.body.appendChild(backdrop);
    }

    if (!popover && document.body) {
      popover = document.createElement('div');
      popover.id = 'chiron-ide-popover-dialog';
      popover.className = 'chiron-popover-dialog';
      popover.setAttribute('role', 'dialog');
      popover.setAttribute('aria-label', 'Pilih IDE untuk navigasi');

      popover.addEventListener('mouseenter', () => {
        if (popoverHideTimer) {
          clearTimeout(popoverHideTimer);
          popoverHideTimer = null;
        }
      });

      popover.addEventListener('mouseleave', () => {
        scheduleHidePopover(250);
      });

      document.body.appendChild(popover);

      // Dismiss on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          hidePopover(true);
        }
      });

      // Dismiss on outside click
      document.addEventListener('click', (e) => {
        if (popover && popover.classList.contains('show')) {
          if (!popover.contains(e.target) && (!activeTrigger || !activeTrigger.contains(e.target))) {
            hidePopover(true);
          }
        }
      });
    }

    return popover;
  }

  function scheduleShowPopover(triggerEl, parsed, delayMs = 120) {
    if (popoverHideTimer) {
      clearTimeout(popoverHideTimer);
      popoverHideTimer = null;
    }
    if (popoverShowTimer) {
      clearTimeout(popoverShowTimer);
    }
    popoverShowTimer = setTimeout(() => {
      showPopover(triggerEl, parsed);
    }, delayMs);
  }

  function scheduleHidePopover(delayMs = 200) {
    if (popoverShowTimer) {
      clearTimeout(popoverShowTimer);
      popoverShowTimer = null;
    }
    if (popoverHideTimer) {
      clearTimeout(popoverHideTimer);
    }
    popoverHideTimer = setTimeout(() => {
      hidePopover();
    }, delayMs);
  }

  function hidePopover(immediate = false) {
    if (popoverShowTimer) {
      clearTimeout(popoverShowTimer);
      popoverShowTimer = null;
    }
    if (popoverHideTimer) {
      clearTimeout(popoverHideTimer);
      popoverHideTimer = null;
    }
    const popover = typeof document !== 'undefined' ? document.getElementById('chiron-ide-popover-dialog') : null;
    const backdrop = typeof document !== 'undefined' ? document.getElementById('chiron-popover-backdrop') : null;

    if (popover) {
      popover.classList.remove('show');
    }
    if (backdrop) {
      backdrop.classList.remove('show');
    }
    if (activeTrigger) {
      activeTrigger.classList.remove('active');
      activeTrigger = null;
    }
  }

  /**
   * Displays the Smart Popover anchored to the trigger element.
   */
  function showPopover(triggerEl, parsed, options = {}) {
    const popover = getOrCreatePopoverDialog();
    if (!popover) return;

    if (popoverHideTimer) {
      clearTimeout(popoverHideTimer);
      popoverHideTimer = null;
    }

    if (activeTrigger && activeTrigger !== triggerEl) {
      activeTrigger.classList.remove('active');
    }
    activeTrigger = triggerEl;
    activeTrigger.classList.add('active');

    const prefs = getPreferences();
    const cleanFileName = (parsed.filePath || '').split('/').pop() || 'Code';
    const lineLabel = parsed.startLine ? (parsed.endLine ? `L${parsed.startLine}-${parsed.endLine}` : `L${parsed.startLine}`) : '';

    // Build popover internal DOM
    popover.innerHTML = '';

    // 1. Header
    const header = document.createElement('div');
    header.className = 'chiron-popover-header';

    const fileMeta = document.createElement('div');
    fileMeta.className = 'chiron-popover-file';
    fileMeta.innerHTML = `<span class="nav-icon">📂</span><strong>${cleanFileName}</strong>${lineLabel ? ` <span class="chiron-nav-line">${lineLabel}</span>` : ''}`;

    const tools = document.createElement('div');
    tools.className = 'chiron-popover-tools';

    const settingsBtn = document.createElement('button');
    settingsBtn.type = 'button';
    settingsBtn.className = 'chiron-popover-tool-btn';
    settingsBtn.title = 'Pengaturan IDE & Mode Tampilan';
    settingsBtn.innerHTML = '⚙️';

    tools.appendChild(settingsBtn);
    header.appendChild(fileMeta);
    header.appendChild(tools);
    popover.appendChild(header);

    // 2. Subtitle / branch info
    if (parsed.branch) {
      const sub = document.createElement('div');
      sub.className = 'chiron-popover-sub';
      sub.innerHTML = `<span class="branch-pill">🌿 ${parsed.branch}</span><span class="path-pill">${parsed.filePath}</span>`;
      popover.appendChild(sub);
    }

    // 3. Quick Settings Panel (Toggleable)
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'chiron-popover-settings';
    settingsPanel.innerHTML = `
      <div class="chiron-settings-title">
        <span>Pengaturan Navigasi</span>
        <span style="font-size: 0.8em; color: #94a3b8;">Preferensi Lokal</span>
      </div>
      <div class="chiron-settings-group">
        <label class="chiron-settings-label">Mode Tampilan:</label>
        <div class="chiron-settings-modes">
          <button type="button" class="chiron-mode-btn ${prefs.displayMode === 'popover' ? 'active' : ''}" data-mode="popover">⚡ Smart Popover</button>
          <button type="button" class="chiron-mode-btn ${prefs.displayMode === 'fullbar' ? 'active' : ''}" data-mode="fullbar">🖥️ Full Bar</button>
        </div>
      </div>
      <div class="chiron-settings-group">
        <label class="chiron-settings-label">Pilihan IDE Aktif:</label>
        <div class="chiron-checkbox-list">
          ${SUPPORTED_IDES.map(item => `
            <label class="chiron-checkbox-item">
              <input type="checkbox" data-ide="${item.id}" ${prefs.enabledIdes.includes(item.id) ? 'checked' : ''} />
              <span>${item.icon} ${item.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsPanel.classList.toggle('open');
    });

    // Wire settings panel interactions
    const modeBtns = settingsPanel.querySelectorAll('.chiron-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = btn.getAttribute('data-mode');
        savePreferences({ displayMode: mode });
        modeBtns.forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    const checkboxes = settingsPanel.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        const activeIds = Array.from(checkboxes).filter(c => c.checked).map(c => c.getAttribute('data-ide'));
        if (activeIds.length === 0) {
          // Keep at least 1 enabled
          cb.checked = true;
          showToast('Minimal satu IDE harus tetap aktif.', 'warning');
          return;
        }
        savePreferences({ enabledIdes: activeIds });
      });
    });

    popover.appendChild(settingsPanel);

    // 4. Action buttons list (Filtered by user preferences)
    const list = document.createElement('div');
    list.className = 'chiron-popover-list';

    const enabledList = SUPPORTED_IDES.filter(item => prefs.enabledIdes.includes(item.id));
    if (enabledList.length === 0) {
      enabledList.push(SUPPORTED_IDES[0]); // Fallback GitLab
    }

    enabledList.forEach(item => {
      const row = document.createElement('a');
      row.href = '#';
      row.className = `chiron-popover-item cab-${item.id}`;
      row.setAttribute('role', 'button');
      row.innerHTML = `
        <div class="chiron-popover-item-left">
          <span class="chiron-popover-item-icon">${item.icon}</span>
          <div>
            <div class="chiron-popover-item-title">${item.label}</div>
            <div class="chiron-popover-item-desc">${item.desc}</div>
          </div>
        </div>
        <span class="chiron-popover-item-arrow">↗</span>
      `;
      row.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hidePopover(true);
        openInIde(item.id, parsed, { line: parsed.startLine });
      });
      list.appendChild(row);
    });

    popover.appendChild(list);

    // 5. Positioning logic
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 520;
    const backdrop = document.getElementById('chiron-popover-backdrop');

    if (isMobile) {
      popover.style.left = '';
      popover.style.top = '';
      if (backdrop) backdrop.classList.add('show');
    } else if (typeof triggerEl.getBoundingClientRect === 'function') {
      const rect = triggerEl.getBoundingClientRect();
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const popoverWidth = 330;
      const popoverEstimatedHeight = 240;

      // Horizontal alignment: align with trigger left, clamp within window
      let targetLeft = rect.left + scrollX;
      if (targetLeft + popoverWidth > window.innerWidth - 16) {
        targetLeft = Math.max(16, window.innerWidth - popoverWidth - 16);
      }

      // Vertical alignment: prefer below trigger, flip to top if close to bottom
      let targetTop = rect.bottom + scrollY + 8;
      if (rect.bottom + popoverEstimatedHeight > window.innerHeight && rect.top > popoverEstimatedHeight) {
        targetTop = rect.top + scrollY - popoverEstimatedHeight - 8;
      }

      popover.style.left = `${Math.round(targetLeft)}px`;
      popover.style.top = `${Math.round(targetTop)}px`;
    }

    popover.classList.add('show');
  }

  /**
   * Re-renders all registered code navigation elements on preference changes.
   */
  function refreshAllCodeNavBars() {
    registryNodes.forEach(reg => {
      if (reg.container && reg.container.parentNode) {
        renderNavigationElement(reg.container, reg.parsed, reg.titleText, reg.isInline);
      }
    });
  }

  /**
   * Renders either the inline Pill Badge, Compact Bar, or Full Action Bar into a container node.
   */
  function renderNavigationElement(container, parsed, titleText, isInline) {
    const prefs = getPreferences();
    container.innerHTML = '';

    const cleanFileName = (parsed.filePath || '').split('/').pop() || 'Code';
    const lineLabel = parsed.startLine ? (parsed.endLine ? `L${parsed.startLine}-${parsed.endLine}` : `L${parsed.startLine}`) : '';

    if (prefs.displayMode === 'popover') {
      if (isInline) {
        // Mode A: Inline Capsule Pill ([📂 filename :Lxx ▾])
        container.className = 'chiron-nav-pill chiron-nav-code';
        container.title = `Navigasi Kode: ${parsed.filePath}${lineLabel ? ` (${lineLabel})` : ''} - Tap/Hover untuk pilihan IDE`;
        container.innerHTML = `<span class="nav-icon">📂</span><span class="nav-title">${cleanFileName}</span>${lineLabel ? `<span class="nav-line">${lineLabel}</span>` : ''}<span class="nav-caret">▾</span>`;

        container.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          showPopover(container, parsed);
        };
        container.onmouseenter = () => scheduleShowPopover(container, parsed, 120);
        container.onmouseleave = () => scheduleHidePopover(220);
      } else {
        // Mode B: Standalone Compact Action Bar with [🚀 Buka di IDE ▾]
        container.className = 'chiron-code-action-bar chiron-cab-compact';

        const meta = document.createElement('div');
        meta.className = 'chiron-cab-meta';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'chiron-cab-title chiron-nav-code';
        titleSpan.innerHTML = `<span class="nav-icon">📂</span><strong>${cleanFileName}</strong>${titleText ? ` <span class="chiron-cab-sub">${titleText}</span>` : ''}`;
        meta.appendChild(titleSpan);

        if (parsed.branch) {
          const branchBadge = document.createElement('span');
          branchBadge.className = 'chiron-cab-branch';
          branchBadge.textContent = parsed.branch;
          meta.appendChild(branchBadge);
        }

        if (parsed.startLine) {
          const lineBadge = document.createElement('span');
          lineBadge.className = 'chiron-cab-line';
          lineBadge.textContent = lineLabel;
          meta.appendChild(lineBadge);
        }

        const actions = document.createElement('div');
        actions.className = 'chiron-cab-actions';

        const triggerBtn = document.createElement('button');
        triggerBtn.type = 'button';
        triggerBtn.className = 'chiron-cab-btn chiron-cab-trigger';
        triggerBtn.title = 'Pilih IDE untuk navigasi';
        triggerBtn.innerHTML = `<span class="cab-icon">🚀</span><span class="cab-label">Buka di IDE</span> <span class="nav-caret">▾</span>`;

        triggerBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          showPopover(triggerBtn, parsed);
        };
        triggerBtn.onmouseenter = () => scheduleShowPopover(triggerBtn, parsed, 120);
        triggerBtn.onmouseleave = () => scheduleHidePopover(220);

        const settingsBtn = document.createElement('button');
        settingsBtn.type = 'button';
        settingsBtn.className = 'chiron-cab-btn chiron-cab-settings-btn';
        settingsBtn.title = 'Pengaturan IDE';
        settingsBtn.innerHTML = `<span class="cab-icon">⚙️</span>`;
        settingsBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          showPopover(settingsBtn, parsed);
          // Auto open settings tab inside popover
          setTimeout(() => {
            const p = document.getElementById('chiron-ide-popover-dialog');
            if (p) {
              const sp = p.querySelector('.chiron-popover-settings');
              if (sp) sp.classList.add('open');
            }
          }, 50);
        };

        actions.appendChild(triggerBtn);
        actions.appendChild(settingsBtn);

        container.appendChild(meta);
        container.appendChild(actions);
      }
    } else {
      // Mode C: Full Action Bar (Cara lama, dengan filter pilihan IDE pengguna)
      container.className = 'chiron-code-action-bar chiron-cab-full';

      const meta = document.createElement('div');
      meta.className = 'chiron-cab-meta';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'chiron-cab-title chiron-nav-code';
      titleSpan.innerHTML = `<span class="nav-icon">📂</span><strong>${cleanFileName}</strong>${titleText ? ` <span class="chiron-cab-sub">${titleText}</span>` : ''}`;
      meta.appendChild(titleSpan);

      if (parsed.branch) {
        const branchBadge = document.createElement('span');
        branchBadge.className = 'chiron-cab-branch';
        branchBadge.textContent = parsed.branch;
        meta.appendChild(branchBadge);
      }

      if (parsed.startLine) {
        const lineBadge = document.createElement('span');
        lineBadge.className = 'chiron-cab-line';
        lineBadge.textContent = lineLabel;
        meta.appendChild(lineBadge);
      }

      const actions = document.createElement('div');
      actions.className = 'chiron-cab-actions';

      const enabledList = SUPPORTED_IDES.filter(item => prefs.enabledIdes.includes(item.id));
      if (enabledList.length === 0) {
        enabledList.push(SUPPORTED_IDES[0]);
      }

      enabledList.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `chiron-cab-btn cab-${item.id}`;
        btn.title = item.title;
        btn.setAttribute('aria-label', item.title);
        btn.innerHTML = `<span class="cab-icon">${item.icon}</span><span class="cab-label">${item.label}</span>`;
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          openInIde(item.id, parsed, { line: parsed.startLine });
        };
        actions.appendChild(btn);
      });

      // Quick settings button on full bar
      const settingsBtn = document.createElement('button');
      settingsBtn.type = 'button';
      settingsBtn.className = 'chiron-cab-btn chiron-cab-settings-btn';
      settingsBtn.title = 'Pengaturan IDE & Mode Tampilan';
      settingsBtn.innerHTML = `<span class="cab-icon">⚙️</span>`;
      settingsBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        showPopover(settingsBtn, parsed);
        setTimeout(() => {
          const p = document.getElementById('chiron-ide-popover-dialog');
          if (p) {
            const sp = p.querySelector('.chiron-popover-settings');
            if (sp) sp.classList.add('open');
          }
        }, 50);
      };
      actions.appendChild(settingsBtn);

      container.appendChild(meta);
      container.appendChild(actions);
    }
  }

  /**
   * Scans document for 'a.gitlab-code-link' elements and transforms them into
   * responsive navigation elements according to user preferences.
   */
  async function initCodeActionBars(containerElement = null, options = {}) {
    if (typeof document === 'undefined') {
      return;
    }

    if (options.forceMode) {
      savePreferences({ displayMode: options.forceMode });
    }

    const root = containerElement || document;
    const links = root.querySelectorAll('a.gitlab-code-link:not(.chiron-enhanced)');
    if (!links.length) {
      return;
    }

    const config = await fetchConfig();

    links.forEach((link) => {
      link.classList.add('chiron-enhanced');
      const rawUrl = link.getAttribute('href');
      const parsed = parseGitLabUrl(rawUrl, config);
      if (!parsed) {
        return;
      }

      // Clean title text from original link
      let titleText = link.textContent || '';
      titleText = titleText.replace(/[🦊↗\n\r]/g, '').trim();
      if (parsed.branch && titleText.includes(parsed.branch)) {
        titleText = titleText.replace(parsed.branch, '').trim();
      }

      const inline = isInlineContext(link);
      const container = document.createElement(inline ? 'span' : 'div');

      renderNavigationElement(container, parsed, titleText, inline);

      // Register for preference dynamic updates
      registryNodes.push({
        container: container,
        parsed: parsed,
        titleText: titleText,
        isInline: inline,
        originalLink: link
      });

      // Replace anchor in DOM
      if (link.parentNode) {
        link.parentNode.replaceChild(container, link);
      }
    });
  }

  // Auto-initialize when running in browser
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initCodeActionBars());
    } else {
      initCodeActionBars();
    }
  }

  return {
    parseGitLabUrl,
    resolveLocalPath,
    buildIdeUri,
    showToast,
    fetchConfig,
    openInIde,
    initCodeActionBars,
    getPreferences,
    savePreferences,
    SUPPORTED_IDES,
    isInlineContext,
    showPopover,
    hidePopover,
    refreshAllCodeNavBars,
    DAEMON_BASE_URL
  };
});

