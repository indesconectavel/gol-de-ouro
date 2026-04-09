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
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
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
