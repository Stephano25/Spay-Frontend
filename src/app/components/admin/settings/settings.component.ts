import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { AdminService } from '../../../services/admin.service';

// Models
import { User } from '../../../models/user.model';

// Components
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { NavigationHeaderComponent } from '../../shared/navigation-header/navigation-header.component';

// Angular Material
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
    SidebarComponent,
    NavigationHeaderComponent,
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
    MatBadgeModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  // Données
  admin: User | null = null;
  
  // Paramètres généraux
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

  // Paramètres de sécurité
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

  // Paramètres de paiement
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

  // Paramètres de notification
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

  // Paramètres de personnalisation
  customizationSettings = {
    theme: 'light',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    logo: null,
    favicon: null,
    customCSS: '',
    customJS: ''
  };

  // Logs système
  systemLogs = [
    { date: new Date(), level: 'info', message: 'Système démarré', user: 'system' },
    { date: new Date(Date.now() - 3600000), level: 'warning', message: 'Tentative de connexion échouée', user: '192.168.1.100' },
    { date: new Date(Date.now() - 7200000), level: 'error', message: 'Erreur de base de données', user: 'system' },
    { date: new Date(Date.now() - 86400000), level: 'info', message: 'Sauvegarde effectuée', user: 'system' },
    { date: new Date(Date.now() - 172800000), level: 'info', message: 'Mise à jour effectuée', user: 'admin' }
  ];

  // Statistiques système
  systemStats = {
    uptime: '15 jours 8 heures',
    memoryUsage: '45%',
    cpuUsage: '23%',
    diskUsage: '34%',
    databaseSize: '156 MB',
    activeUsers: 234,
    activeSessions: 156,
    apiCalls: 15420
  };

  // Versions
  versions = {
    app: '1.0.0',
    angular: '19.2.0',
    node: '24.13.0',
    mongodb: '7.0',
    nestjs: '10.0'
  };

  // UI
  isLoading = false;
  isSaving = false;
  activeTab = 0;
  showPassword = false;
  
  // Formulaires
  generalForm!: FormGroup;
  securityForm!: FormGroup;
  paymentForm!: FormGroup;
  notificationForm!: FormGroup;
  customizationForm!: FormGroup;

  private subscriptions: Subscription[] = [];

  // Options pour les sélecteurs
  themes = [
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
    { value: 'system', label: 'Système' }
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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private adminService: AdminService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadAdminData();
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user: User | null) => {
        this.admin = user;
      })
    );
  }

  private loadSettings(): void {
    this.isLoading = true;
    
    setTimeout(() => {
      const savedSettings = localStorage.getItem('admin_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          this.generalSettings = { ...this.generalSettings, ...settings.general };
          this.securitySettings = { ...this.securitySettings, ...settings.security };
          this.paymentSettings = { ...this.paymentSettings, ...settings.payment };
          this.notificationSettings = { ...this.notificationSettings, ...settings.notification };
          this.customizationSettings = { ...this.customizationSettings, ...settings.customization };
          this.updateForms();
        } catch (e) {
          console.error('Erreur chargement settings:', e);
        }
      }
      this.isLoading = false;
    }, 500);
  }

  private updateForms(): void {
    this.generalForm.patchValue(this.generalSettings);
    this.securityForm.patchValue(this.securitySettings);
    this.paymentForm.patchValue(this.paymentSettings);
    this.notificationForm.patchValue(this.notificationSettings);
    this.customizationForm.patchValue(this.customizationSettings);
  }

  saveGeneralSettings(): void {
    if (this.generalForm.invalid) return;
    
    this.isSaving = true;
    this.generalSettings = { ...this.generalSettings, ...this.generalForm.value };
    this.saveToStorage();
    
    setTimeout(() => {
      this.notificationService.showSuccess('Paramètres généraux sauvegardés');
      this.isSaving = false;
    }, 500);
  }

  saveSecuritySettings(): void {
    if (this.securityForm.invalid) return;
    
    this.isSaving = true;
    this.securitySettings = { ...this.securitySettings, ...this.securityForm.value };
    this.saveToStorage();
    
    setTimeout(() => {
      this.notificationService.showSuccess('Paramètres de sécurité sauvegardés');
      this.isSaving = false;
    }, 500);
  }

  savePaymentSettings(): void {
    if (this.paymentForm.invalid) return;
    
    this.isSaving = true;
    this.paymentSettings = { ...this.paymentSettings, ...this.paymentForm.value };
    this.saveToStorage();
    
    setTimeout(() => {
      this.notificationService.showSuccess('Paramètres de paiement sauvegardés');
      this.isSaving = false;
    }, 500);
  }

  saveNotificationSettings(): void {
    if (this.notificationForm.invalid) return;
    
    this.isSaving = true;
    this.notificationSettings = { ...this.notificationSettings, ...this.notificationForm.value };
    this.saveToStorage();
    
    setTimeout(() => {
      this.notificationService.showSuccess('Paramètres de notification sauvegardés');
      this.isSaving = false;
    }, 500);
  }

  saveCustomizationSettings(): void {
    if (this.customizationForm.invalid) return;
    
    this.isSaving = true;
    this.customizationSettings = { ...this.customizationSettings, ...this.customizationForm.value };
    this.saveToStorage();
    this.applyTheme();
    
    setTimeout(() => {
      this.notificationService.showSuccess('Paramètres de personnalisation sauvegardés');
      this.isSaving = false;
    }, 500);
  }

  private saveToStorage(): void {
    const settings = {
      general: this.generalSettings,
      security: this.securitySettings,
      payment: this.paymentSettings,
      notification: this.notificationSettings,
      customization: this.customizationSettings
    };
    localStorage.setItem('admin_settings', JSON.stringify(settings));
  }

  private applyTheme(): void {
    document.documentElement.style.setProperty('--primary-color', this.customizationSettings.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', this.customizationSettings.secondaryColor);
  }

  resetAllSettings(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      localStorage.removeItem('admin_settings');
      this.notificationService.showInfo('Paramètres réinitialisés');
      setTimeout(() => window.location.reload(), 1000);
    }
  }

  exportSettings(): void {
    const settings = {
      general: this.generalSettings,
      security: this.securitySettings,
      payment: this.paymentSettings,
      notification: this.notificationSettings,
      customization: this.customizationSettings,
      exportedAt: new Date()
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `spaye-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.notificationService.showSuccess('Paramètres exportés');
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
        this.updateForms();
        this.saveToStorage();
        this.applyTheme();
        this.notificationService.showSuccess('Paramètres importés avec succès');
      } catch (error) {
        this.notificationService.showError('Erreur lors de l\'importation');
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
}