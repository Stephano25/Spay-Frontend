// ============================================================
// SPaye - Angular Environment (Mobile - React Native / Capacitor)
// ============================================================

// 🌐 IP locale de votre machine (backend)
// ⚠️ Remplacez par l'IP de votre machine
// Pour trouver votre IP : ipconfig (Windows) ou ifconfig (Mac/Linux)
const LOCAL_IP = '192.168.188.135'; // ← À modifier avec votre IP

export const environment = {
  production: false,
  apiUrl: `http://${LOCAL_IP}:3000/api`,
  socketUrl: `http://${LOCAL_IP}:3000`,
  baseUrl: `http://${LOCAL_IP}:3000`,
  isWeb: false,
  isReactNative: true,
  isCapacitor: false,
  version: '1.0.0-mobile',
};

// Fonction pour mettre à jour l'URL dynamiquement
export const updateApiBaseUrl = (newBaseUrl: string): void => {
  (environment as any).apiUrl = `${newBaseUrl}/api`;
  (environment as any).socketUrl = newBaseUrl;
  (environment as any).baseUrl = newBaseUrl;
};

export default environment;