import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WalletService } from '../../../../services/wallet.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QRCodeResponse } from '../../../../models/wallet.model';

@Component({
  selector: 'app-receive-money',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './receive-money.component.html',
  styleUrls: ['./receive-money.component.css']
})
export class ReceiveMoneyComponent implements OnInit {
  qrCode: QRCodeResponse | null = null;
  isLoading: boolean = true;
  showAmountOptions: boolean = false;
  selectedAmount: number | null = null;
  copied: boolean = false;

  amountOptions = [5000, 10000, 20000, 50000, 100000, 200000];

  constructor(
    private walletService: WalletService,
    private router: Router
  ) {}

  ngOnInit() {
    this.generateQR();
  }

  generateQR(amount?: number) {
    this.isLoading = true;
    this.selectedAmount = amount || null;
    
    this.walletService.generateReceiveQRCode(amount).subscribe({
      next: (response) => {
        this.qrCode = response;
        this.isLoading = false;
        this.showAmountOptions = false;
      },
      error: (err) => {
        console.error('❌ Erreur génération QR:', err);
        this.isLoading = false;
      }
    });
  }

  copyQRCode() {
    if (!this.qrCode?.qrCode) return;
    
    navigator.clipboard.writeText(this.qrCode.qrCode).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }

  downloadQRCode() {
    // Simulation de téléchargement - dans une vraie app, vous généreriez une image
    alert('Fonctionnalité de téléchargement à venir');
  }

  shareQRCode() {
    if (navigator.share) {
      navigator.share({
        title: 'Mon QR Code SPaye',
        text: `Scannez ce code pour m'envoyer de l'argent: ${this.qrCode?.qrCode}`,
      }).catch(() => {});
    } else {
      this.copyQRCode();
    }
  }

  getExpirationTime(): string {
    if (!this.qrCode?.expiresAt) return '';
    
    const now = new Date();
    const exp = new Date(this.qrCode.expiresAt);
    const diffMs = exp.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Expire dans moins d\'une minute';
    if (diffMins < 60) return `Expire dans ${diffMins} minutes`;
    return `Expire dans ${Math.floor(diffMins / 60)} heures`;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  goBack() {
    this.router.navigate(['/wallet']);
  }
}