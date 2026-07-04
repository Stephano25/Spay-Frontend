// frontend/src/app/components/scan-pay/scan-pay.component.ts
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';

// Services
import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';
import { WalletService } from '../../services/wallet.service';
import { AdminService } from '../../services/admin.service';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-scan-pay',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './scan-pay.component.html',
  styleUrls: ['./scan-pay.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideInUp', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('0.6s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ transform: 'translateX(-30px)', opacity: 0 }),
        animate('0.5s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('slideInRight', [
      transition(':enter', [
        style({ transform: 'translateX(30px)', opacity: 0 }),
        animate('0.5s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate('0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ]),
    trigger('pulse', [
      transition(':enter', [
        style({ transform: 'scale(1)' }),
        animate('2s ease-in-out', keyframes([
          style({ transform: 'scale(1)', offset: 0 }),
          style({ transform: 'scale(1.05)', offset: 0.5 }),
          style({ transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ]),
    trigger('shake', [
      transition('* => *', [
        animate('0.5s ease-in-out', keyframes([
          style({ transform: 'translateX(-5px)', offset: 0.25 }),
          style({ transform: 'translateX(5px)', offset: 0.75 }),
          style({ transform: 'translateX(0)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class ScanPayComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef;
  
  isScanning = true;
  showPaymentForm = false;
  scannedData: any = null;
  paymentForm: FormGroup;
  isProcessing = false;
  hasCamera = false;
  cameraError = false;
  cameraPermissionDenied = false;
  scanLinePosition = 0;
  private scanInterval: any;
  
  // ✅ Type de scan (deposit, withdraw, payment)
  scanType: 'deposit' | 'withdraw' | 'payment' = 'payment';

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private walletService: WalletService,
    private adminService: AdminService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(100)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    // ✅ Récupérer le type de scan depuis les queryParams
    this.route.queryParams.subscribe(params => {
      if (params['type'] === 'deposit') {
        this.scanType = 'deposit';
        this.isScanning = true;
      } else if (params['type'] === 'withdraw') {
        this.scanType = 'withdraw';
        this.isScanning = true;
      } else {
        this.scanType = 'payment';
        this.isScanning = true;
      }
    });
  }

  ngAfterViewInit() {
    this.checkCameraAvailability();
    this.startScanAnimation();
  }

  ngOnDestroy() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }
    if (this.videoElement && this.videoElement.nativeElement && this.videoElement.nativeElement.srcObject) {
      const stream = this.videoElement.nativeElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track: any) => track.stop());
    }
  }

  startScanAnimation() {
    this.scanInterval = setInterval(() => {
      this.scanLinePosition = this.scanLinePosition === 0 ? 100 : 0;
    }, 2000);
  }

  checkCameraAvailability() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          this.hasCamera = true;
          this.cameraError = false;
          this.cameraPermissionDenied = false;
          this.startCamera(stream);
        })
        .catch((err) => {
          console.error('❌ Caméra non disponible:', err);
          this.hasCamera = false;
          
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            this.cameraPermissionDenied = true;
            this.cameraError = false;
          } else {
            this.cameraError = true;
            this.cameraPermissionDenied = false;
          }
        });
    } else {
      this.hasCamera = false;
      this.cameraError = true;
      this.cameraPermissionDenied = false;
    }
  }

  startCamera(stream: MediaStream) {
    if (this.videoElement && this.videoElement.nativeElement) {
      this.videoElement.nativeElement.srcObject = stream;
      this.videoElement.nativeElement.play();
    }
  }

  requestCameraPermission() {
    this.cameraPermissionDenied = false;
    this.checkCameraAvailability();
  }

  // ✅ Simulation de scan avec type
  simulateScan() {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // QR Code simulé avec le type approprié
    this.scannedData = {
      type: 'admin_transaction',
      action: this.scanType === 'deposit' ? 'deposit' : this.scanType === 'withdraw' ? 'withdraw' : 'payment',
      qrCode: 'SPAYE-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      adminId: 'admin-123',
      adminName: 'Administrateur SPaye',
      amount: this.scanType === 'payment' ? 5000 : null,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      signature: 'abc123'
    };
    
    setTimeout(() => {
      this.isScanning = false;
      this.showPaymentForm = true;
      
      if (this.scannedData.amount) {
        this.paymentForm.patchValue({ amount: this.scannedData.amount });
      }
      
      const actionLabel = this.scanType === 'deposit' ? 'Dépôt' : this.scanType === 'withdraw' ? 'Retrait' : 'Paiement';
      this.notificationService.showSuccess(`QR code ${actionLabel} scanné avec succès`);
    }, 500);
  }

  // ✅ Traitement du scan réel
  onScanSuccess(result: string) {
    try {
      this.scannedData = JSON.parse(result);
      
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      
      this.isScanning = false;
      this.showPaymentForm = true;
      
      if (this.scannedData.amount) {
        this.paymentForm.patchValue({ amount: this.scannedData.amount });
      }
      
      const actionLabel = this.scanType === 'deposit' ? 'Dépôt' : this.scanType === 'withdraw' ? 'Retrait' : 'Paiement';
      this.notificationService.showSuccess(`QR code ${actionLabel} scanné avec succès`);
    } catch (e) {
      console.error('❌ QR code invalide:', e);
      this.notificationService.showError('QR code invalide');
    }
  }

  // ✅ Traitement du paiement/scan - Version corrigée
  processPayment() {
    if (this.paymentForm.invalid) return;

    this.isProcessing = true;
    const amount = this.paymentForm.value.amount;
    
    // ✅ Vérifier le solde avec checkBalance() corrigé
    this.walletService.checkBalance().subscribe({
      next: (balance) => {
        if (balance < amount && this.scanType !== 'deposit') {
          this.notificationService.showError('Solde insuffisant');
          this.isProcessing = false;
          return;
        }
        
        // Effectuer l'opération selon le type
        if (this.scanType === 'deposit') {
          this.handleDeposit(amount);
        } else if (this.scanType === 'withdraw') {
          this.handleWithdraw(amount);
        } else {
          this.handlePayment(amount);
        }
      },
      error: (error) => {
        console.error('❌ Erreur vérification solde:', error);
        this.notificationService.showError('Erreur lors de la vérification du solde');
        this.isProcessing = false;
      }
    });
  }

  // ✅ Gestion du dépôt
  private handleDeposit(amount: number): void {
    // Vérifier que le QR code est valide pour un dépôt
    if (this.scannedData?.action !== 'deposit') {
      this.notificationService.showError('QR Code invalide pour un dépôt');
      this.isProcessing = false;
      return;
    }

    this.adminService.scanQRCode(JSON.stringify(this.scannedData)).subscribe({
      next: (result) => {
        if (result.valid && result.action === 'deposit') {
          // Le dépôt est validé par l'admin
          this.notificationService.showSuccess(
            `Dépôt de ${this.formatAmount(amount)} Ar effectué avec succès!`
          );
          setTimeout(() => {
            this.router.navigate(['/user/wallet']);
          }, 2000);
        } else {
          this.notificationService.showError('QR Code invalide pour un dépôt');
        }
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('❌ Erreur scan QR:', error);
        this.notificationService.showError('QR Code invalide ou expiré');
        this.isProcessing = false;
      }
    });
  }

  // ✅ Gestion du retrait
  private handleWithdraw(amount: number): void {
    if (this.scannedData?.action !== 'withdraw') {
      this.notificationService.showError('QR Code invalide pour un retrait');
      this.isProcessing = false;
      return;
    }

    this.adminService.scanQRCode(JSON.stringify(this.scannedData)).subscribe({
      next: (result) => {
        if (result.valid && result.action === 'withdraw') {
          this.notificationService.showSuccess(
            `Retrait de ${this.formatAmount(amount)} Ar effectué avec succès!`
          );
          setTimeout(() => {
            this.router.navigate(['/user/wallet']);
          }, 2000);
        } else {
          this.notificationService.showError('QR Code invalide pour un retrait');
        }
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('❌ Erreur scan QR:', error);
        this.notificationService.showError('QR Code invalide ou expiré');
        this.isProcessing = false;
      }
    });
  }

  // ✅ Gestion du paiement standard
  private handlePayment(amount: number): void {
    this.transactionService.scanAndPay({
      receiverQrCode: this.scannedData?.qrCode || '',
      amount: amount,
      description: this.paymentForm.value.description || 'Paiement par scan'
    }).subscribe({
      next: (result) => {
        this.notificationService.showSuccess(
          `Paiement de ${this.formatAmount(amount)} Ar effectué avec succès!`
        );
        setTimeout(() => {
          this.router.navigate(['/user/wallet']);
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Erreur paiement:', error);
        this.notificationService.showError('Erreur lors du paiement');
        this.isProcessing = false;
      }
    });
  }

  resetScanner() {
    this.isScanning = true;
    this.showPaymentForm = false;
    this.scannedData = null;
    this.paymentForm.reset();
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  getAmountIcon(amount: number): string {
    if (amount >= 100000) return 'rocket_launch';
    if (amount >= 50000) return 'star';
    if (amount >= 10000) return 'trending_up';
    return 'attach_money';
  }

  getScanTypeLabel(): string {
    switch(this.scanType) {
      case 'deposit': return 'Dépôt';
      case 'withdraw': return 'Retrait';
      default: return 'Paiement';
    }
  }

  goBack() {
    if (this.videoElement && this.videoElement.nativeElement && this.videoElement.nativeElement.srcObject) {
      const stream = this.videoElement.nativeElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track: any) => track.stop());
    }
    this.router.navigate(['/user/dashboard']);
  }
}