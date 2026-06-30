// ============================================================
// SPaye - Angular Environment (Détection automatique)
// ============================================================

// 🔍 Détection de l'environnement d'exécution
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
const isCapacitor = typeof (window as any)?.Capacitor !== 'undefined';

// 🌐 URL de base - Détection automatique
let BASE_URL = 'http://localhost:3000';

if (isWeb) {
  // Récupérer l'IP ou le hostname depuis l'URL du navigateur
  const hostname = window.location.hostname;
  
  // Vérifier si on est sur un réseau local (pas localhost)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Utiliser l'IP/hostname actuel avec le port 3000
    BASE_URL = `${window.location.protocol}//${hostname}:3000`;
  } else {
    // Essayer de récupérer l'IP locale via une API
    try {
      // Récupérer l'IP locale stockée dans localStorage
      const savedIp = localStorage.getItem('local_ip');
      if (savedIp) {
        BASE_URL = `http://${savedIp}:3000`;
        console.log(`✅ IP locale chargée depuis localStorage: ${savedIp}`);
      }
    } catch (e) {
      console.warn('⚠️ Impossible de récupérer l\'IP locale');
    }
  }
} else if (isReactNative) {
  // En React Native, utiliser l'IP stockée ou une IP par défaut
  try {
    const savedIp = localStorage.getItem('local_ip');
    if (savedIp) {
      BASE_URL = `http://${savedIp}:3000`;
    } else {
      // IP par défaut pour React Native (à modifier)
      BASE_URL = 'http://192.168.1.100:3000';
    }
  } catch (e) {
    BASE_URL = 'http://192.168.1.100:3000';
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

// 🛠️ Fonction pour mettre à jour l'IP locale
export const setLocalIp = (ip: string): void => {
  if (isWeb || isReactNative) {
    try {
      localStorage.setItem('local_ip', ip);
      console.log(`✅ IP locale sauvegardée: ${ip}`);
    } catch (e) {
      console.warn('⚠️ Impossible de sauvegarder l\'IP');
    }
  }
};

// 🛠️ Fonction pour obtenir l'IP locale
export const getLocalIp = (): string | null => {
  try {
    return localStorage.getItem('local_ip');
  } catch (e) {
    return null;
  }
};

// 🛠️ Fonction pour mettre à jour l'URL dynamiquement
export const updateApiBaseUrl = (newBaseUrl: string): void => {
  (environment as any).apiUrl = `${newBaseUrl}/api`;
  (environment as any).socketUrl = newBaseUrl;
  (environment as any).baseUrl = newBaseUrl;
  console.log('✅ API URL mise à jour:', newBaseUrl);
};

export default environment;