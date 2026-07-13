// frontend/src/app/components/admin/admins/admin-create/admin-create.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AdminService } from '../../../../services/admin.service';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../services/auth.service';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { BaseComponent } from 'src/app/components/base.component';
@Component({
  selector: 'app-admin-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatToolbarModule,
    TranslatePipe
  ],
  templateUrl: './admin-create.component.html',
  styleUrls: ['./admin-create.component.css'],
})
export class AdminCreateComponent extends BaseComponent implements OnInit {
  adminForm!: FormGroup;
  isSubmitting = false;
  hidePassword = true;
  hideConfirmPassword = true;
  isSuperAdmin = false;
  qrCodeGenerated = false;
  qrCodeImage: string | null = null;
  isGeneratingQR = false;

  // ✅ Liste des rôles avec icônes et descriptions
  roles = [
    { 
      value: 'admin', 
      label: 'Administrateur', 
      icon: 'admin_panel_settings',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      description: 'Accès limité : dépôt et retrait'
    },
    { 
      value: 'super_admin', 
      label: 'Super Administrateur', 
      icon: 'supervisor_account',
      color: '#7c3aed',
      bgColor: 'rgba(124, 58, 237, 0.12)',
      description: 'Accès complet à toutes les fonctionnalités'
    },
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) { super ();}

  override ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isSuperAdmin = user?.role === 'super_admin';

    if (!this.isSuperAdmin) {
      this.notificationService.showError('Seul un Super Admin peut créer des administrateurs');
      this.router.navigate(['/admin/admins']);
      return;
    }

    this.initForm();
  }

  initForm(): void {
    this.adminForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^[0-9]{9,10}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      role: ['admin', [Validators.required]],
      isActive: [true],
      reference: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    }, {
      validators: this.passwordMatchValidator,
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get f() { return this.adminForm.controls; }

  // ============================================================
  // MÉTHODES POUR LES RÔLES
  // ============================================================

  getRoleLabel(roleValue: string): string {
    const role = this.roles.find(r => r.value === roleValue);
    return role?.label || roleValue || 'Non défini';
  }

  getRoleIcon(roleValue: string): string {
    const role = this.roles.find(r => r.value === roleValue);
    return role?.icon || 'admin_panel_settings';
  }

  getRoleStyle(roleValue: string): { color: string; backgroundColor: string } {
    const role = this.roles.find(r => r.value === roleValue);
    return {
      color: role?.color || '#7c3aed',
      backgroundColor: role?.bgColor || 'rgba(124, 58, 237, 0.12)'
    };
  }

  getRoleDescription(roleValue: string): string {
    const role = this.roles.find(r => r.value === roleValue);
    return role?.description || '';
  }

  // ============================================================
  // QR CODE
  // ============================================================

  generateQRCode(): void {
    if (!this.adminForm.valid) {
      this.notificationService.showError('Veuillez remplir tous les champs requis avant de générer le QR Code');
      return;
    }

    this.isGeneratingQR = true;

    this.adminService.generateQRCode('deposit').subscribe({
      next: (response) => {
        this.qrCodeImage = response.qrCodeImage;
        this.qrCodeGenerated = true;
        this.isGeneratingQR = false;
        this.notificationService.showSuccess('QR Code généré avec succès');
      },
      error: (error) => {
        console.error('Erreur génération QR:', error);
        this.isGeneratingQR = false;
        this.notificationService.showError('Erreur lors de la génération du QR Code');
      },
    });
  }

  // ============================================================
  // SOUMISSION
  // ============================================================

  onSubmit(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      const firstError = document.querySelector('.mat-form-field-invalid');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!this.qrCodeGenerated) {
      this.notificationService.showWarning('Veuillez générer le QR Code avant de créer l\'administrateur');
      return;
    }

    this.isSubmitting = true;
    const formData = { 
      ...this.adminForm.value,
      qrCode: this.qrCodeImage 
    };
    delete formData.confirmPassword;

    this.adminService.createAdmin(formData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Administrateur créé avec succès');
        this.isSubmitting = false;
        this.router.navigate(['/admin/admins']);
      },
      error: (error: any) => {
        console.error('Erreur création admin:', error);
        this.notificationService.showError(error.error?.message || 'Erreur lors de la création');
        this.isSubmitting = false;
      },
    });
  }

  // ============================================================
  // FORCE DU MOT DE PASSE
  // ============================================================

  getPasswordStrength(password: string): { label: string; color: string; width: number } {
    if (!password) return { label: 'Très faible', color: '#ef4444', width: 10 };
    
    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;

    if (score < 40) return { label: 'Très faible', color: '#ef4444', width: score };
    if (score < 60) return { label: 'Faible', color: '#f59e0b', width: score };
    if (score < 80) return { label: 'Bon', color: '#3b82f6', width: score };
    if (score < 100) return { label: 'Fort', color: '#10b981', width: score };
    return { label: 'Très fort', color: '#10b981', width: score };
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  goBack(): void {
    this.router.navigate(['/admin/admins']);
  }

  cancel(): void {
    if (this.adminForm.dirty) {
      if (confirm('Êtes-vous sûr de vouloir annuler ? Les données non sauvegardées seront perdues.')) {
        this.goBack();
      }
    } else {
      this.goBack();
    }
  }
}