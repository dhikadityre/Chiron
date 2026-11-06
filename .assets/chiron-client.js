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
            // Invariant & Safeguard: Jika daemon mengembalikan berkas belum ada (file_exists === false)
            // dan list kosong, periksa apakah ada anotasi lokal di LocalStorage.
            // Jangan timpa dengan array kosong, melainkan unggah otomatis ke daemon!
            if (data.file_exists === false && (!list || list.length === 0)) {
              try {
                const cached = localStorage.getItem(storageKey);
                const localList = cached ? JSON.parse(cached) : [];
                if (Array.isArray(localList) && localList.length > 0) {
                  console.info('[ChironSync] Mengunggah anotasi offline dari LocalStorage ke daemon...');
                  await this.save(lessonRelPath, localList);
                  return localList;
                }
              } catch (e) {
                console.warn('[ChironSync] Gagal membaca cached offline anotasi:', e);
              }
            }
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
     * Loads markers (bookmark, favourites, importants) for a specific course.
     * @param {string} courseId - The course identifier (e.g. 'samir-mobile-ios').
     * @returns {Promise<{course: string, bookmark: string|null, favourites: Array<string>, importants: Array<string>}>}
     */
    async loadCourseMarkers(courseId) {
      const storageKey = `chiron_markers_${courseId}`;
      const isOnline = await this.isDaemonAvailable();

      if (isOnline) {
        try {
          const res = await fetch(`${DAEMON_ORIGIN}/api/markers?course=${encodeURIComponent(courseId)}`, {
            mode: 'cors'
          });
          if (res.ok) {
            const data = await res.json();
            const markers = {
              course: courseId,
              bookmark: data.bookmark || null,
              favourites: Array.isArray(data.favourites) ? data.favourites : [],
              importants: Array.isArray(data.importants) ? data.importants : [],
              updated_at: data.updated_at || null
            };

            // Smart reconciliation with LocalStorage:
            // If local storage has items added while daemon was offline, preserve them!
            try {
              const cached = localStorage.getItem(storageKey);
              if (cached) {
                const local = JSON.parse(cached);
                const localFavs = Array.isArray(local.favourites) ? local.favourites : [];
                const localImps = Array.isArray(local.importants) ? local.importants : [];
                const localBmk = local.bookmark || null;

                if (data.file_exists === false) {
                  // Server has no markers file yet, push local cache to server
                  if (localBmk || localFavs.length > 0 || localImps.length > 0) {
                    await this.saveCourseMarkers(courseId, local);
                    return local;
                  }
                } else {
                  // Server file exists, check if local has offline additions not on server
                  const hasExtraFavs = localFavs.some(f => !markers.favourites.includes(f));
                  const hasExtraImps = localImps.some(i => !markers.importants.includes(i));
                  const hasExtraBmk = localBmk && localBmk !== markers.bookmark && !markers.bookmark;

                  if (hasExtraFavs || hasExtraImps || hasExtraBmk) {
                    markers.favourites = Array.from(new Set([...markers.favourites, ...localFavs]));
                    markers.importants = Array.from(new Set([...markers.importants, ...localImps]));
                    if (!markers.bookmark && localBmk) markers.bookmark = localBmk;
                    await this.saveCourseMarkers(courseId, markers);
                    return markers;
                  }
                }
              }
            } catch (e) {}

            localStorage.setItem(storageKey, JSON.stringify(markers));
            return markers;
          }
        } catch (err) {
          console.warn('[ChironSync] Failed to load markers from daemon, fallback to LocalStorage:', err);
        }
      }

      // Offline fallback
      try {
        const cached = localStorage.getItem(storageKey);
        return cached ? JSON.parse(cached) : {
          course: courseId,
          bookmark: null,
          favourites: [],
          importants: []
        };
      } catch (err) {
        return { course: courseId, bookmark: null, favourites: [], importants: [] };
      }
    },

    /**
     * Saves markers for a specific course.
     * @param {string} courseId - The course identifier.
     * @param {{bookmark: string|null, favourites: Array<string>, importants: Array<string>}} markers
     */
    async saveCourseMarkers(courseId, markers) {
      const storageKey = `chiron_markers_${courseId}`;
      const payload = {
        course: courseId,
        updated_at: new Date().toISOString(),
        bookmark: markers.bookmark || null,
        favourites: Array.isArray(markers.favourites) ? markers.favourites : [],
        importants: Array.isArray(markers.importants) ? markers.importants : []
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (e) {
        console.error('[ChironSync] LocalStorage save error:', e);
      }

      window.dispatchEvent(new CustomEvent('chiron:markers-updated', {
        detail: { courseId, markers: payload }
      }));

      const isOnline = await this.isDaemonAvailable();
      if (isOnline) {
        try {
          const res = await fetch(`${DAEMON_ORIGIN}/api/markers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const result = await res.json();
            return { success: true, daemon: true, path: result.path };
          }
        } catch (err) {
          console.warn('[ChironSync] Daemon save markers error:', err);
        }
      }

      return { success: true, daemon: false };
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

  // Auto-bootstrap chiron-ide-launcher.js & chiron-page-markers.js if not yet included
  if (typeof document !== 'undefined') {
    const scripts = document.querySelectorAll('script[src*="chiron-client.js"]');
    if (scripts.length > 0) {
      const clientSrc = scripts[0].getAttribute('src');
      
      if (!window.ChironIdeLauncher) {
        const launcherSrc = clientSrc.replace('chiron-client.js', 'chiron-ide-launcher.js');
        const launcherScript = document.createElement('script');
        launcherScript.src = launcherSrc;
        document.head.appendChild(launcherScript);
      }

      if (!window.ChironPageMarkers) {
        const markersSrc = clientSrc.replace('chiron-client.js', 'chiron-page-markers.js');
        const markersScript = document.createElement('script');
        markersScript.src = markersSrc;
        document.head.appendChild(markersScript);
      }
    }
  }

})(window);
