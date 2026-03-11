import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

// Angular Material
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  isMobile = false;
  isOpen = false;
  currentUser: any = null;
  
  // Menu items pour utilisateur normal
  userMenuItems = [
    { icon: 'dashboard', label: 'Tableau de bord', route: '/user' },
    { icon: 'account_balance_wallet', label: 'Portefeuille', route: '/wallet' },
    { icon: 'swap_horiz', label: 'Transactions', route: '/transactions' },
    { icon: 'people', label: 'Amis', route: '/friends' },
    { icon: 'chat', label: 'Messages', route: '/chat' },
    { icon: 'qr_code_scanner', label: 'Scanner', route: '/scan-pay' },
    { icon: 'phone_android', label: 'Mobile Money', route: '/mobile-money' },
    { icon: 'bar_chart', label: 'Statistiques', route: '/stats' },
    { icon: 'person', label: 'Profil', route: '/profile' },
    { icon: 'settings', label: 'Paramètres', route: '/user/settings' }
  ];

  // Menu items pour administrateur
  adminMenuItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/admin' },
    { icon: 'people', label: 'Utilisateurs', route: '/admin/users' },
    { icon: 'receipt', label: 'Transactions', route: '/admin/transactions' },
    { icon: 'bar_chart', label: 'Statistiques', route: '/admin/stats' },
    { icon: 'settings', label: 'Paramètres', route: '/admin/settings' },
    { icon: 'person', label: 'Mon Profil', route: '/profile' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.isCollapsed = true;
      this.isOpen = false;
    }
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.isOpen = !this.isOpen;
    } else {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  closeSidebar() {
    if (this.isMobile) {
      this.isOpen = false;
    }
  }

  logout() {
    this.authService.logout();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get menuItems() {
    return this.isAdmin() ? this.adminMenuItems : this.userMenuItems;
  }

  getInitials(): string {
    if (!this.currentUser) return '';
    return (this.currentUser.firstName?.charAt(0) || '') + 
           (this.currentUser.lastName?.charAt(0) || '');
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  }
}