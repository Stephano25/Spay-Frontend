import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatRippleModule } from '@angular/material/core';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { BaseComponent } from 'src/app/components/base.component';

@Component({
  selector: 'app-admin-admins',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatToolbarModule,
    MatRippleModule,
    TranslatePipe
  ],
  templateUrl: './admin-admins.component.html',
  styleUrls: ['./admin-admins.component.css'],
})
export class AdminAdminsComponent extends BaseComponent implements OnInit {
  admins: any[] = [];
  isLoading = true;
  currentAdminId: string = '';
  isSuperAdmin = false;
  
  stats: any = {
    totalUsers: 0,
    totalTransactions: 0,
    totalAdmins: 0,
  };

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    super();
  }

  override ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentAdminId = user?.id || '';
    this.isSuperAdmin = user?.role === 'super_admin';
    
    if (!this.isSuperAdmin) {
      this.notificationService.showError('Accès réservé aux Super Administrateurs');
      this.router.navigate(['/admin/dashboard']);
      return;
    }
    
    this.loadAdmins();
    this.loadStats();
  }

  loadAdmins(): void {
    this.isLoading = true;
    this.adminService.getAdmins().subscribe({
      next: (admins) => {
        this.admins = admins;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement admins:', error);
        this.notificationService.showError('Erreur lors du chargement');
        this.isLoading = false;
      },
    });
  }

  loadStats(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: () => {
        // Garder les valeurs par défaut
      },
    });
  }

  toggleAdminStatus(admin: any): void {
    this.adminService.updateUserStatus(admin.id, !admin.isActive).subscribe({
      next: () => {
        admin.isActive = !admin.isActive;
        this.notificationService.showSuccess(`Admin ${admin.isActive ? 'activé' : 'désactivé'}`);
      },
      error: (error) => {
        this.notificationService.showError('Erreur lors de la mise à jour');
      },
    });
  }

  deleteAdmin(admin: any): void {
    if (admin.id === this.currentAdminId) {
      this.notificationService.showWarning('Vous ne pouvez pas vous supprimer vous-même');
      return;
    }

    if (confirm(`Voulez-vous vraiment supprimer ${admin.firstName} ${admin.lastName} ?`)) {
      this.adminService.deleteAdmin(admin.id).subscribe({
        next: () => {
          this.admins = this.admins.filter((a) => a.id !== admin.id);
          this.notificationService.showSuccess('Admin supprimé');
        },
        error: (error) => {
          this.notificationService.showError('Erreur lors de la suppression');
        },
      });
    }
  }

  // ✅ Navigation
  navigateTo(route: string): void {
    this.router.navigate([`/admin/${route}`]);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-MG').format(num || 0);
  }

  openQRScanner(type: 'deposit' | 'withdraw'): void {
    this.router.navigate(['/admin/dashboard'], { 
      queryParams: { openScanner: type } 
    });
  }

  getInitials(admin: any): string {
    return (admin.firstName?.charAt(0) || '') + (admin.lastName?.charAt(0) || '');
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  // ✅ Ouvrir le dépôt admin
  openAdminDeposit(): void {
    this.router.navigate(['/admin/deposit'], { queryParams: { target: 'admin' } });
  }

  // ✅ Ouvrir le retrait admin
  openAdminWithdraw(): void {
    this.router.navigate(['/admin/withdraw'], { queryParams: { target: 'admin' } });
  }

  // ✅ Déposer sur un admin spécifique
  depositToAdmin(admin: any): void {
    this.router.navigate(['/admin/deposit'], {
      queryParams: { adminId: admin.id, target: 'admin' }
    });
  }
}