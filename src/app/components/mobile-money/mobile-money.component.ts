import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider'; // AJOUTER CET IMPORT

@Component({
  selector: 'app-mobile-money',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule // AJOUTER ICI
  ],
  templateUrl: './mobile-money.component.html',
  styleUrls: ['./mobile-money.component.css']
})
export class MobileMoneyComponent {
  mobileMoneyForm: FormGroup;
  operators = [
    { id: 'airtel', name: 'Airtel Money', icon: 'phone_android', color: '#e60000', code: '032', prefix: '032' },
    { id: 'orange', name: 'Orange Money', icon: 'phone_android', color: '#ff7900', code: '034', prefix: '034' },
    { id: 'mvola', name: 'MVola', icon: 'phone_android', color: '#e91e63', code: '034', prefix: '034' }
  ];
  selectedOperator: any = null;
  step = 1;
  balance = 0;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Récupérer le solde de l'utilisateur connecté
    const user = this.authService.getCurrentUser();
    this.balance = user?.balance || 0;

    this.mobileMoneyForm = this.fb.group({
      operator: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{9,10}$')]],
      amount: ['', [Validators.required, Validators.min(500), Validators.max(this.balance)]]
    });

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

  selectOperator(operator: any): void {
    this.selectedOperator = operator;
    this.mobileMoneyForm.patchValue({ operator: operator.id });
    this.mobileMoneyForm.get('phoneNumber')?.setValue(operator.prefix);
    this.step = 2;
  }

  goToStep3(): void {
    if (this.mobileMoneyForm.get('phoneNumber')?.valid && 
        this.mobileMoneyForm.get('amount')?.valid) {
      this.step = 3;
    }
  }

  processTransfer(): void {
    if (this.mobileMoneyForm.invalid) return;

    const amount = this.mobileMoneyForm.value.amount;
    
    if (amount > this.balance) {
      this.notificationService.showError('Solde insuffisant!');
      return;
    }

    const transferData = {
      operator: this.selectedOperator.id,
      phoneNumber: this.mobileMoneyForm.value.phoneNumber,
      amount: amount
    };

    this.transactionService.mobileMoneyTransfer(transferData).subscribe({
      next: (response) => {
        this.notificationService.showSuccess(`Transfert de ${amount} Ar vers ${this.selectedOperator.name} effectué avec succès!`);
        this.router.navigate(['/user']);
      },
      error: (error) => {
        console.error('Erreur transfert:', error);
      }
    });
  }

  goBack(): void {
    if (this.step > 1) {
      this.step--;
    } else {
      this.router.navigate(['/user']);
    }
  }

  resetForm(): void {
    this.step = 1;
    this.selectedOperator = null;
    this.mobileMoneyForm.reset();
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  }
}