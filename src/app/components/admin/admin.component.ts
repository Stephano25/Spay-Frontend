// frontend/src/app/components/admin/admin.component.ts
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
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit, OnDestroy {
  admin: User | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    console.log('🔄 AdminComponent initialisé');
    
    // ✅ Récupérer l'utilisateur immédiatement
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

    // ✅ S'abonner aux changements
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user) => {
        if (user) {
          this.admin = user;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  logout(): void {
    this.authService.logout();
  }
}