import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
    MatDividerModule, // AJOUTER ICI
  ],
  templateUrl: './mobile-money.component.html',
  styleUrls: ['./mobile-money.component.css']
})
export class MobileMoneyComponent {
  mobileMoneyForm: FormGroup;
  operators = [
    { id: 'mvola', name: 'MVola', icon: 'phone_android', color: '#e91e63' },
    { id: 'airtel', name: 'Airtel Money', icon: 'phone_android', color: '#ff9800' },
    { id: 'orange', name: 'Orange Money', icon: 'phone_android', color: '#ff5722' },
    { id: 'telma', name: 'Telma Money', icon: 'phone_android', color: '#2196f3' }
  ];
  selectedOperator: any = null;
  step = 1;
  balance = 150000;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private router: Router
  ) {
    this.mobileMoneyForm = this.fb.group({
      operator: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{9,10}$')]],
      amount: ['', [Validators.required, Validators.min(500)]]
    });
  }

  selectOperator(operator: any): void {
    this.selectedOperator = operator;
    this.mobileMoneyForm.patchValue({ operator: operator.id });
    this.step = 2;
  }

  goToStep3(): void {
    if (this.mobileMoneyForm.get('phoneNumber')?.valid && 
        this.mobileMoneyForm.get('amount')?.valid) {
      this.step = 3;
    }
  }

  processTransfer(): void {
    const amount = this.mobileMoneyForm.value.amount;
    
    if (amount > this.balance) {
      alert('Solde insuffisant!');
      return;
    }

    alert(`Transfert de ${amount} Ar vers ${this.selectedOperator.name} ${this.mobileMoneyForm.value.phoneNumber} effectué avec succès!`);
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    if (this.step > 1) {
      this.step--;
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  resetForm(): void {
    this.step = 1;
    this.selectedOperator = null;
    this.mobileMoneyForm.reset();
  }
}