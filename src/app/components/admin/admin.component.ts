// frontend/src/app/components/admin/admin.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { BaseComponent } from '../base.component';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    TranslatePipe,
    CommonModule,
    RouterModule,
    SidebarComponent,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    <app-sidebar>
      <div class="admin-content">
        <div *ngIf="isSuperAdmin" class="admin-actions">
          <button mat-raised-button color="primary" (click)="navigateToDeposit()" matTooltip="Déposer sur un administrateur">
            <mat-icon>account_balance_wallet</mat-icon>
            Dépôt Admin
          </button>
          <button mat-raised-button color="primary" (click)="navigateToWithdraw()" matTooltip="Retirer sur un administrateur">
            <mat-icon>account_balance_wallet</mat-icon>
            Retrait Admin
          </button>
        </div>
        <router-outlet></router-outlet>
      </div>
    </app-sidebar>
  `,
  styles: [
    `
      .admin-content {
        padding: 28px 24px;
        max-width: 1400px;
        margin: 0 auto;
        animation: fadeUp 0.4s var(--ease) both;
      }

      .admin-actions {
        display: flex;
        justify-content: flex-end;
        padding: 0 0 16px 0;
        gap: 12px;
        flex-wrap: wrap;
      }

      .admin-actions button {
        border-radius: var(--r-pill) !important;
        font-weight: 600 !important;
        background: var(--brand-grad) !important;
        color: white !important;
      }

      .admin-actions button:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-brand) !important;
      }

      @media (max-width: 768px) {
        .admin-content {
          padding: 16px 14px;
        }
        .admin-actions {
          justify-content: center;
        }
        .admin-actions button {
          width: 100%;
        }
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class AdminComponent extends BaseComponent implements OnInit, OnDestroy {
  admin: User | null = null;
  isSuperAdmin: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    super();
  }

  override ngOnInit(): void {
    console.log('🔄 AdminComponent initialisé');

    const user = this.authService.getCurrentUser();

    if (!user) {
      console.log('❌ Aucun utilisateur, redirection vers login');
      this.router.navigate(['/login']);
      return;
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      console.log('❌ Pas admin, redirection vers user');
      this.router.navigate(['/user/dashboard']);
      return;
    }

    this.admin = user;
    this.isSuperAdmin = user.role === 'super_admin';
    console.log('✅ Admin chargé:', user.email, 'Rôle:', user.role);

    this.subscriptions.push(
      this.authService.currentUser.subscribe((user) => {
        if (user) {
          this.admin = user;
          this.isSuperAdmin = user.role === 'super_admin';
        }
      })
    );
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  logout(): void {
    this.authService.logout();
  }

  navigateToDeposit(): void {
    this.router.navigate(['/admin/deposit'], { queryParams: { target: 'admin' } });
  }

  navigateToWithdraw(): void {
    this.router.navigate(['/admin/withdraw'], { queryParams: { target: 'admin' } });
  }
}