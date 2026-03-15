import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

// Interface pour les opérateurs
interface Operator {
  id: 'airtel' | 'orange' | 'mvola';
  name: string;
  icon: string;
  color: string;
  code: string;
  prefix: string;
  gradient: string;
}

// Interface pour les frais
interface Fees {
  airtel: number;
  orange: number;
  mvola: number;
}

@Component({
  selector: 'app-mobile-money',
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
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDividerModule
  ],
  templateUrl: './mobile-money.component.html',
  styleUrls: ['./mobile-money.component.css'],
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
export class MobileMoneyComponent implements OnInit, OnDestroy {
  // État
  currentStep: 'operator' | 'amount' | 'confirmation' | 'success' = 'operator';
  selectedOperator: Operator | null = null;
  balance: number = 0;
  isProcessing: boolean = false;
  
  // Formulaire
  mobileMoneyForm: FormGroup;
  
  // Opérateurs disponibles (typés)
  operators: Operator[] = [
    { 
      id: 'airtel', 
      name: 'Airtel Money', 
      icon: 'phone_android', 
      color: '#e60000', 
      code: '033',
      prefix: '033',
      gradient: 'linear-gradient(135deg, #e60000, #b30000)'
    },
    { 
      id: 'orange', 
      name: 'Orange Money', 
      icon: 'phone_android', 
      color: '#ff7900', 
      code: '032',
      prefix: '032',
      gradient: 'linear-gradient(135deg, #ff7900, #cc6100)'
    },
    { 
      id: 'mvola', 
      name: 'MVola', 
      icon: 'phone_android', 
      color: '#e91e63', 
      code: '034',
      prefix: '034',
      gradient: 'linear-gradient(135deg, #e91e63, #c2185b)'
    }
  ];

  // Montants rapides
  quickAmounts = [5000, 10000, 20000, 50000, 100000];

  // Frais (typés)
  fees: Fees = {
    airtel: 0.5,
    orange: 0.5,
    mvola: 0.5
  };

  private scanInterval: any;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.mobileMoneyForm = this.fb.group({
      operator: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{9,10}$')]],
      amount: ['', [Validators.required, Validators.min(500)]]
    });
  }

  ngOnInit() {
    this.loadBalance();
    this.setupFormListeners();
  }

  ngOnDestroy() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }
  }

  /**
   * Charger le solde
   */
  loadBalance() {
    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.balance = wallet.balance;
      },
      error: (err) => {
        console.error('Erreur chargement solde:', err);
      }
    });
  }

  /**
   * Configurer les écouteurs du formulaire
   */
  setupFormListeners() {
    // Mettre à jour le préfixe quand l'opérateur change
    this.mobileMoneyForm.get('operator')?.valueChanges.subscribe(operatorId => {
      const operator = this.operators.find(op => op.id === operatorId);
      if (operator) {
        this.selectedOperator = operator;
        const currentPhone = this.mobileMoneyForm.get('phoneNumber')?.value || '';
        if (!currentPhone.startsWith(operator.prefix)) {
          this.mobileMoneyForm.get('phoneNumber')?.setValue(operator.prefix);
        }
      }
    });
  }

  /**
   * Sélectionner un opérateur
   */
  selectOperator(operator: Operator) {
    this.selectedOperator = operator;
    this.mobileMoneyForm.patchValue({ operator: operator.id });
    this.mobileMoneyForm.get('phoneNumber')?.setValue(operator.prefix);
    this.currentStep = 'amount';
  }

  /**
   * Aller à l'étape de confirmation
   */
  goToConfirmation() {
    if (this.mobileMoneyForm.get('phoneNumber')?.valid && 
        this.mobileMoneyForm.get('amount')?.valid) {
      
      // Vérifier le solde
      const amount = this.mobileMoneyForm.get('amount')?.value;
      if (amount > this.balance) {
        this.notificationService.showError('Solde insuffisant!');
        return;
      }
      
      this.currentStep = 'confirmation';
    }
  }

  /**
   * Effectuer le transfert
   */
  processTransfer() {
    if (this.mobileMoneyForm.invalid || !this.selectedOperator) return;

    this.isProcessing = true;
    
    const amount = this.mobileMoneyForm.value.amount;
    const operator = this.selectedOperator;
    const phoneNumber = this.mobileMoneyForm.value.phoneNumber;
    
    this.transactionService.mobileMoneyTransfer({
      operator: operator.id,
      phoneNumber: phoneNumber,
      amount: amount
    }).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.currentStep = 'success';
        
        // Mettre à jour le solde
        this.balance -= this.calculateTotal();
        
        this.notificationService.showSuccess(
          `Transfert de ${this.formatAmount(amount)} Ar vers ${operator.name} effectué avec succès!`
        );
        
        // Redirection après succès
        setTimeout(() => {
          this.router.navigate(['/wallet']);
        }, 3000);
      },
      error: (error) => {
        console.error('Erreur transfert:', error);
        this.notificationService.showError('Erreur lors du transfert');
        this.isProcessing = false;
      }
    });
  }

  /**
   * Réinitialiser le formulaire
   */
  resetForm() {
    this.currentStep = 'operator';
    this.selectedOperator = null;
    this.mobileMoneyForm.reset();
    this.isProcessing = false;
  }

  /**
   * Revenir à l'étape précédente
   */
  goBack() {
    if (this.currentStep === 'amount') {
      this.currentStep = 'operator';
    } else if (this.currentStep === 'confirmation') {
      this.currentStep = 'amount';
    } else if (this.currentStep === 'success') {
      this.router.navigate(['/wallet']);
    } else {
      this.router.navigate(['/wallet']);
    }
  }

  /**
   * Formater le montant
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  /**
   * Calculer les frais - VERSION SÉCURISÉE
   */
  calculateFee(): number {
    if (!this.selectedOperator || !this.mobileMoneyForm.get('amount')?.value) return 0;
    
    const amount = this.mobileMoneyForm.get('amount')?.value;
    const operatorId = this.selectedOperator.id;
    
    // Utilisation d'une approche sécurisée avec un objet indexé
    const feePercentage = this.getFeeForOperator(operatorId);
    return (amount * feePercentage) / 100;
  }

  /**
   * Obtenir le pourcentage de frais pour un opérateur - MÉTHODE DE SÉCURITÉ
   */
  getFeeForOperator(operatorId: string): number {
    switch(operatorId) {
      case 'airtel': return this.fees.airtel;
      case 'orange': return this.fees.orange;
      case 'mvola': return this.fees.mvola;
      default: return 0;
    }
  }

  /**
   * Obtenir le pourcentage de frais pour l'opérateur sélectionné (pour le template)
   */
  get currentFeePercentage(): number {
    if (!this.selectedOperator) return 0;
    return this.getFeeForOperator(this.selectedOperator.id);
  }

  /**
   * Calculer le montant total
   */
  calculateTotal(): number {
    const amount = this.mobileMoneyForm.get('amount')?.value || 0;
    return amount + this.calculateFee();
  }

  /**
   * Vérifier si le solde est suffisant
   */
  isBalanceSufficient(): boolean {
    return this.calculateTotal() <= this.balance;
  }

  /**
   * Obtenir la couleur de l'opérateur
   */
  getOperatorColor(operatorId: string): string {
    const operator = this.operators.find(op => op.id === operatorId);
    return operator?.color || '#667eea';
  }

  /**
   * Obtenir le message d'erreur du téléphone
   */
  getPhoneNumberError(): string {
    const control = this.mobileMoneyForm.get('phoneNumber');
    if (control?.hasError('required')) return 'Numéro requis';
    if (control?.hasError('pattern')) return 'Format invalide (9-10 chiffres)';
    return '';
  }

  /**
   * Obtenir le message d'erreur du montant
   */
  getAmountError(): string {
    const control = this.mobileMoneyForm.get('amount');
    if (control?.hasError('required')) return 'Montant requis';
    if (control?.hasError('min')) return 'Minimum 500 Ar';
    return '';
  }
}