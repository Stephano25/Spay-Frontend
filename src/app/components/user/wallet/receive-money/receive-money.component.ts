import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, keyframes } from '@angular/animations'; // AJOUTER CET IMPORT

import { WalletService } from '../../../../services/wallet.service';
import { NotificationService } from '../../../../services/notification.service';
import { UrlEncodePipe } from '../../../../pipes/urlencode.pipe';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-receive-money',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatInputModule,
    MatDividerModule,
    UrlEncodePipe
  ],
  templateUrl: './receive-money.component.html',
  styleUrls: ['./receive-money.component.css'],
  animations: [ // AJOUTER LES ANIMATIONS ICI
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.3s ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideInDown', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('0.4s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('slideInUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('0.4s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ transform: 'translateX(-20px)', opacity: 0 }),
        animate('0.4s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('slideInRight', [
      transition(':enter', [
        style({ transform: 'translateX(20px)', opacity: 0 }),
        animate('0.4s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate('0.4s ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ]),
    trigger('bounceIn', [
      transition(':enter', [
        style({ transform: 'scale(0.3)', opacity: 0 }),
        animate('0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class ReceiveMoneyComponent implements OnInit {
  qrCode: any = null;
  isLoading: boolean = true;
  showAmountOptions: boolean = false;
  selectedAmount: number | null = null;
  customAmount: number | null = null;
  copied: boolean = false;
  qrData: string = '';
  qrImageLoaded: boolean = false;
  qrImageError: boolean = false;

  amountOptions = [5000, 10000, 20000, 50000, 100000, 200000];

  constructor(
    private walletService: WalletService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.generateQR();
  }

  generateQR(amount?: number) {
    this.isLoading = true;
    this.qrImageLoaded = false;
    this.qrImageError = false;
    this.selectedAmount = amount || null;
    
    this.walletService.generateReceiveQRCode(amount).subscribe({
      next: (response) => {
        this.qrCode = response;
        
        const qrDataObj: any = {
          type: 'payment',
          qrCode: response.qrCode,
          expiresAt: response.expiresAt
        };
        
        if (amount) {
          qrDataObj.amount = amount;
        }
        
        this.qrData = JSON.stringify(qrDataObj);
        this.isLoading = false;
        this.showAmountOptions = false;
        
        this.notificationService.showSuccess('QR code généré avec succès');
      },
      error: (err) => {
        console.error('❌ Erreur génération QR:', err);
        this.notificationService.showError('Erreur lors de la génération du QR code');
        this.isLoading = false;
      }
    });
  }

  useCustomAmount() {
    if (this.customAmount && this.customAmount >= 100) {
      this.generateQR(this.customAmount);
      this.customAmount = null;
      this.showAmountOptions = false;
    } else {
      this.notificationService.showWarning('Montant minimum: 100 Ar');
    }
  }

  copyQRCode() {
    if (!this.qrData) return;
    
    navigator.clipboard.writeText(this.qrData).then(() => {
      this.copied = true;
      this.notificationService.showSuccess('QR code copié dans le presse-papiers');
      setTimeout(() => this.copied = false, 2000);
    }).catch(() => {
      this.notificationService.showError('Erreur lors de la copie');
    });
  }

  downloadQRImage() {
    if (!this.qrData) return;
    
    const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(this.qrData)}`;
    
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `spaye-qr-${Date.now()}.png`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.showSuccess('Image QR téléchargée');
      })
      .catch(() => {
        this.notificationService.showError('Erreur lors du téléchargement');
      });
  }

  shareQRCode() {
    if (!this.qrData) return;
    
    if (navigator.share) {
      navigator.share({
        title: 'Mon QR Code SPaye',
        text: this.qrData,
        url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(this.qrData)}`
      }).catch(() => {});
    } else {
      this.copyQRCode();
    }
  }

  onQRLoad() {
    this.qrImageLoaded = true;
  }

  onQRError() {
    this.qrImageError = true;
    this.notificationService.showError('Erreur de chargement du QR code');
  }

  getExpirationTime(): string {
    if (!this.qrCode?.expiresAt) return '';
    
    const now = new Date();
    const exp = new Date(this.qrCode.expiresAt);
    const diffMs = exp.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) return 'Expiré';
    if (diffMins < 1) return 'Expire dans moins d\'une minute';
    if (diffMins < 60) return `Expire dans ${diffMins} minutes`;
    return `Expire dans ${Math.floor(diffMins / 60)} heures`;
  }

  getExpirationProgress(): number {
    if (!this.qrCode?.expiresAt) return 100;
    
    const now = new Date();
    const exp = new Date(this.qrCode.expiresAt);
    const total = 30 * 60 * 1000; // 30 minutes
    const remaining = exp.getTime() - now.getTime();
    const progress = (remaining / total) * 100;
    
    return Math.max(0, Math.min(100, progress));
  }

  getExpirationColor(): string {
    const progress = this.getExpirationProgress();
    if (progress > 50) return '#10b981';
    if (progress > 20) return '#f59e0b';
    return '#ef4444';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  goBack() {
    this.router.navigate(['/wallet']);
  }
}