// frontend/src/app/services/config.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

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
   * Récupère l'URL complète d'un fichier
   */
  getFileUrl(fileUrl?: string): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    if (fileUrl.startsWith('/uploads/')) {
      return `${this.getBaseUrl()}${fileUrl}`;
    }
    const base = this.getBaseUrl().endsWith('/') ? this.getBaseUrl() : this.getBaseUrl();
    const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    return `${base}${path}`;
  }

  buildUrl(endpoint: string): string {
    return `${this.getApiUrl()}${endpoint}`;
  }
}