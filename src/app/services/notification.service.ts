// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private audio: HTMLAudioElement | null = null;

  constructor(private snackBar: MatSnackBar) {
    this.initAudio();
  }

  private initAudio(): void {
    try {
      this.audio = new Audio('/assets/sounds/notification.mp3');
      this.audio.load();
    } catch (e) {
      console.warn('⚠️ Impossible de charger le son de notification');
    }
  }

  playNotificationSound(): void {
    try {
      if (this.audio) {
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
      }
    } catch {}
  }

  showSuccess(message: string): void {
    this.playNotificationSound();
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showError(message: string): void {
    this.playNotificationSound();
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showInfo(message: string): void {
    this.playNotificationSound();
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showWarning(message: string): void {
    this.playNotificationSound();
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}