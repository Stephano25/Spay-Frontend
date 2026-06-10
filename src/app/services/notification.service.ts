import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Joue le son de notification depuis le fichier MP3
   */
  public playNotificationSound(): void {
    try {
      const audio = new Audio('/assets/sounds/notifications.mp3');
      audio.play().catch(err => {
        // Ignorer silencieusement les erreurs de lecture (autoplay bloqué)
        console.warn('Lecture du son impossible', err);
      });
    } catch (e) {
      // Ignorer
    }
  }

  // Alias pour ne pas casser les appels existants
  private playSound(): void {
    this.playNotificationSound();
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