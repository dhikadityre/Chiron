/**
 * ==============================================================================
 * Chiron Client Sync Adapter — Local-First Hybrid Persistence
 * ==============================================================================
 * Automatically routes annotations between Chiron Background Sync Daemon
 * (sidecar JSON on disk) and browser LocalStorage (offline fallback).
 */

(function (window) {
  'use strict';

  // Determine daemon base URL:
  // If loaded via http/https on the daemon, use origin; otherwise default to localhost:8765
  const isHttp = window.location.protocol.startsWith('http');
  const DAEMON_ORIGIN = isHttp ? window.location.origin : 'http://localhost:8765';

  let _daemonActive = null; // null = untested, true = online, false = offline
  let _lastCheckTime = 0;

  const ChironSync = {
    /**
     * Checks if the Chiron background sync daemon is active.
     */
    async isDaemonAvailable(forceRefresh = false) {
      const now = Date.now();
      if (!forceRefresh && _daemonActive !== null && (now - _lastCheckTime < 10000)) {
        return _daemonActive;
      }

      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 1200);
        const res = await fetch(`${DAEMON_ORIGIN}/api/health`, {
          signal: ctrl.signal,
          mode: 'cors'
        });
        clearTimeout(timeoutId);
        _daemonActive = res.ok;
      } catch (e) {
        _daemonActive = false;
      }

      _lastCheckTime = Date.now();
      window.dispatchEvent(new CustomEvent('chiron:sync-status', {
        detail: { online: _daemonActive, origin: DAEMON_ORIGIN }
      }));
      return _daemonActive;
    },

    /**
     * Loads annotations for a specific lesson file.
     * @param {string} lessonRelPath - Relative path to the lesson HTML file.
     * @returns {Promise<Array>} List of annotation objects.
     */
    async load(lessonRelPath) {
      const storageKey = `chiron_anno_${lessonRelPath}`;
      const isOnline = await this.isDaemonAvailable();

      if (isOnline) {
        try {
          const res = await fetch(`${DAEMON_ORIGIN}/api/annotations?file=${encodeURIComponent(lessonRelPath)}`, {
            mode: 'cors'
          });
          if (res.ok) {
            const data = await res.json();
            const list = data.annotations || [];
            // Mirror to localStorage as cache
            localStorage.setItem(storageKey, JSON.stringify(list));
            return list;
          }
        } catch (err) {
          console.warn('[ChironSync] Failed to load from daemon, falling back to LocalStorage:', err);
        }
      }

      // Offline / LocalStorage fallback
      try {
        const cached = localStorage.getItem(storageKey);
        return cached ? JSON.parse(cached) : [];
      } catch (err) {
        console.error('[ChironSync] LocalStorage read failed:', err);
        return [];
      }
    },

    /**
     * Saves annotations for a specific lesson file.
     * @param {string} lessonRelPath - Relative path to the lesson HTML file.
     * @param {Array} annotations - Array of annotation objects.
     * @returns {Promise<{success: boolean, daemon: boolean, count: number}>}
     */
    async save(lessonRelPath, annotations) {
      const storageKey = `chiron_anno_${lessonRelPath}`;

      // 1. Instant sync backup to LocalStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(annotations));
      } catch (err) {
        console.error('[ChironSync] LocalStorage write failed:', err);
      }

      // 2. Silent background sync to local sidecar JSON via daemon
      const isOnline = await this.isDaemonAvailable();
      if (isOnline) {
        try {
          const res = await fetch(`${DAEMON_ORIGIN}/api/annotations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify({
              file: lessonRelPath,
              annotations: annotations
            })
          });

          if (res.ok) {
            const result = await res.json();
            window.dispatchEvent(new CustomEvent('chiron:saved', {
              detail: { daemon: true, path: result.path, count: annotations.length }
            }));
            return { success: true, daemon: true, count: annotations.length, path: result.path };
          }
        } catch (err) {
          console.warn('[ChironSync] Daemon save error, kept in LocalStorage:', err);
        }
      }

      window.dispatchEvent(new CustomEvent('chiron:saved', {
        detail: { daemon: false, count: annotations.length }
      }));
      return { success: true, daemon: false, count: annotations.length };
    },

    /**
     * Exports the annotations as a downloadable .json file (manual backup helper).
     */
    exportToFile(lessonRelPath, annotations) {
      const filename = lessonRelPath.split('/').pop().replace(/\.html$/, '.notes.json');
      const blob = new Blob([JSON.stringify({
        version: "1.0",
        lesson: lessonRelPath,
        updated_at: new Date().toISOString(),
        total_annotations: annotations.length,
        annotations: annotations
      }, null, 2)], { type: 'application/json' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  window.ChironSync = ChironSync;

  // Auto-bootstrap chiron-ide-launcher.js if not yet included
  if (typeof document !== 'undefined' && !window.ChironIdeLauncher) {
    const scripts = document.querySelectorAll('script[src*="chiron-client.js"]');
    if (scripts.length > 0) {
      const clientSrc = scripts[0].getAttribute('src');
      const launcherSrc = clientSrc.replace('chiron-client.js', 'chiron-ide-launcher.js');
      const launcherScript = document.createElement('script');
      launcherScript.src = launcherSrc;
      document.head.appendChild(launcherScript);
    }
  }

})(window);
