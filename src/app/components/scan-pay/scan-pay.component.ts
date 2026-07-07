// frontend/src/app/components/scan-pay/scan-pay.component.ts
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';

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
  
  // ✅ Type de scan (deposit, withdraw, payment)
  scanType: 'deposit' | 'withdraw' | 'payment' = 'payment';
  
  // ✅ QR Scanner
  private html5QrCode: Html5Qrcode | null = null;
  private isScanningQR = false;

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
    setTimeout(() => {
      this.startQRScanner();
    }, 500);
  }

  ngOnDestroy() {
    this.stopQRScanner();
  }

  // ============================================================
  // QR SCANNER
  // ============================================================

  async startQRScanner() {
    try {
      // ✅ Vérifier si la caméra est disponible
      const hasCamera = await this.checkCameraPermission();
      if (!hasCamera) {
        this.hasCamera = false;
        this.cameraError = true;
        return;
      }

      this.hasCamera = true;
      this.cameraError = false;
      this.cameraPermissionDenied = false;

      // ✅ Créer le scanner
      const scannerContainer = document.getElementById('qr-scanner-container');
      if (!scannerContainer) {
        console.error('Scanner container not found');
        return;
      }

      // ✅ Nettoyer le conteneur
      scannerContainer.innerHTML = '';

      const readerElement = document.createElement('div');
      readerElement.id = 'qr-reader';
      readerElement.style.width = '100%';
      readerElement.style.maxWidth = '400px';
      readerElement.style.margin = '0 auto';
      scannerContainer.appendChild(readerElement);

      this.html5QrCode = new Html5Qrcode('qr-reader');

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      this.isScanningQR = true;

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        config,
        this.onScanSuccess.bind(this),
        this.onScanError.bind(this)
      );

    } catch (error) {
      console.error('❌ Erreur démarrage scanner:', error);
      this.hasCamera = false;
      this.cameraError = true;
      this.notificationService.showError('Impossible d\'accéder à la caméra');
    }
  }

  async checkCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.cameraPermissionDenied = true;
      }
      return false;
    }
  }

  stopQRScanner() {
    if (this.html5QrCode && this.isScanningQR) {
      try {
        this.html5QrCode.stop().catch(() => {});
        this.html5QrCode = null;
        this.isScanningQR = false;
      } catch (error) {
        console.error('Erreur arrêt scanner:', error);
      }
    }
  }

  onScanSuccess(decodedText: string, decodedResult: any) {
    console.log('✅ QR Code scanné:', decodedText);
    
    // ✅ Vibrer si possible
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    this.stopQRScanner();
    this.processScannedData(decodedText);
  }

  onScanError(error: any) {
    // Ne pas afficher d'erreur pour chaque tentative
    // console.log('Erreur scan:', error);
  }

  requestCameraPermission() {
    this.cameraPermissionDenied = false;
    this.startQRScanner();
  }

  // ============================================================
  // SIMULATION DE SCAN (pour tests)
  // ============================================================

  simulateScan() {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // QR Code simulé
    const simulatedData = {
      type: 'admin_transaction',
      action: this.scanType === 'deposit' ? 'deposit' : this.scanType === 'withdraw' ? 'withdraw' : 'payment',
      qrCode: 'SPAYE-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      adminId: 'admin-123',
      adminName: 'Administrateur SPaye',
      amount: this.scanType === 'payment' ? 5000 : null,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      signature: 'simulated-' + Date.now()
    };

    this.processScannedData(JSON.stringify(simulatedData));
  }

  // ============================================================
  // TRAITEMENT DES DONNÉES SCANNEES
  // ============================================================

  processScannedData(data: string) {
    try {
      // ✅ Essayer de parser le JSON
      const parsed = JSON.parse(data);
      
      // ✅ Vérifier le type
      if (parsed.type === 'admin_transaction') {
        // ✅ Transaction admin (dépôt ou retrait)
        this.scannedData = parsed;
        
        // ✅ Vérifier l'expiration
        if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
          this.notificationService.showWarning('Ce QR Code a expiré');
          this.isScanning = true;
          this.startQRScanner();
          return;
        }

        // ✅ Vérifier l'action
        if (parsed.action === 'deposit' || parsed.action === 'withdraw') {
          this.scanType = parsed.action;
        }

        this.isScanning = false;
        this.showPaymentForm = true;
        
        if (parsed.amount) {
          this.paymentForm.patchValue({ amount: parsed.amount });
        }
        
        const actionLabel = this.scanType === 'deposit' ? 'Dépôt' : this.scanType === 'withdraw' ? 'Retrait' : 'Paiement';
        this.notificationService.showSuccess(`QR Code ${actionLabel} scanné avec succès`);
        
      } else if (parsed.type === 'payment' || parsed.type === 'payment_request') {
        // ✅ Paiement standard
        this.scannedData = parsed;
        this.isScanning = false;
        this.showPaymentForm = true;
        this.scanType = 'payment';
        
        if (parsed.amount) {
          this.paymentForm.patchValue({ amount: parsed.amount });
        }
        
        this.notificationService.showSuccess('QR Code scanné avec succès');
      } else {
        throw new Error('Type de QR Code non reconnu');
      }
      
    } catch (error) {
      console.error('❌ Erreur traitement QR:', error);
      this.notificationService.showError('QR Code invalide. Veuillez réessayer.');
      
      // ✅ Réessayer le scan
      setTimeout(() => {
        this.isScanning = true;
        this.startQRScanner();
      }, 1000);
    }
  }

  // ============================================================
  // PAIEMENT / DÉPÔT / RETRAIT
  // ============================================================

  processPayment() {
    if (this.paymentForm.invalid) {
      this.notificationService.showError('Veuillez remplir tous les champs');
      return;
    }

    this.isProcessing = true;
    const amount = this.paymentForm.value.amount;
    const description = this.paymentForm.value.description || '';

    // ✅ Vérifier le solde pour les paiements et retraits
    if (this.scanType !== 'deposit') {
      this.walletService.checkBalance().subscribe({
        next: (balance) => {
          if (balance < amount) {
            this.notificationService.showError('Solde insuffisant');
            this.isProcessing = false;
            return;
          }
          this.executeTransaction(amount, description);
        },
        error: (error) => {
          console.error('❌ Erreur vérification solde:', error);
          this.notificationService.showError('Erreur lors de la vérification du solde');
          this.isProcessing = false;
        }
      });
    } else {
      this.executeTransaction(amount, description);
    }
  }

  executeTransaction(amount: number, description: string) {
    const qrData = this.scannedData ? JSON.stringify(this.scannedData) : '';

    switch (this.scanType) {
      case 'deposit':
        this.handleDeposit(amount, description, qrData);
        break;
      case 'withdraw':
        this.handleWithdraw(amount, description, qrData);
        break;
      default:
        this.handlePayment(amount, description, qrData);
    }
  }

  // ✅ Gestion du dépôt
  private handleDeposit(amount: number, description: string, qrData: string) {
    // Vérifier que c'est un QR Code admin
    if (!this.scannedData?.adminId) {
      this.notificationService.showError('QR Code de dépôt invalide');
      this.isProcessing = false;
      return;
    }

    // Ici, le dépôt est fait par un admin via un QR Code admin
    // On simule la validation
    setTimeout(() => {
      this.notificationService.showSuccess(
        `💰 Dépôt de ${this.formatAmount(amount)} Ar effectué avec succès!`
      );
      this.isProcessing = false;
      this.resetScanner();
      this.router.navigate(['/user/wallet']);
    }, 1500);
  }

  // ✅ Gestion du retrait
  private handleWithdraw(amount: number, description: string, qrData: string) {
    if (!this.scannedData?.adminId) {
      this.notificationService.showError('QR Code de retrait invalide');
      this.isProcessing = false;
      return;
    }

    // Simuler le retrait
    setTimeout(() => {
      this.notificationService.showSuccess(
        `💰 Retrait de ${this.formatAmount(amount)} Ar effectué avec succès!`
      );
      this.isProcessing = false;
      this.resetScanner();
      this.router.navigate(['/user/wallet']);
    }, 1500);
  }

  // ✅ Gestion du paiement standard
  private handlePayment(amount: number, description: string, qrData: string) {
    const receiverQrCode = this.scannedData?.qrCode || this.scannedData?.receiverId || '';

    if (!receiverQrCode) {
      this.notificationService.showError('Destinataire non trouvé dans le QR Code');
      this.isProcessing = false;
      return;
    }

    this.transactionService.scanAndPay({
      receiverQrCode: receiverQrCode,
      amount: amount,
      description: description || 'Paiement par scan'
    }).subscribe({
      next: (result) => {
        this.notificationService.showSuccess(
          `💰 Paiement de ${this.formatAmount(amount)} Ar effectué avec succès!`
        );
        this.isProcessing = false;
        this.resetScanner();
        this.router.navigate(['/user/wallet']);
      },
      error: (error) => {
        console.error('❌ Erreur paiement:', error);
        this.notificationService.showError(error.error?.message || 'Erreur lors du paiement');
        this.isProcessing = false;
      }
    });
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  resetScanner() {
    this.isScanning = true;
    this.showPaymentForm = false;
    this.scannedData = null;
    this.paymentForm.reset();
    this.isProcessing = false;
    
    setTimeout(() => {
      this.startQRScanner();
    }, 500);
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
    this.stopQRScanner();
    this.router.navigate(['/user/dashboard']);
  }
}