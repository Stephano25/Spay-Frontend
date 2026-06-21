// src/environments/environment.ts

/**
 * 🌍 Configuration de l'environnement web
 */

// 🔍 Détection de l'environnement d'exécution
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
const isCapacitor = typeof (window as any)?.Capacitor !== 'undefined';

// 🌐 URL de base - Par défaut pour le développement web local
let BASE_URL = 'http://localhost:3000';

// 🔧 Sélection automatique de l'URL pour le web
if (isWeb) {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // En production (serveur distant)
    BASE_URL = `${window.location.protocol}//${window.location.hostname}:3000`;
  } else {
    // En développement local
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
  version: '1.0.0',
};

// 🛠️ Fonction utilitaire pour mettre à jour l'URL dynamiquement
export const updateApiBaseUrl = (newBaseUrl: string): void => {
  (environment as any).apiUrl = `${newBaseUrl}/api`;
  (environment as any).socketUrl = newBaseUrl;
  (environment as any).baseUrl = newBaseUrl;
  console.log('✅ API URL mise à jour:', newBaseUrl);
};

// 📦 Export par défaut
export default environment;