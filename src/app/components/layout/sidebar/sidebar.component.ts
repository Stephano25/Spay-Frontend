// frontend/src/app/components/layout/sidebar/sidebar.component.ts
import { Component, HostListener, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TranslationService } from '../../../services/translation.service';
import { ThemeService } from '../../../services/theme.service';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatSidenavModule, MatListModule, MatIconModule, MatButtonModule,
    MatDividerModule, MatTooltipModule,
    TranslatePipe // ✅ AJOUT
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  isCollapsed = false;
  isMobile = false;
  isOpen = false;
  currentUser: any = null;
  isSuperAdmin = false;
  private themeSubscription!: Subscription;

  adminMenuItems = [
    { icon: 'dashboard', label: 'Tableau de bord', route: '/admin/dashboard' },
    { icon: 'account_balance_wallet', label: 'Portefeuille', route: '/admin/wallet' },
    { icon: 'people', label: 'Amis', route: '/admin/friends' },
    { icon: 'chat', label: 'Messages', route: '/admin/chat' },
    { icon: 'people', label: 'Utilisateurs', route: '/admin/users' },
    { icon: 'receipt', label: 'Transactions', route: '/admin/transactions' },
    { icon: 'bar_chart', label: 'Statistiques', route: '/admin/stats' },
    { icon: 'settings', label: 'Paramètres', route: '/admin/settings' },
    { icon: 'person', label: 'Mon Profil', route: '/admin/profile' }
  ];

  adminSuperMenuItems = [
    { icon: 'dashboard', label: 'Tableau de bord', route: '/admin/dashboard' },
    { icon: 'account_balance_wallet', label: 'Portefeuille', route: '/admin/wallet' },
    { icon: 'people', label: 'Amis', route: '/admin/friends' },
    { icon: 'chat', label: 'Messages', route: '/admin/chat' },
    { icon: 'people', label: 'Utilisateurs', route: '/admin/users' },
    { icon: 'receipt', label: 'Transactions', route: '/admin/transactions' },
    { icon: 'bar_chart', label: 'Statistiques', route: '/admin/stats' },
    { icon: 'admin_panel_settings', label: 'Administrateurs', route: '/admin/admins' },
    { icon: 'settings', label: 'Paramètres', route: '/admin/settings' },
    { icon: 'person', label: 'Mon Profil', route: '/admin/profile' }
  ];

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

  constructor(
    private authService: AuthService,
    private translationService: TranslationService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isSuperAdmin = user?.role === 'super_admin';
    });
    this.themeSubscription = this.themeService.currentTheme$.subscribe(() => {
      this.adminMenuItems = [...this.adminMenuItems];
    });
  }

  ngAfterViewInit(): void {
    this.updateDrawerContentClass();
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private updateDrawerContentClass(): void {
    setTimeout(() => {
      const drawerContent = document.querySelector('.mat-drawer-content');
      if (drawerContent) {
        if (this.isCollapsed) {
          drawerContent.classList.add('sidebar-collapsed');
        } else {
          drawerContent.classList.remove('sidebar-collapsed');
        }
      }
    }, 100);
  }

  checkScreenSize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.isCollapsed = true;
      this.isOpen = false;
    } else if (wasMobile && !this.isMobile) {
      this.isOpen = false;
      this.isCollapsed = false;
    }
    this.updateDrawerContentClass();
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.isOpen = !this.isOpen;
    } else {
      this.isCollapsed = !this.isCollapsed;
      this.updateDrawerContentClass();
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
    if (this.isAdmin()) {
      return this.isSuperAdmin ? this.adminSuperMenuItems : this.adminMenuItems;
    }
    return this.userMenuItems;
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
    return new Intl.NumberFormat('fr-MG').format(amount);
  }
}