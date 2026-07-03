// frontend/src/app/components/admin/qr-scanner/qr-scanner.component.ts
import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.css'],
})
export class QRScannerComponent implements OnDestroy {
  @Output() scanResult = new EventEmitter<string>();
  @Output() closeScanner = new EventEmitter<void>();

  qrInput: string = '';
  isScanning: boolean = false;

  ngOnDestroy(): void {
    // Nettoyer si nécessaire
  }

  scan(): void {
    if (!this.qrInput || this.isScanning) return;

    this.isScanning = true;
    setTimeout(() => {
      this.scanResult.emit(this.qrInput);
      this.isScanning = false;
    }, 500);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        if (result) {
          this.qrInput = '{"type":"admin_transaction","action":"deposit","adminId":"admin123","adminName":"Admin Test","amount":1000,"timestamp":"2026-07-03T10:00:00Z","expiresAt":"2026-07-03T10:05:00Z","signature":"abc123"}';
          this.scan();
        }
      } catch (error) {
        console.error('Erreur lecture fichier:', error);
      }
    };

    reader.readAsDataURL(file);
    input.value = '';
  }

  close(): void {
    this.closeScanner.emit();
  }
}