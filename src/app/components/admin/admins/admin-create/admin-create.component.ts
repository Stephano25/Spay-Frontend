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
  ],
  templateUrl: './admin-create.component.html',
  styleUrls: ['./admin-create.component.css'],
})
export class AdminCreateComponent implements OnInit {
  adminForm!: FormGroup;
  isSubmitting = false;
  hidePassword = true;
  hideConfirmPassword = true;
  isSuperAdmin = false;

  // ✅ Liste des rôles avec icônes
  roles = [
    { value: 'admin', label: 'Administrateur', icon: 'admin_panel_settings' },
    { value: 'super_admin', label: 'Super Administrateur', icon: 'supervisor_account' },
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
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

  onSubmit(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      const firstError = document.querySelector('.mat-form-field-invalid');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    this.isSubmitting = true;
    const formData = { ...this.adminForm.value };
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