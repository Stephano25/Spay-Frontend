// src/app/components/layout/sidebar/sidebar.component.ts
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TranslationService } from '../../../services/translation.service';
import { ThemeService } from '../../../services/theme.service';
import { Subscription } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
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
    MatDividerModule, MatTooltipModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;      // mode réduit (desktop)
  isMobile = false;
  isOpen = false;           // overlay mobile
  currentUser: any = null;
  private themeSubscription!: Subscription;

  adminMenuItems = [
    { icon: 'dashboard', label: 'Tableau de bord', route: '/admin/dashboard' },
    { icon: 'people', label: 'Utilisateurs', route: '/admin/users' },
    { icon: 'receipt', label: 'Transactions', route: '/admin/transactions' },
    { icon: 'bar_chart', label: 'Statistiques', route: '/admin/stats' },
    { icon: 'settings', label: 'Paramètres', route: '/admin/settings' },
    { icon: 'person', label: 'Mon Profil', route: '/admin/profile' }
  ];

  constructor(
    private authService: AuthService,
    private translationService: TranslationService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.authService.currentUser.subscribe(user => (this.currentUser = user));
    this.themeSubscription = this.themeService.currentTheme$.subscribe(() => {
      // rafraîchir le template si besoin
      this.adminMenuItems = [...this.adminMenuItems];
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
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
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.isOpen = !this.isOpen;
    } else {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  closeSidebar() {
    if (this.isMobile) this.isOpen = false;
  }

  logout() {
    this.authService.logout();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get menuItems() {
    return this.adminMenuItems;
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