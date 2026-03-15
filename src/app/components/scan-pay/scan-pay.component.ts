import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';

// Services
import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';
import { WalletService } from '../../services/wallet.service';

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
  templateUrl: './scan-pay.component.html', // CORRIGÉ: Référence au bon fichier
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
    ])
  ]
})
export class ScanPayComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef;
  
  isScanning = true;
  showPaymentForm = false;
  scannedData: any = null;
  paymentForm: FormGroup;
  isProcessing = false;
  hasCamera = false;
  cameraError = false;
  scanLinePosition = 0;
  private scanInterval: any;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(100)]],
      description: ['']
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
    // Arrêter la caméra
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

  /**
   * Vérifier si la caméra est disponible
   */
  checkCameraAvailability() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          this.hasCamera = true;
          this.startCamera(stream);
        })
        .catch((err) => {
          console.error('❌ Caméra non disponible:', err);
          this.hasCamera = false;
          this.cameraError = true;
        });
    } else {
      this.hasCamera = false;
      this.cameraError = true;
    }
  }

  /**
   * Démarrer la caméra
   */
  startCamera(stream: MediaStream) {
    if (this.videoElement && this.videoElement.nativeElement) {
      this.videoElement.nativeElement.srcObject = stream;
      this.videoElement.nativeElement.play();
    }
  }

  /**
   * Simulation de scan (pour le développement)
   */
  simulateScan() {
    // Effet de vibration
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Simuler un QR code valide
    this.scannedData = {
      type: 'payment',
      qrCode: 'SPAYE-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      amount: 5000,
      userId: 'test-user-id'
    };
    
    setTimeout(() => {
      this.isScanning = false;
      this.showPaymentForm = true;
      
      if (this.scannedData.amount) {
        this.paymentForm.patchValue({ amount: this.scannedData.amount });
      }
      
      this.notificationService.showSuccess('QR code scanné avec succès');
    }, 500);
  }

  /**
   * Traiter le scan réel (à utiliser avec une bibliothèque de scan)
   */
  onScanSuccess(result: string) {
    try {
      this.scannedData = JSON.parse(result);
      
      // Effet de vibration
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      
      this.isScanning = false;
      this.showPaymentForm = true;
      
      if (this.scannedData.amount) {
        this.paymentForm.patchValue({ amount: this.scannedData.amount });
      }
      
      this.notificationService.showSuccess('QR code scanné avec succès');
    } catch (e) {
      console.error('❌ QR code invalide:', e);
      this.notificationService.showError('QR code invalide');
    }
  }

  /**
   * Traiter le paiement
   */
  processPayment() {
    if (this.paymentForm.invalid) return;

    this.isProcessing = true;
    
    // Vérifier le solde
    this.walletService.checkBalance().subscribe({
      next: (balance) => {
        const amount = this.paymentForm.value.amount;
        
        if (balance < amount) {
          this.notificationService.showError('Solde insuffisant');
          this.isProcessing = false;
          return;
        }
        
        // Effectuer le paiement
        this.transactionService.scanAndPay({
          receiverQrCode: this.scannedData?.qrCode || '',
          amount: amount,
          description: this.paymentForm.value.description || 'Paiement par scan'
        }).subscribe({
          next: (result) => {
            this.notificationService.showSuccess(
              `Paiement de ${this.formatAmount(amount)} Ar effectué avec succès!`
            );
            
            // Animation de succès
            setTimeout(() => {
              this.router.navigate(['/wallet']);
            }, 2000);
          },
          error: (error) => {
            console.error('❌ Erreur paiement:', error);
            this.notificationService.showError('Erreur lors du paiement');
            this.isProcessing = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ Erreur vérification solde:', error);
        this.notificationService.showError('Erreur lors de la vérification du solde');
        this.isProcessing = false;
      }
    });
  }

  /**
   * Réinitialiser le scanner
   */
  resetScanner() {
    this.isScanning = true;
    this.showPaymentForm = false;
    this.scannedData = null;
    this.paymentForm.reset();
  }

  /**
   * Formater le montant
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  /**
   * Obtenir l'icône en fonction du montant
   */
  getAmountIcon(amount: number): string {
    if (amount >= 100000) return 'rocket_launch';
    if (amount >= 50000) return 'star';
    if (amount >= 10000) return 'trending_up';
    return 'attach_money';
  }

  /**
   * Retour
   */
  goBack() {
    if (this.videoElement && this.videoElement.nativeElement && this.videoElement.nativeElement.srcObject) {
      const stream = this.videoElement.nativeElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track: any) => track.stop());
    }
    this.router.navigate(['/wallet']);
  }
}