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
        return `antigravity://file/${localFilePath}:${cleanLine}`;
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

  return {
    parseGitLabUrl,
    resolveLocalPath,
    buildIdeUri,
    showToast,
    fetchConfig,
    openInIde,
    DAEMON_BASE_URL
  };
});
