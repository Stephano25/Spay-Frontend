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
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
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

    // ✅ S'abonner aux changements de langue
    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log(`🌐 AdminComponent: Langue changée en ${lang}`);
        this.cdr.detectChanges();
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