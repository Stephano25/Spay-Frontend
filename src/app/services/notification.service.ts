import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'info' | 'danger';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar, private dialog: MatDialog) {}

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showInfo(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showWarning(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  // Version simplifiée sans dépendance au composant de dialogue
  confirm(message: string, title: string = 'Confirmation'): Promise<boolean> {
    return new Promise((resolve) => {
      const result = window.confirm(`${title}\n\n${message}`);
      resolve(result);
    });
  }
}