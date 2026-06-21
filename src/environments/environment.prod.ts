// src/environments/environment.prod.ts

/**
 * 🚀 Configuration de production
 * ⚠️ Remplacez 'votre-domaine.com' par votre domaine de production
 */

const PROD_API_URL = 'https://votre-domaine.com:3000';

export const environment = {
  production: true,
  apiUrl: `${PROD_API_URL}/api`,
  socketUrl: PROD_API_URL,
  baseUrl: PROD_API_URL,
  isWeb: true,
  isReactNative: false,
  isCapacitor: false,
  version: '1.0.0',
};

export const updateApiBaseUrl = (newBaseUrl: string): void => {
  (environment as any).apiUrl = `${newBaseUrl}/api`;
  (environment as any).socketUrl = newBaseUrl;
  (environment as any).baseUrl = newBaseUrl;
};

export default environment;