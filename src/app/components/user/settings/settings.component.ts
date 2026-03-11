import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { UserService, UserSettings } from '../../../services/user.service';

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
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SidebarComponent,           // ← AJOUTER CET IMPORT
    NavigationHeaderComponent,   // ← AJOUTER CET IMPORT
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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSliderModule,
    MatTooltipModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  // Données
  user: User | null = null;
  settings: UserSettings = {
    notifications: {
      email: true,
      push: true,
      sms: false,
      transactionAlerts: true,
      promoEmails: false
    },
    privacy: {
      profileVisibility: 'friends',
      showLastSeen: true,
      showOnlineStatus: true,
      allowFriendRequests: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      loginAlerts: true
    },
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      language: 'fr',
      compactMode: false
    }
  };

  // Formulaires
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  // UI
  isLoading = true;
  isSaving = false;
  activeTab = 0;
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  private subscriptions: Subscription[] = [];

  // Options pour les sélecteurs
  languages = [
    { value: 'fr', label: 'Français' },
    { value: 'mg', label: 'Malagasy' },
    { value: 'en', label: 'English' }
  ];

  themes = [
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
    { value: 'system', label: 'Système' }
  ];

  fontSizes = [
    { value: 'small', label: 'Petite' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'large', label: 'Grande' }
  ];

  privacyOptions = [
    { value: 'public', label: 'Public' },
    { value: 'friends', label: 'Amis uniquement' },
    { value: 'private', label: 'Privé' }
  ];

  sessionTimeouts = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 heure' },
    { value: 120, label: '2 heures' },
    { value: 0, label: 'Jamais' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Initialiser les formulaires
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern('^[0-9]{9,10}$')]],
      bio: ['', [Validators.maxLength(500)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Valider la correspondance des mots de passe
   */
  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  /**
   * Charger les données de l'utilisateur
   */
  private loadUserData(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user: User | null) => {
        this.user = user;
        if (user) {
          this.profileForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber || '',
            bio: (user as any).bio || ''
          });
        }
      })
    );
  }

  /**
   * Charger les paramètres (depuis le localStorage ou l'API)
   */
  private loadSettings(): void {
    this.isLoading = true;
    
    // Essayer de charger depuis le localStorage d'abord
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      try {
        this.settings = JSON.parse(savedSettings);
      } catch (e) {
        console.error('Erreur chargement settings:', e);
      }
    }

    // Puis charger depuis l'API (si disponible)
    this.subscriptions.push(
      this.userService.getUserSettings().subscribe({
        next: (settings: UserSettings) => {
          this.settings = { ...this.settings, ...settings };
          this.saveSettingsToStorage();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.warn('API settings non disponible, utilisation des settings locaux');
          this.isLoading = false;
        }
      })
    );
  }

  /**
   * Sauvegarder les paramètres dans le localStorage
   */
  private saveSettingsToStorage(): void {
    localStorage.setItem('user_settings', JSON.stringify(this.settings));
  }

  /**
   * Sauvegarder le profil
   */
  saveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSaving = true;
    const userData = this.profileForm.value;

    this.subscriptions.push(
      this.authService.updateProfile(userData).subscribe({
        next: (updatedUser: User) => {
          this.user = updatedUser;
          this.notificationService.showSuccess('Profil mis à jour avec succès');
          this.isSaving = false;
        },
        error: (error: any) => {
          console.error('Erreur mise à jour profil:', error);
          this.notificationService.showError('Erreur lors de la mise à jour du profil');
          this.isSaving = false;
        }
      })
    );
  }

  /**
   * Changer le mot de passe
   */
  changePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isSaving = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.subscriptions.push(
      this.authService.changePassword(currentPassword, newPassword).subscribe({
        next: () => {
          this.notificationService.showSuccess('Mot de passe modifié avec succès');
          this.passwordForm.reset();
          this.isSaving = false;
        },
        error: (error: any) => {
          console.error('Erreur changement mot de passe:', error);
          this.notificationService.showError('Erreur lors du changement de mot de passe');
          this.isSaving = false;
        }
      })
    );
  }

  /**
   * Sauvegarder les paramètres de notification
   */
  saveNotificationSettings(): void {
    this.saveSettings();
    this.notificationService.showSuccess('Paramètres de notification sauvegardés');
  }

  /**
   * Sauvegarder les paramètres de confidentialité
   */
  savePrivacySettings(): void {
    this.saveSettings();
    this.notificationService.showSuccess('Paramètres de confidentialité sauvegardés');
  }

  /**
   * Sauvegarder les paramètres de sécurité
   */
  saveSecuritySettings(): void {
    this.saveSettings();
    this.notificationService.showSuccess('Paramètres de sécurité sauvegardés');
  }

  /**
   * Sauvegarder les paramètres d'apparence
   */
  saveAppearanceSettings(): void {
    this.saveSettings();
    this.applyTheme();
    this.notificationService.showSuccess('Paramètres d\'apparence sauvegardés');
  }

  /**
   * Sauvegarder tous les paramètres
   */
  private saveSettings(): void {
    this.saveSettingsToStorage();
    
    // Envoyer à l'API si disponible
    this.subscriptions.push(
      this.userService.updateUserSettings(this.settings).subscribe({
        next: () => {
          console.log('Settings sauvegardés sur le serveur');
        },
        error: (error: any) => {
          console.warn('Impossible de sauvegarder sur le serveur:', error);
        }
      })
    );
  }

  /**
   * Appliquer le thème
   */
  private applyTheme(): void {
    const theme = this.settings.appearance.theme;
    document.body.classList.remove('light-theme', 'dark-theme');
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    } else {
      document.body.classList.add(`${theme}-theme`);
    }
  }

  /**
   * Réinitialiser tous les paramètres
   */
  resetAllSettings(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous vos paramètres ?')) {
      this.settings = {
        notifications: {
          email: true,
          push: true,
          sms: false,
          transactionAlerts: true,
          promoEmails: false
        },
        privacy: {
          profileVisibility: 'friends',
          showLastSeen: true,
          showOnlineStatus: true,
          allowFriendRequests: true
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          loginAlerts: true
        },
        appearance: {
          theme: 'light',
          fontSize: 'medium',
          language: 'fr',
          compactMode: false
        }
      };
      this.saveSettings();
      this.applyTheme();
      this.notificationService.showInfo('Paramètres réinitialisés');
    }
  }

  /**
   * Supprimer le compte
   */
  deleteAccount(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      const password = prompt('Veuillez entrer votre mot de passe pour confirmer:');
      if (password) {
        this.subscriptions.push(
          this.userService.deleteAccount(password).subscribe({
            next: () => {
              this.notificationService.showInfo('Votre compte a été supprimé');
              this.authService.logout();
            },
            error: (error: any) => {
              this.notificationService.showError('Erreur lors de la suppression du compte');
            }
          })
        );
      }
    }
  }

  /**
   * Obtenir les initiales
   */
  getInitials(): string {
    if (!this.user) return '';
    return (this.user.firstName?.charAt(0) || '') + (this.user.lastName?.charAt(0) || '');
  }

  logout(): void {
    this.authService.logout();
  }

  // Getters pour les formulaires
  get currentPassword() { return this.passwordForm.get('currentPassword'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }
}