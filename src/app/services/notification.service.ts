import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private audio: HTMLAudioElement | null = null;

  constructor(private snackBar: MatSnackBar) {
    if (typeof window !== 'undefined') {
      this.audio = new Audio('/assets/sounds/notification.mp3');
      this.audio.onerror = () => console.warn('Son de notification non disponible');
    }
  }

  private playSound(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
    }
  }

  showSuccess(message: string): void {
    this.playSound();
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showError(message: string): void {
    this.playSound();
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showInfo(message: string): void {
    this.playSound();
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showWarning(message: string): void {
    this.playSound();
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}