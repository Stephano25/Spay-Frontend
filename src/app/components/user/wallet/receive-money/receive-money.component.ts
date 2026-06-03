import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';

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
  animations: [
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
export class ReceiveMoneyComponent implements OnInit, OnDestroy {
  qrCode: any = null;
  isLoading: boolean = true;
  showAmountOptions: boolean = false;
  selectedAmount: number | null = null;
  customAmount: number | null = null;
  copied: boolean = false;
  qrData: string = '';
  qrImageLoaded: boolean = false;
  qrImageError: boolean = false;

  // Variables pour l'expiration (CORRIGÉ: utiliser des propriétés au lieu de méthodes)
  expirationTimeText: string = '';
  expirationProgress: number = 100;
  expirationColor: string = '#10b981';
  private expirationInterval: any;

  amountOptions = [5000, 10000, 20000, 50000, 100000, 200000];

  constructor(
    private walletService: WalletService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.generateQR();
  }

  ngOnDestroy() {
    if (this.expirationInterval) {
      clearInterval(this.expirationInterval);
    }
  }

  generateQR(amount?: number) {
    this.isLoading = true;
    this.qrImageLoaded = false;
    this.qrImageError = false;
    this.selectedAmount = amount || null;
    
    // Nettoyer l'intervalle précédent
    if (this.expirationInterval) {
      clearInterval(this.expirationInterval);
    }
    
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
        
        // Démarrer l'intervalle de mise à jour de l'expiration
        this.startExpirationTimer();
        
        this.notificationService.showSuccess('QR code généré avec succès');
      },
      error: (err) => {
        console.error('❌ Erreur génération QR:', err);
        this.notificationService.showError('Erreur lors de la génération du QR code');
        this.isLoading = false;
      }
    });
  }

  startExpirationTimer() {
    this.updateExpirationInfo();
    this.expirationInterval = setInterval(() => {
      this.updateExpirationInfo();
    }, 1000);
  }

  updateExpirationInfo() {
    if (!this.qrCode?.expiresAt) return;
    
    const now = new Date();
    const exp = new Date(this.qrCode.expiresAt);
    const total = 30 * 60 * 1000; // 30 minutes
    const remaining = exp.getTime() - now.getTime();
    
    // Calculer la progression
    let progress = (remaining / total) * 100;
    progress = Math.max(0, Math.min(100, progress));
    this.expirationProgress = progress;
    
    // Calculer le texte
    const diffMins = Math.floor(remaining / 60000);
    if (remaining <= 0) {
      this.expirationTimeText = 'Expiré';
    } else if (diffMins < 1) {
      this.expirationTimeText = 'Expire dans moins d\'une minute';
    } else if (diffMins < 60) {
      this.expirationTimeText = `Expire dans ${diffMins} minutes`;
    } else {
      this.expirationTimeText = `Expire dans ${Math.floor(diffMins / 60)} heures`;
    }
    
    // Calculer la couleur
    if (progress > 50) {
      this.expirationColor = '#10b981';
    } else if (progress > 20) {
      this.expirationColor = '#f59e0b';
    } else {
      this.expirationColor = '#ef4444';
    }
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

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  goBack() {
    this.router.navigate(['/wallet']);
  }
}