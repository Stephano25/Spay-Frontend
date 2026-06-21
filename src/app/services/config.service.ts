// src/app/services/config.service.ts
import { Injectable } from '@angular/core';
import { environment, updateApiBaseUrl } from '../../environments/environment';

export interface AppConfig {
  apiUrl: string;
  socketUrl: string;
  baseUrl: string;
  isWeb: boolean;
  isReactNative: boolean;
  isCapacitor: boolean;
  version: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig;

  constructor() {
    this.config = {
      apiUrl: environment.apiUrl,
      socketUrl: environment.socketUrl,
      baseUrl: environment.baseUrl,
      isWeb: environment.isWeb,
      isReactNative: environment.isReactNative,
      isCapacitor: environment.isCapacitor,
      version: environment.version,
    };
  }

  getConfig(): AppConfig {
    return this.config;
  }

  getApiUrl(): string {
    return this.config.apiUrl;
  }

  getSocketUrl(): string {
    return this.config.socketUrl;
  }

  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  isWeb(): boolean {
    return this.config.isWeb;
  }

  isReactNative(): boolean {
    return this.config.isReactNative;
  }

  isCapacitor(): boolean {
    return this.config.isCapacitor;
  }

  /**
   * 🔥 Récupère l'URL complète d'un fichier
   */
  getFileUrl(fileUrl?: string): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    // Si l'URL commence par '/uploads/', on ajoute l'URL de base
    if (fileUrl.startsWith('/uploads/')) {
      return `${this.getBaseUrl()}${fileUrl}`;
    }
    // Sinon, on ajoute un slash si nécessaire
    const base = this.getBaseUrl().endsWith('/') ? this.getBaseUrl() : this.getBaseUrl();
    const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    return `${base}${path}`;
  }

  buildUrl(endpoint: string): string {
    return `${this.getApiUrl()}${endpoint}`;
  }

  updateApiUrl(newBaseUrl: string): void {
    updateApiBaseUrl(newBaseUrl);
    this.config.apiUrl = `${newBaseUrl}/api`;
    this.config.socketUrl = newBaseUrl;
    this.config.baseUrl = newBaseUrl;

    if (this.isWeb()) {
      localStorage.setItem('api_base_url', newBaseUrl);
    }
    console.log('🔧 API URL mise à jour:', this.config.apiUrl);
  }

  initialize(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isWeb()) {
        const storedUrl = localStorage.getItem('api_base_url');
        if (storedUrl) {
          this.updateApiUrl(storedUrl);
        }
      }
      resolve();
    });
  }
}