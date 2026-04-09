/**
 * Instrumentação mínima (BLOCO H) — não bloqueante, sem await.
 * sendBeacon se VITE_ANALYTICS_BEACON_URL estiver definido; caso contrário log em DEV.
 */

const SESSION_KEY = 'go_analytics_session_id';

function getOrCreateSessionId() {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      let suffix = '';
      if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const buf = new Uint8Array(8);
        crypto.getRandomValues(buf);
        suffix = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
      } else {
        suffix = `${Date.now()}-${typeof performance !== 'undefined' ? performance.now() : 0}`;
      }
      id = `${Date.now()}-${suffix}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function getBeaconUrl() {
  try {
    return import.meta.env?.VITE_ANALYTICS_BEACON_URL || '';
  } catch {
    return '';
  }
}

function isDev() {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
}

/**
 * @param {string} eventName
 * @param {Record<string, unknown>} [payload]
 */
export function track(eventName, payload = {}) {
  try {
    const sessionId = getOrCreateSessionId();
    const ts = Date.now();
    const data = { event: eventName, ...payload, ts, sessionId };
    const json = JSON.stringify(data);
    const url = getBeaconUrl();

    if (url && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([json], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }

    if (isDev()) {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', eventName, data);
    }
  } catch {
    /* silencioso */
  }
}
