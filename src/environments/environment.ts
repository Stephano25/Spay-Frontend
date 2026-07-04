// frontend/src/environments/environment.ts
export const environment = {
  production: false,
  // ✅ Utiliser /api (via le proxy Nginx)
  apiUrl: '/api',
  socketUrl: '',
  baseUrl: '',
  uploadUrl: '/uploads',
  isWeb: true,
  isReactNative: false,
  isCapacitor: false,
  version: '1.0.0-dev',
};