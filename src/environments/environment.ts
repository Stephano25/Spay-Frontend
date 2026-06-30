// ============================================================
// SPaye - Angular Environment (Development)
// ============================================================

// 🔍 Détection de l'environnement d'exécution
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
const isCapacitor = typeof (window as any)?.Capacitor !== 'undefined';

// 🌐 URL de base
let BASE_URL = 'http://localhost:3000';

// 🔧 Sélection automatique pour le développement
if (isWeb) {
  // Si on est sur un réseau local (mobile)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    BASE_URL = `${window.location.protocol}//${window.location.hostname}:3000`;
  } else {
    BASE_URL = 'http://localhost:3000';
  }
}

// 📦 Export de la configuration
export const environment = {
  production: false,
  apiUrl: `${BASE_URL}/api`,
  socketUrl: BASE_URL,
  baseUrl: BASE_URL,
  isWeb,
  isReactNative,
  isCapacitor,
  version: '1.0.0-dev',
};

// 🛠️ Fonction utilitaire pour mettre à jour l'URL dynamiquement
export const updateApiBaseUrl = (newBaseUrl: string): void => {
  (environment as any).apiUrl = `${newBaseUrl}/api`;
  (environment as any).socketUrl = newBaseUrl;
  (environment as any).baseUrl = newBaseUrl;
  console.log('✅ API URL mise à jour:', newBaseUrl);
};

export default environment;