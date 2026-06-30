// ============================================================
// SPaye - Angular Environment (Docker)
// ============================================================

export const environment = {
  production: true,

  // ── URLs via Nginx Proxy (Docker) ──
  apiUrl: '/api',        // Proxy Nginx vers backend:3000
  socketUrl: '',         // Proxy Nginx (Socket.IO)
  baseUrl: '',           // Proxy Nginx

  // ── Flags ──
  isWeb: true,
  isReactNative: false,
  isCapacitor: false,

  // ── Version ──
  version: '1.0.0-docker',
};

export default environment;