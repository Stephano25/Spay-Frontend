import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TranslationService } from '../../../services/translation.service';
import { ThemeService } from '../../../services/theme.service';
import { Subscription } from 'rxjs';

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
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  isMobile = false;
  isOpen = false;
  currentUser: any = null;
  private themeSubscription!: Subscription;
  
  userMenuItems = [
    { icon: 'dashboard', labelKey: 'Tableau de bord', route: '/user' },
    { icon: 'account_balance_wallet', labelKey: 'Portefeuille', route: '/wallet' },
    { icon: 'swap_horiz', labelKey: 'Transactions', route: '/transactions' },
    { icon: 'people', labelKey: 'Amis', route: '/friends' },
    { icon: 'chat', labelKey: 'Messages', route: '/chat' },
    { icon: 'qr_code_scanner', labelKey: 'Scanner', route: '/scan-pay' },
    { icon: 'phone_android', labelKey: 'Mobile Money', route: '/mobile-money' },
    { icon: 'bar_chart', labelKey: 'Statistiques', route: '/stats' },
    { icon: 'person', labelKey: 'Profil', route: '/profile' },
    { icon: 'settings', labelKey: 'Paramètres', route: '/user/settings' }
  ];

  adminMenuItems = [
    { icon: 'dashboard', labelKey: 'Tableau de bord', route: '/admin/dashboard' },
    { icon: 'people', labelKey: 'Utilisateurs', route: '/admin/users' },
    { icon: 'receipt', labelKey: 'Transactions', route: '/admin/transactions' },
    { icon: 'bar_chart', labelKey: 'Statistiques', route: '/admin/stats' },
    { icon: 'settings', labelKey: 'Paramètres', route: '/admin/settings' },
    { icon: 'person', labelKey: 'Mon Profil', route: '/admin/profile' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private translationService: TranslationService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    
    // S'abonner aux changements de thème
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      console.log(`🎨 Sidebar - Thème changé: ${theme}`);
      // Forcer la mise à jour du template
      this.userMenuItems = [...this.userMenuItems];
      this.adminMenuItems = [...this.adminMenuItems];
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
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

  translate(key: string): string {
    return this.translationService.translate(key);
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