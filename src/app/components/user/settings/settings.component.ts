import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { UserService, UserSettings } from '../../../services/user.service';
import { TranslationService } from '../../../services/translation.service';
import { ThemeService } from '../../../services/theme.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { User } from '../../../models/user.model';

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
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatDividerModule, MatTabsModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatRadioModule, MatSliderModule, MatTooltipModule, TranslatePipe
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  user: User | null = null;
  settings: UserSettings = {
    notifications: { email: true, push: true, sms: false, transactionAlerts: true, promoEmails: false },
    privacy: { profileVisibility: 'friends', showLastSeen: true, showOnlineStatus: true, allowFriendRequests: true },
    security: { twoFactorAuth: false, sessionTimeout: 30, loginAlerts: true },
    appearance: { theme: 'light', fontSize: 'medium', language: 'fr', compactMode: false }
  };

  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  isLoading = true;
  isSaving = false;
  activeTab = 0;
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  private subscriptions: Subscription[] = [];

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
    private router: Router,
    private translationService: TranslationService,
    private themeService: ThemeService
  ) {
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

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

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

  private loadSettings(): void {
    this.isLoading = true;
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      try {
        this.settings = JSON.parse(savedSettings);
      } catch (e) { console.error(e); }
    }
    this.applyTheme();
    this.applyFontSize();
    this.translationService.setLanguage(this.settings.appearance.language);

    this.subscriptions.push(
      this.userService.getUserSettings().subscribe({
        next: (settings: UserSettings) => {
          this.settings = { ...this.settings, ...settings };
          this.saveSettingsToStorage();
          this.applyTheme();
          this.applyFontSize();
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; }
      })
    );
  }

  private saveSettingsToStorage(): void {
    localStorage.setItem('user_settings', JSON.stringify(this.settings));
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.isSaving = true;
    this.subscriptions.push(
      this.authService.updateProfile(this.profileForm.value).subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.notificationService.showSuccess('Profil mis à jour');
          this.isSaving = false;
        },
        error: () => {
          this.notificationService.showError('Erreur mise à jour');
          this.isSaving = false;
        }
      })
    );
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.isSaving = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.subscriptions.push(
      this.authService.changePassword(currentPassword, newPassword).subscribe({
        next: () => {
          this.notificationService.showSuccess('Mot de passe modifié');
          this.passwordForm.reset();
          this.isSaving = false;
        },
        error: () => {
          this.notificationService.showError('Erreur changement');
          this.isSaving = false;
        }
      })
    );
  }

  saveNotificationSettings(): void {
    this.saveSettings();
    this.notificationService.showSuccess('Paramètres de notification sauvegardés');
  }
  savePrivacySettings(): void {
    this.saveSettings();
    this.notificationService.showSuccess('Paramètres de confidentialité sauvegardés');
  }
  saveSecuritySettings(): void {
    this.saveSettings();
    this.notificationService.showSuccess('Paramètres de sécurité sauvegardés');
  }
  saveAppearanceSettings(): void {
    this.saveSettings();
    this.applyTheme();
    this.applyFontSize();
    this.translationService.setLanguage(this.settings.appearance.language);
    this.notificationService.showSuccess('Paramètres d\'apparence sauvegardés');
  }

  private saveSettings(): void {
    this.saveSettingsToStorage();
    this.subscriptions.push(
      this.userService.updateUserSettings(this.settings).subscribe({
        next: () => console.log('Saved on server'),
        error: () => console.warn('Could not save on server')
      })
    );
  }

  private applyTheme(): void {
    const theme = this.settings.appearance.theme;
    const primaryColor = '#667eea';
    const secondaryColor = '#764ba2';
    this.themeService.applyTheme(theme, primaryColor, secondaryColor);
  }

  private applyFontSize(): void {
    this.themeService.applyFontSize(this.settings.appearance.fontSize);
  }

  resetAllSettings(): void {
    if (confirm('Réinitialiser tous les paramètres ?')) {
      this.settings = {
        notifications: { email: true, push: true, sms: false, transactionAlerts: true, promoEmails: false },
        privacy: { profileVisibility: 'friends', showLastSeen: true, showOnlineStatus: true, allowFriendRequests: true },
        security: { twoFactorAuth: false, sessionTimeout: 30, loginAlerts: true },
        appearance: { theme: 'light', fontSize: 'medium', language: 'fr', compactMode: false }
      };
      this.saveSettings();
      this.applyTheme();
      this.applyFontSize();
      this.translationService.setLanguage('fr');
      this.notificationService.showInfo('Paramètres réinitialisés');
    }
  }

  deleteAccount(): void {
    if (confirm('Supprimer votre compte ? Action irréversible.')) {
      const password = prompt('Entrez votre mot de passe pour confirmer :');
      if (password) {
        this.subscriptions.push(
          this.userService.deleteAccount(password).subscribe({
            next: () => {
              this.notificationService.showInfo('Compte supprimé');
              this.authService.logout();
            },
            error: () => this.notificationService.showError('Erreur suppression')
          })
        );
      }
    }
  }

  getInitials(): string {
    if (!this.user) return '';
    return (this.user.firstName?.charAt(0) || '') + (this.user.lastName?.charAt(0) || '');
  }

  goBack(): void { this.router.navigate(['/user']); }
  logout(): void { this.authService.logout(); }

  get currentPassword() { return this.passwordForm.get('currentPassword'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }
}