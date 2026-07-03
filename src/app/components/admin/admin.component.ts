import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <app-sidebar>
      <div class="admin-content">
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

      @media (max-width: 768px) {
        .admin-content {
          padding: 16px 14px;
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
export class AdminComponent implements OnInit, OnDestroy {
  admin: User | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
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
    console.log('✅ Admin chargé:', user.email, 'Rôle:', user.role);

    this.subscriptions.push(
      this.authService.currentUser.subscribe((user) => {
        if (user) {
          this.admin = user;
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  logout(): void {
    this.authService.logout();
  }
}