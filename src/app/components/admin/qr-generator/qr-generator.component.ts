// frontend/src/app/components/admin/qr-generator/qr-generator.component.ts
import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

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
    TranslatePipe
  ],
  templateUrl: './qr-generator.component.html',
  styleUrls: ['./qr-generator.component.css'],
})
export class QRGeneratorComponent implements OnInit {
  @Input() defaultType: 'deposit' | 'withdraw' = 'deposit';
  @Output() qrGenerated = new EventEmitter<QRCodeResponse>();
  @Output() closeGenerator = new EventEmitter<void>();

  selectedType: 'deposit' | 'withdraw' = 'deposit';
  amount: number | null = null;
  isGenerating: boolean = false;
  qrResponse: QRCodeResponse | null = null;
  qrCodeImage: string = '';
  private isDestroyed = false;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private clipboard: Clipboard,
  ) {}

  ngOnInit(): void {
    this.selectedType = this.defaultType;
    setTimeout(() => {
      this.generateQR();
    }, 500);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
  }

  generateQR(): void {
    this.isGenerating = true;
    this.qrResponse = null;
    this.qrCodeImage = '';

    const amount = this.amount || undefined;
    
    this.adminService.generateQRCode(this.selectedType, amount).subscribe({
      next: (response) => {
        console.log('✅ QR Code généré:', response);
        this.qrResponse = response;
        this.qrCodeImage = response.qrCodeImage;
        this.isGenerating = false;
        this.qrGenerated.emit(response);
        this.notificationService.showSuccess(
          `QR Code de ${response.action === 'deposit' ? 'dépôt' : 'retrait'} généré avec succès`
        );
      },
      error: (error) => {
        console.error('❌ Erreur génération QR:', error);
        this.isGenerating = false;
        this.simulateQRGeneration();
      },
    });
  }

  simulateQRGeneration(): void {
    const qrData = {
      type: 'admin_transaction',
      action: this.selectedType,
      adminId: 'admin-simulated',
      adminName: 'Administrateur SPaye',
      amount: this.amount || null,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      signature: 'simulated-' + Date.now()
    };

    const qrString = JSON.stringify(qrData);
    const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;

    this.qrResponse = {
      qrCode: qrString,
      qrCodeImage: qrCodeImage,
      expiresAt: qrData.expiresAt,
      action: this.selectedType,
      amount: this.amount || null
    };
    this.qrCodeImage = qrCodeImage;
    this.isGenerating = false;
    
    this.notificationService.showInfo('QR Code généré en mode simulation');
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
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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