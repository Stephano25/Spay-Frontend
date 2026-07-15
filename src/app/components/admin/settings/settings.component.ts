// frontend/src/app/components/admin/settings/settings.component.ts
import { Component, OnInit, OnDestroy, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { AdminService } from '../../../services/admin.service';
import { User } from '../../../models/user.model';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { BaseComponent } from '../../base.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSliderModule,
    MatCheckboxModule,
    MatRadioModule,
    MatExpansionModule,
    MatChipsModule,
    MatBadgeModule,
    TranslatePipe
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class AdminSettingsComponent extends BaseComponent implements OnInit, OnDestroy, AfterViewInit {
  admin: User | null = null;
  
  generalSettings = {
    siteName: 'SPaye',
    siteUrl: 'https://spaye.com',
    adminEmail: 'admin@spaye.com',
    supportEmail: 'support@spaye.com',
    maintenanceMode: false,
    registrationEnabled: true,
    defaultUserRole: 'user',
    maxFileSize: 150,
    sessionTimeout: 30
  };

  securitySettings = {
    twoFactorAuth: false,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: true,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    sessionTimeout: 60,
    requireEmailVerification: true,
    requirePhoneVerification: false
  };

  paymentSettings = {
    minTransaction: 100,
    maxTransaction: 5000000,
    dailyTransferLimit: 5000000,
    monthlyTransferLimit: 50000000,
    mobileMoneyEnabled: true,
    mobileMoneyOperators: {
      airtel: true,
      orange: true,
      mvola: true
    },
    transferFees: {
      airtel: 0.5,
      orange: 0.5,
      mvola: 0.5,
      internal: 0
    },
    currency: 'Ar'
  };

  notificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    adminAlerts: {
      newUser: true,
      newTransaction: true,
      largeTransaction: true,
      securityAlert: true,
      systemError: true
    },
    emailFrequency: 'instant'
  };

  customizationSettings = {
    theme: 'light',
    primaryColor: '#7c3aed',
    secondaryColor: '#4f46e5',
    logo: null,
    favicon: null,
    customCSS: '',
    customJS: ''
  };

  systemLogs: any[] = [];
  
  systemStats = {
    uptime: 'Chargement...',
    memoryUsage: '0%',
    cpuUsage: '0%',
    diskUsage: '0%',
    databaseSize: '0 MB',
    activeUsers: 0,
    activeSessions: 0,
    apiCalls: 0
  };

  versions = {
    app: '1.0.0',
    angular: '19.2.0',
    node: '24.13.0',
    mongodb: '7.0',
    nestjs: '10.0'
  };

  isLoading = false;
  isSaving = false;
  activeTab = 0;
  showPassword = false;
  
  selectedLanguage: string = 'fr';
  languages = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'mg', label: 'Malagasy', flag: '🇲🇬' },
    { value: 'en', label: 'English', flag: '🇬🇧' }
  ];
  
  generalForm!: FormGroup;
  securityForm!: FormGroup;
  paymentForm!: FormGroup;
  notificationForm!: FormGroup;
  customizationForm!: FormGroup;

  themes = [
    { value: 'light', label: 'Clair', icon: 'light_mode' },
    { value: 'dark', label: 'Sombre', icon: 'dark_mode' },
    { value: 'system', label: 'Système', icon: 'settings_suggest' }
  ];

  emailFrequencies = [
    { value: 'instant', label: 'Instantané' },
    { value: 'hourly', label: 'Toutes les heures' },
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' }
  ];

  userRoles = [
    { value: 'user', label: 'Utilisateur' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'super_admin', label: 'Super Admin' }
  ];

  private adminSettingsSubscriptions: Subscription[] = [];
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private adminService: AdminService,
    private notificationService: NotificationService,
    private router: Router,
    private renderer: Renderer2
  ) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.initForms();
    this.loadAdminData();
    this.loadSettings();
    this.loadThemeFromService();
    this.loadLanguageFromService();

    const langSub = this.translationService.language$.subscribe((lang) => {
      console.log(`🌐 AdminSettings: Langue changée en ${lang}`);
      this.selectedLanguage = lang;
      this.safeMarkForCheck();
    });
    this.adminSettingsSubscriptions.push(langSub);

    // ⭐ Ajouter un écouteur de redimensionnement
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  ngAfterViewInit(): void {
    // ⭐ Ajuster la hauteur après le chargement du DOM
    setTimeout(() => {
      this.adjustTabContentHeight();
    }, 300);
  }

  override ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.adminSettingsSubscriptions.forEach(sub => sub.unsubscribe());
    super.ngOnDestroy();
  }

  // ⭐ Gestion du redimensionnement
  private handleResize(): void {
    this.adjustTabContentHeight();
  }

  // ⭐ Ajuster la hauteur du contenu des tabs
  private adjustTabContentHeight(): void {
    try {
      const toolbar = document.querySelector('.settings-toolbar');
      const profileCard = document.querySelector('.admin-profile-card');
      const tabGroup = document.querySelector('.settings-tabs');
      
      if (!toolbar || !profileCard || !tabGroup) return;

      const toolbarHeight = toolbar.clientHeight || 64;
      const profileHeight = profileCard.clientHeight || 150;
      const tabHeaderHeight = 48;
      const padding = 32;
      
      // Calculer la hauteur disponible pour le contenu des tabs
      const windowHeight = window.innerHeight;
      const availableHeight = windowHeight - toolbarHeight - profileHeight - tabHeaderHeight - padding - 40;
      
      // Appliquer la hauteur calculée à tous les contenus de tabs
      const tabContents = document.querySelectorAll('.tab-content');
      tabContents.forEach((el: any) => {
        if (el instanceof HTMLElement) {
          const minHeight = Math.max(200, availableHeight);
          el.style.maxHeight = `${minHeight}px`;
          el.style.overflowY = 'auto';
        }
      });
    } catch (error) {
      console.warn('⚠️ Erreur lors de l\'ajustement de la hauteur:', error);
    }
  }

  private initForms(): void {
    this.generalForm = this.fb.group({
      siteName: [this.generalSettings.siteName, Validators.required],
      siteUrl: [this.generalSettings.siteUrl, Validators.required],
      adminEmail: [this.generalSettings.adminEmail, [Validators.required, Validators.email]],
      supportEmail: [this.generalSettings.supportEmail, [Validators.required, Validators.email]],
      maintenanceMode: [this.generalSettings.maintenanceMode],
      registrationEnabled: [this.generalSettings.registrationEnabled],
      defaultUserRole: [this.generalSettings.defaultUserRole],
      maxFileSize: [this.generalSettings.maxFileSize, [Validators.min(1), Validators.max(500)]],
      sessionTimeout: [this.generalSettings.sessionTimeout, [Validators.min(5), Validators.max(1440)]]
    });

    this.securityForm = this.fb.group({
      twoFactorAuth: [this.securitySettings.twoFactorAuth],
      passwordMinLength: [this.securitySettings.passwordMinLength, [Validators.min(6), Validators.max(20)]],
      passwordRequireUppercase: [this.securitySettings.passwordRequireUppercase],
      passwordRequireNumbers: [this.securitySettings.passwordRequireNumbers],
      passwordRequireSpecial: [this.securitySettings.passwordRequireSpecial],
      maxLoginAttempts: [this.securitySettings.maxLoginAttempts, [Validators.min(3), Validators.max(10)]],
      lockoutDuration: [this.securitySettings.lockoutDuration, [Validators.min(5), Validators.max(120)]],
      sessionTimeout: [this.securitySettings.sessionTimeout, [Validators.min(15), Validators.max(480)]],
      requireEmailVerification: [this.securitySettings.requireEmailVerification],
      requirePhoneVerification: [this.securitySettings.requirePhoneVerification]
    });

    this.paymentForm = this.fb.group({
      minTransaction: [this.paymentSettings.minTransaction, [Validators.min(100)]],
      maxTransaction: [this.paymentSettings.maxTransaction, [Validators.max(10000000)]],
      dailyTransferLimit: [this.paymentSettings.dailyTransferLimit],
      monthlyTransferLimit: [this.paymentSettings.monthlyTransferLimit],
      mobileMoneyEnabled: [this.paymentSettings.mobileMoneyEnabled],
      mobileMoneyOperators: this.fb.group({
        airtel: [this.paymentSettings.mobileMoneyOperators.airtel],
        orange: [this.paymentSettings.mobileMoneyOperators.orange],
        mvola: [this.paymentSettings.mobileMoneyOperators.mvola]
      }),
      transferFees: this.fb.group({
        airtel: [this.paymentSettings.transferFees.airtel, [Validators.min(0), Validators.max(10)]],
        orange: [this.paymentSettings.transferFees.orange, [Validators.min(0), Validators.max(10)]],
        mvola: [this.paymentSettings.transferFees.mvola, [Validators.min(0), Validators.max(10)]],
        internal: [this.paymentSettings.transferFees.internal, [Validators.min(0), Validators.max(5)]]
      }),
      currency: [this.paymentSettings.currency]
    });

    this.notificationForm = this.fb.group({
      emailNotifications: [this.notificationSettings.emailNotifications],
      smsNotifications: [this.notificationSettings.smsNotifications],
      pushNotifications: [this.notificationSettings.pushNotifications],
      adminAlerts: this.fb.group({
        newUser: [this.notificationSettings.adminAlerts.newUser],
        newTransaction: [this.notificationSettings.adminAlerts.newTransaction],
        largeTransaction: [this.notificationSettings.adminAlerts.largeTransaction],
        securityAlert: [this.notificationSettings.adminAlerts.securityAlert],
        systemError: [this.notificationSettings.adminAlerts.systemError]
      }),
      emailFrequency: [this.notificationSettings.emailFrequency]
    });

    this.customizationForm = this.fb.group({
      theme: [this.customizationSettings.theme],
      primaryColor: [this.customizationSettings.primaryColor],
      secondaryColor: [this.customizationSettings.secondaryColor],
      customCSS: [this.customizationSettings.customCSS],
      customJS: [this.customizationSettings.customJS]
    });
  }

  private loadAdminData(): void {
    const sub = this.authService.currentUser.subscribe((user: User | null) => {
      this.admin = user;
      this.safeMarkForCheck();
    });
    this.adminSettingsSubscriptions.push(sub);
  }

  private loadSettings(): void {
    this.isLoading = true;
    
    const settingsSub = this.adminService.getSettings().subscribe({
      next: (settings: any) => {
        if (settings?.general) {
          this.generalSettings = { ...this.generalSettings, ...settings.general };
          this.securitySettings = { ...this.securitySettings, ...settings.security };
          this.paymentSettings = { ...this.paymentSettings, ...settings.payment };
          this.updateForms();
        }
        this.isLoading = false;
        this.safeMarkForCheck();
        // Ajuster la hauteur après chargement
        setTimeout(() => this.adjustTabContentHeight(), 100);
      },
      error: (error) => {
        console.error('❌ Erreur chargement settings:', error);
        const savedSettings = localStorage.getItem('admin_settings');
        if (savedSettings) {
          try {
            const localSettings = JSON.parse(savedSettings);
            this.generalSettings = { ...this.generalSettings, ...localSettings.general };
            this.securitySettings = { ...this.securitySettings, ...localSettings.security };
            this.paymentSettings = { ...this.paymentSettings, ...localSettings.payment };
            this.updateForms();
          } catch (e) {
            console.error('❌ Erreur chargement settings locaux:', e);
          }
        }
        this.isLoading = false;
        this.safeMarkForCheck();
      }
    });
    this.adminSettingsSubscriptions.push(settingsSub);

    const logsSub = this.adminService.getSystemLogs().subscribe({
      next: (logs: any[]) => {
        if (logs && logs.length) {
          this.systemLogs = logs;
        }
        this.safeMarkForCheck();
      },
      error: (error) => {
        if (error.status === 404) {
          console.warn('⚠️ Endpoint logs non trouvé');
        } else {
          console.error('❌ Erreur chargement logs:', error);
        }
        this.safeMarkForCheck();
      }
    });
    this.adminSettingsSubscriptions.push(logsSub);

    const statsSub = this.adminService.getSystemStats().subscribe({
      next: (stats: any) => {
        if (stats) {
          this.systemStats = { ...this.systemStats, ...stats };
        }
        this.safeMarkForCheck();
      },
      error: (error) => {
        if (error.status === 404) {
          console.warn('⚠️ Endpoint stats non trouvé');
        } else {
          console.error('❌ Erreur chargement stats système:', error);
        }
        this.safeMarkForCheck();
      }
    });
    this.adminSettingsSubscriptions.push(statsSub);
  }

  private loadThemeFromService(): void {
    const currentTheme = this.themeService.getCurrentTheme();
    const primaryColor = this.themeService.getCurrentPrimaryColor();
    const secondaryColor = this.themeService.getCurrentSecondaryColor();

    this.customizationSettings.theme = currentTheme;
    this.customizationSettings.primaryColor = primaryColor || '#7c3aed';
    this.customizationSettings.secondaryColor = secondaryColor || '#4f46e5';

    this.customizationForm.patchValue({
      theme: currentTheme,
      primaryColor: this.customizationSettings.primaryColor,
      secondaryColor: this.customizationSettings.secondaryColor
    });
  }

  private loadLanguageFromService(): void {
    const savedLang = localStorage.getItem('user_language') || 'fr';
    this.selectedLanguage = savedLang;
  }

  private updateForms(): void {
    this.generalForm.patchValue(this.generalSettings);
    this.securityForm.patchValue(this.securitySettings);
    this.paymentForm.patchValue(this.paymentSettings);
    this.notificationForm.patchValue(this.notificationSettings);
    this.customizationForm.patchValue(this.customizationSettings);
  }

  private getFullSettings(): any {
    return {
      general: this.generalSettings,
      security: this.securitySettings,
      payment: this.paymentSettings,
      notification: this.notificationSettings,
      customization: this.customizationSettings
    };
  }

  saveGeneralSettings(): void {
    if (this.generalForm.invalid) return;
    this.isSaving = true;
    
    const updatedSettings = this.getFullSettings();
    updatedSettings.general = { ...this.generalSettings, ...this.generalForm.value };
    
    const sub = this.adminService.updateSettings(updatedSettings).subscribe({
      next: () => {
        this.generalSettings = updatedSettings.general;
        this.notificationService.showSuccess('Paramètres généraux sauvegardés');
        this.isSaving = false;
        this.safeMarkForCheck();
      },
      error: (error) => {
        console.error('❌ Erreur sauvegarde:', error);
        this.notificationService.showError('Erreur lors de la sauvegarde');
        this.isSaving = false;
        this.safeMarkForCheck();
      }
    });
    this.adminSettingsSubscriptions.push(sub);
  }

  saveSecuritySettings(): void {
    if (this.securityForm.invalid) return;
    this.isSaving = true;
    
    const updatedSettings = this.getFullSettings();
    updatedSettings.security = { ...this.securitySettings, ...this.securityForm.value };
    
    const sub = this.adminService.updateSettings(updatedSettings).subscribe({
      next: () => {
        this.securitySettings = updatedSettings.security;
        this.notificationService.showSuccess('Paramètres de sécurité sauvegardés');
        this.isSaving = false;
        this.safeMarkForCheck();
      },
      error: (error) => {
        console.error('❌ Erreur sauvegarde:', error);
        this.notificationService.showError('Erreur lors de la sauvegarde');
        this.isSaving = false;
        this.safeMarkForCheck();
      }
    });
    this.adminSettingsSubscriptions.push(sub);
  }

  savePaymentSettings(): void {
    if (this.paymentForm.invalid) return;
    this.isSaving = true;
    
    const updatedSettings = this.getFullSettings();
    updatedSettings.payment = { ...this.paymentSettings, ...this.paymentForm.value };
    
    const sub = this.adminService.updateSettings(updatedSettings).subscribe({
      next: () => {
        this.paymentSettings = updatedSettings.payment;
        this.notificationService.showSuccess('Paramètres de paiement sauvegardés');
        this.isSaving = false;
        this.safeMarkForCheck();
      },
      error: (error) => {
        console.error('❌ Erreur sauvegarde:', error);
        this.notificationService.showError('Erreur lors de la sauvegarde');
        this.isSaving = false;
        this.safeMarkForCheck();
      }
    });
    this.adminSettingsSubscriptions.push(sub);
  }

  saveNotificationSettings(): void {
    if (this.notificationForm.invalid) return;
    this.isSaving = true;
    
    const updatedSettings = this.getFullSettings();
    updatedSettings.notification = { ...this.notificationSettings, ...this.notificationForm.value };
    
    const sub = this.adminService.updateSettings(updatedSettings).subscribe({
      next: () => {
        this.notificationSettings = updatedSettings.notification;
        this.notificationService.showSuccess('Paramètres de notification sauvegardés');
        this.isSaving = false;
        this.safeMarkForCheck();
      },
      error: (error) => {
        console.error('❌ Erreur sauvegarde:', error);
        this.notificationService.showError('Erreur lors de la sauvegarde');
        this.isSaving = false;
        this.safeMarkForCheck();
      }
    });
    this.adminSettingsSubscriptions.push(sub);
  }

  setTheme(themeValue: string): void {
    console.log(`🎨 AdminSettings: Sélection du thème ${themeValue}`);
    
    this.customizationForm.patchValue({ theme: themeValue });
    this.customizationSettings.theme = themeValue;
    
    this.themeService.applyTheme(
      themeValue,
      this.customizationSettings.primaryColor,
      this.customizationSettings.secondaryColor
    );
    
    this.notificationService.showSuccess(`Thème changé en ${this.getThemeName(themeValue)}`);
    this.safeMarkForCheck();
  }

  setLanguage(langValue: string): void {
    console.log(`🌐 AdminSettings: Sélection de la langue ${langValue}`);
    
    this.selectedLanguage = langValue;
    
    this.translationService.setLanguage(langValue);
    this.themeService.applyLanguage(langValue);
    
    localStorage.setItem('admin_language', langValue);
    localStorage.setItem('user_language', langValue);
    
    this.customizationForm.patchValue({ language: langValue });
    
    this.notificationService.showSuccess(`Langue changée en ${this.getLanguageName(langValue)}`);
    this.safeMarkForCheck();
  }

  setFontSize(sizeValue: string): void {
    console.log(`📏 AdminSettings: Sélection de la taille ${sizeValue}`);
    
    this.themeService.applyFontSize(sizeValue);
    
    const sizeNames: Record<string, string> = { small: 'Petite', medium: 'Moyenne', large: 'Grande' };
    this.notificationService.showSuccess(`Taille de police changée en ${sizeNames[sizeValue] || sizeValue}`);
    this.safeMarkForCheck();
  }

  saveCustomizationSettings(): void {
    if (this.customizationForm.invalid) return;
    this.isSaving = true;
    
    const theme = this.customizationForm.get('theme')?.value;
    const primaryColor = this.customizationForm.get('primaryColor')?.value;
    const secondaryColor = this.customizationForm.get('secondaryColor')?.value;
    const customCSS = this.customizationForm.get('customCSS')?.value;

    this.customizationSettings.theme = theme;
    this.customizationSettings.primaryColor = primaryColor;
    this.customizationSettings.secondaryColor = secondaryColor;
    this.customizationSettings.customCSS = customCSS;

    this.themeService.applyTheme(theme, primaryColor, secondaryColor);
    this.applyCustomCSS(customCSS);

    this.translationService.setLanguage(this.selectedLanguage);
    this.themeService.applyLanguage(this.selectedLanguage);

    const sub = this.adminService.updateSettings(this.getFullSettings()).subscribe({
      next: () => {
        this.notificationService.showSuccess('Paramètres de personnalisation sauvegardés');
        this.isSaving = false;
        this.safeMarkForCheck();
      },
      error: (error) => {
        console.error('❌ Erreur sauvegarde:', error);
        this.notificationService.showError('Erreur lors de la sauvegarde');
        this.isSaving = false;
        this.safeMarkForCheck();
      }
    });
    this.adminSettingsSubscriptions.push(sub);
  }

  updatePrimaryColor(event: any): void {
    const color = event.target.value;
    this.customizationForm.patchValue({ primaryColor: color });
    this.customizationSettings.primaryColor = color;
    this.themeService.applyTheme(
      this.customizationSettings.theme,
      color,
      this.customizationSettings.secondaryColor
    );
    this.safeMarkForCheck();
  }

  updateSecondaryColor(event: any): void {
    const color = event.target.value;
    this.customizationForm.patchValue({ secondaryColor: color });
    this.customizationSettings.secondaryColor = color;
    this.themeService.applyTheme(
      this.customizationSettings.theme,
      this.customizationSettings.primaryColor,
      color
    );
    this.safeMarkForCheck();
  }

  updateCustomCSS(event: any): void {
    const css = event.target.value;
    this.customizationForm.patchValue({ customCSS: css });
    this.customizationSettings.customCSS = css;
    this.applyCustomCSS(css);
    this.safeMarkForCheck();
  }

  private applyCustomCSS(css: string): void {
    let styleElement = document.getElementById('custom-css');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-css';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;
  }

  private getThemeName(themeValue: string): string {
    const theme = this.themes.find(t => t.value === themeValue);
    return theme?.label || 'Clair';
  }

  getLanguageName(langValue: string): string {
    const lang = this.languages.find(l => l.value === langValue);
    return lang?.label || 'Français';
  }

  resetAllSettings(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      localStorage.removeItem('admin_settings');
      localStorage.removeItem('admin_language');
      
      this.generalSettings = {
        siteName: 'SPaye',
        siteUrl: 'https://spaye.com',
        adminEmail: 'admin@spaye.com',
        supportEmail: 'support@spaye.com',
        maintenanceMode: false,
        registrationEnabled: true,
        defaultUserRole: 'user',
        maxFileSize: 150,
        sessionTimeout: 30
      };
      
      this.customizationSettings = {
        theme: 'light',
        primaryColor: '#7c3aed',
        secondaryColor: '#4f46e5',
        logo: null,
        favicon: null,
        customCSS: '',
        customJS: ''
      };
      
      this.selectedLanguage = 'fr';
      this.updateForms();
      
      this.themeService.applyTheme('light', '#7c3aed', '#4f46e5');
      this.themeService.applyFontSize('medium');
      this.translationService.setLanguage('fr');
      this.themeService.applyLanguage('fr');
      
      this.notificationService.showInfo('Paramètres généraux réinitialisés');
      this.safeMarkForCheck();
      
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  exportSettings(): void {
    const settings = {
      general: this.generalSettings,
      security: this.securitySettings,
      payment: this.paymentSettings,
      notification: this.notificationSettings,
      customization: this.customizationSettings,
      language: this.selectedLanguage,
      exportedAt: new Date()
    };
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `spaye-settings-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    this.notificationService.showSuccess('Paramètres exportés avec succès');
  }

  importSettings(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        this.generalSettings = settings.general || this.generalSettings;
        this.securitySettings = settings.security || this.securitySettings;
        this.paymentSettings = settings.payment || this.paymentSettings;
        this.notificationSettings = settings.notification || this.notificationSettings;
        this.customizationSettings = settings.customization || this.customizationSettings;
        if (settings.language) {
          this.selectedLanguage = settings.language;
          this.translationService.setLanguage(settings.language);
          this.themeService.applyLanguage(settings.language);
        }
        this.updateForms();
        this.themeService.applyTheme(
          this.customizationSettings.theme,
          this.customizationSettings.primaryColor,
          this.customizationSettings.secondaryColor
        );
        this.notificationService.showSuccess('Paramètres importés avec succès');
        this.safeMarkForCheck();
      } catch (error) {
        console.error('❌ Erreur importation:', error);
        this.notificationService.showError('Erreur lors de l\'importation');
        this.safeMarkForCheck();
      }
    };
    reader.readAsText(file);
  }

  formatLogDate(date: Date): string {
    const now = new Date();
    const logDate = new Date(date);
    const diffMs = now.getTime() - logDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return logDate.toLocaleDateString('fr-MG');
  }

  getLogLevelClass(level: string): string {
    switch(level) {
      case 'error': return 'log-error';
      case 'warning': return 'log-warning';
      default: return 'log-info';
    }
  }

  formatNumber(value: number): string {
    return value.toString();
  }

  logout(): void {
    this.authService.logout();
  }
  
  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}