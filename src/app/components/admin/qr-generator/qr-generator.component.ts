// frontend/src/app/components/admin/qr-generator/qr-generator.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Clipboard } from '@angular/cdk/clipboard';

import { AdminService, QRCodeResponse } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-qr-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './qr-generator.component.html',
  styleUrls: ['./qr-generator.component.css'],
})
export class QRGeneratorComponent {
  @Input() defaultType: 'deposit' | 'withdraw' = 'deposit';
  @Output() qrGenerated = new EventEmitter<QRCodeResponse>();
  @Output() closeGenerator = new EventEmitter<void>();

  selectedType: 'deposit' | 'withdraw' = 'deposit';
  amount: number = 0;
  isGenerating: boolean = false;
  qrResponse: QRCodeResponse | null = null;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private clipboard: Clipboard,
  ) {
    this.selectedType = this.defaultType;
  }

  generateQR(): void {
    this.isGenerating = true;
    this.qrResponse = null;

    this.adminService.generateQRCode(this.selectedType, this.amount || undefined).subscribe({
      next: (response) => {
        this.qrResponse = response;
        this.isGenerating = false;
        this.qrGenerated.emit(response);
        this.notificationService.showSuccess('QR Code généré avec succès');
      },
      error: (error) => {
        console.error('❌ Erreur génération QR:', error);
        this.isGenerating = false;
        this.notificationService.showError(error?.error?.message || 'Erreur lors de la génération du QR Code');
      },
    });
  }

  copyQRCode(): void {
    if (this.qrResponse) {
      this.clipboard.copy(this.qrResponse.qrCode);
      this.notificationService.showSuccess('Code QR copié dans le presse-papier');
    }
  }

  downloadQR(): void {
    if (this.qrResponse) {
      const link = document.createElement('a');
      link.download = `qr-code-${this.selectedType}-${Date.now()}.png`;
      link.href = this.qrResponse.qrCodeImage;
      link.click();
    }
  }

  isExpired(): boolean {
    if (!this.qrResponse) return false;
    return new Date(this.qrResponse.expiresAt) < new Date();
  }

  formatExpiration(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffSec < 0) return 'Expiré';
    if (diffMin < 1) return 'Expire dans ' + diffSec + 's';
    if (diffMin < 60) return 'Expire dans ' + diffMin + 'min';
    return date.toLocaleTimeString('fr-FR');
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount || 0);
  }

  close(): void {
    this.closeGenerator.emit();
  }
}