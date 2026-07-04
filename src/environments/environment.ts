// frontend/src/environments/environment.ts (Développement)
export const environment = {
  production: false,
  // ✅ URL complète du backend pour Google OAuth
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000',
  baseUrl: 'http://localhost:3000',
  uploadUrl: 'http://localhost:3000/uploads',
  
  isWeb: true,
  isReactNative: false,
  isCapacitor: false,
  version: '1.0.0-dev',
};