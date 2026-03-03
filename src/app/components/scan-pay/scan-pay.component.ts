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
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-scan-pay',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './scan-pay.component.html',
  styleUrls: ['./scan-pay.component.css']
})
export class ScanPayComponent {
  isScanning = true;
  showPaymentForm = false;
  scannedUser: any = null;
  paymentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private router: Router
  ) {
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(100)]],
      description: ['']
    });
  }

  simulateScan() {
    // Simuler un scan réussi
    this.scannedUser = {
      firstName: 'Marie',
      lastName: 'Rabe',
      phoneNumber: '0347654321'
    };
    this.isScanning = false;
    this.showPaymentForm = true;
  }

  processPayment() {
    if (this.paymentForm.valid) {
      alert(`Paiement de ${this.paymentForm.value.amount} Ar à ${this.scannedUser.firstName} effectué avec succès!`);
      this.router.navigate(['/dashboard']);
    }
  }

  resetScanner() {
    this.isScanning = true;
    this.showPaymentForm = false;
    this.scannedUser = null;
    this.paymentForm.reset();
  }
}