const REMOTE_API =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'https://dev.sojori.com';

/** Proxy same-origin en dev local / LAN (téléphone sur hotspot ne joint pas toujours l'API distante). */
export const LOCAL_API_PROXY_PREFIX = '/api/sojori';

function isPrivateOrLocalHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)) return true;
  return false;
}

/** Base URL pour fetch côté navigateur ou SSR. */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && isPrivateOrLocalHost(window.location.hostname)) {
    return LOCAL_API_PROXY_PREFIX;
  }
  return REMOTE_API;
}

/** Hôte dev local / LAN — pas un domaine client marque blanche. */
export function isLocalDevHost(hostname: string): boolean {
  return isPrivateOrLocalHost(hostname);
}

/** Destination backend pour rewrites Next.js (serveur uniquement). */
export function getRemoteApiBaseUrl(): string {
  return REMOTE_API;
}
