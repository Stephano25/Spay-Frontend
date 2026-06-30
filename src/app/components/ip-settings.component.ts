// ============================================================
// IP SETTINGS COMPONENT - SPaye
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IpService } from '../services/ip.service';
import { NotificationService } from '../services/notification.service';
import { environment, setLocalIp, updateApiBaseUrl } from '../../environments/environment';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-ip-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card class="ip-settings-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>settings_ethernet</mat-icon>
          Configuration réseau
        </mat-card-title>
        <mat-card-subtitle>Détection automatique ou manuelle de l'IP du serveur</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="ip-info">
          <p><strong>IP actuelle:</strong> {{ currentIp || 'Non définie' }}</p>
          <p><strong>API URL:</strong> {{ environment.apiUrl }}</p>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>IP du serveur backend</mat-label>
          <input matInput [(ngModel)]="ipInput" placeholder="192.168.1.100">
          <mat-hint>Exemple: 192.168.1.100</mat-hint>
        </mat-form-field>

        <div class="button-group">
          <button mat-raised-button color="primary" (click)="saveIp()" [disabled]="isLoading">
            <mat-icon>save</mat-icon>
            Enregistrer
          </button>
          <button mat-raised-button color="accent" (click)="autoDetect()" [disabled]="isLoading">
            <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
            <span *ngIf="!isLoading">
              <mat-icon>autorenew</mat-icon>
              Détection automatique
            </span>
          </button>
          <button mat-raised-button color="warn" (click)="resetIp()">
            <mat-icon>refresh</mat-icon>
            Réinitialiser
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .ip-settings-card {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
    }
    .full-width {
      width: 100%;
      margin: 10px 0;
    }
    .ip-info {
      background: var(--surface-2);
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .ip-info p {
      margin: 4px 0;
    }
    .button-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 12px;
    }
    .button-group button {
      flex: 1;
      min-width: 120px;
    }
  `]
})
export class IpSettingsComponent implements OnInit {
  currentIp: string | null = null;
  ipInput: string = '';
  isLoading: boolean = false;
  environment = environment;

  constructor(
    private ipService: IpService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentIp = localStorage.getItem('local_ip');
    this.ipInput = this.currentIp || '';
  }

  saveIp(): void {
    if (!this.ipInput || this.ipInput.trim() === '') {
      this.notificationService.showError('Veuillez entrer une IP valide');
      return;
    }

    this.isLoading = true;
    const ip = this.ipInput.trim();
    const baseUrl = `http://${ip}:3000`;

    // Tester l'IP
    this.ipService.testUrl(baseUrl).subscribe({
      next: (isValid) => {
        if (isValid) {
          setLocalIp(ip);
          updateApiBaseUrl(baseUrl);
          this.currentIp = ip;
          this.environment.apiUrl = `${baseUrl}/api`;
          this.environment.socketUrl = baseUrl;
          this.environment.baseUrl = baseUrl;
          this.notificationService.showSuccess(`IP ${ip} configurée avec succès`);
          this.isLoading = false;
          // Recharger la page pour appliquer les changements
          setTimeout(() => window.location.reload(), 1000);
        } else {
          this.notificationService.showError(`Impossible de joindre le serveur à l'IP ${ip}`);
          this.isLoading = false;
        }
      },
      error: () => {
        this.notificationService.showError(`Impossible de joindre le serveur à l'IP ${ip}`);
        this.isLoading = false;
      }
    });
  }

  autoDetect(): void {
    this.isLoading = true;
    this.ipService.autoDetectBackend().subscribe({
      next: (ip) => {
        this.currentIp = ip;
        this.ipInput = ip;
        const baseUrl = `http://${ip}:3000`;
        setLocalIp(ip);
        updateApiBaseUrl(baseUrl);
        this.environment.apiUrl = `${baseUrl}/api`;
        this.environment.socketUrl = baseUrl;
        this.environment.baseUrl = baseUrl;
        this.notificationService.showSuccess(`Backend détecté: ${ip}`);
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.showError('Erreur lors de la détection automatique');
        this.isLoading = false;
      }
    });
  }

  resetIp(): void {
    localStorage.removeItem('local_ip');
    this.currentIp = null;
    this.ipInput = '';
    const baseUrl = 'http://localhost:3000';
    updateApiBaseUrl(baseUrl);
    this.environment.apiUrl = `${baseUrl}/api`;
    this.environment.socketUrl = baseUrl;
    this.environment.baseUrl = baseUrl;
    this.notificationService.showInfo('IP réinitialisée à localhost');
    setTimeout(() => window.location.reload(), 1000);
  }
}