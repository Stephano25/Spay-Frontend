// ============================================================
// SPaye - Angular Environment (Local Network)
// ============================================================

// 🌐 IP locale du serveur backend
// ⚠️ Remplacez par votre IP locale
// Pour trouver votre IP : ipconfig (Windows) ou ifconfig (Mac/Linux)
const LOCAL_IP = '192.168.1.100'; // ← À MODIFIER AVEC VOTRE IP

export const environment = {
  production: false,
  apiUrl: `http://${LOCAL_IP}:3000/api`,
  socketUrl: `http://${LOCAL_IP}:3000`,
  baseUrl: `http://${LOCAL_IP}:3000`,
  isWeb: true,
  isReactNative: false,
  isCapacitor: false,
  version: '1.0.0-local',
};

export default environment;