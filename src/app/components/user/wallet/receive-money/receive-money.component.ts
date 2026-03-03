import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Services
import { WalletService, QRCodeResponse } from '../../../../services/wallet.service';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../services/notification.service';

// Models
import { User } from '../../../../models/user.model';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-receive-money',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './receive-money.component.html',
  styleUrls: ['./receive-money.component.css']
})
export class ReceiveMoneyComponent implements OnInit {
  user: User | null = null;
  qrCode: string = '';
  qrCodeData: string = '';
  showAmountOption = false;
  amount: number | null = null;
  expiresAt: Date | null = null;

  constructor(
    private authService: AuthService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.user = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.generateQRCode();
  }

  generateQRCode(): void {
    this.walletService.generateReceiveQRCode(this.amount || undefined).subscribe({
      next: (response: QRCodeResponse) => {
        this.qrCode = response.qrCode;
        this.expiresAt = response.expiresAt;
        this.qrCodeData = JSON.stringify({
          type: 'payment',
          userId: this.user?.id,
          amount: this.amount,
          qrCode: response.qrCode
        });
      },
      error: (error: any) => {
        console.error('Erreur génération QR code:', error);
        this.notificationService.showError('Erreur lors de la génération du QR code');
      }
    });
  }

  setAmount(amount: number): void {
    this.amount = amount;
    this.showAmountOption = false;
    this.generateQRCode();
  }

  copyQRCode(): void {
    // Créer une image du QR code et la copier
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]).then(() => {
            this.notificationService.showSuccess('QR code copié !');
          }).catch(() => {
            this.notificationService.showError('Erreur lors de la copie');
          });
        }
      });
    }
  }

  downloadQRCode(): void {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `spaye-qr-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  }

  shareQRCode(): void {
    if (navigator.share) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'qr-code.png', { type: 'image/png' });
            navigator.share({
              title: 'Mon QR code SPaye',
              text: 'Scannez ce QR code pour m\'envoyer de l\'argent',
              files: [file]
            }).catch(() => {});
          }
        });
      }
    } else {
      this.downloadQRCode();
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  getExpirationTime(): string {
    if (!this.expiresAt) return '';
    
    const now = new Date();
    const exp = new Date(this.expiresAt);
    const diffMs = exp.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Expire dans moins d\'une minute';
    if (diffMins < 60) return `Expire dans ${diffMins} minutes`;
    return `Expire dans ${Math.floor(diffMins / 60)} heures`;
  }

  goBack(): void {
    this.router.navigate(['/wallet']);
  }
}