// frontend/src/app/components/user/settings/settings.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { TranslatePipe } from '../../../pipes/translate.pipe';

import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { UserService } from '../../../services/user.service';
import { TranslationService } from '../../../services/translation.service';
import { ThemeService } from '../../../services/theme.service';
import { User, UserSettings } from '../../../models/user.model';

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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';

type ThemeType = 'light' | 'dark' | 'system';
type FontSizeType = 'small' | 'medium' | 'large';
type LanguageType = 'fr' | 'mg' | 'en';

@Component({
  selector: 'app-user-settings',
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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSliderModule,
    MatTooltipModule,
    TranslatePipe,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatDialogModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  @ViewChild('birthdayPicker') birthdayPicker: any;

  user: User | null = null;
  settings: UserSettings = {
    general: { autoplayVideos: true, nsfwFilter: true },
    notifications: { 
      email: true, push: true, sms: false, 
      friendRequests: true, comments: true, likes: true, 
      messages: true, mentions: true, groupActivities: true,
      dailyDigest: 'daily'
    },
    privacy: { 
      profileVisibility: 'friends', 
      postVisibility: 'friends',
      showLastSeen: true, 
      showOnlineStatus: true, 
      allowFriendRequests: true,
      allowMessagesFromNonFriends: false 
    },
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

  themeMenuOpen = false;
  languageMenuOpen = false;
  fontSizeMenuOpen = false;

  friendsCount = 0;
  postsCount = 0;
  friendsList: any[] = [];
  closeFriends: any[] = [];
  acquaintances: any[] = [];
  pendingFriendRequests: any[] = [];
  blockedUsers: any[] = [];
  friendSuggestions: any[] = [];
  activeDevices: any[] = [];
  profilePhotoUrl: string | null = null;

  languages: { value: LanguageType; label: string; flag: string }[] = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'mg', label: 'Malagasy', flag: '🇲🇬' },
    { value: 'en', label: 'English', flag: '🇬🇧' }
  ];
  
  themes: { value: ThemeType; label: string }[] = [
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
    { value: 'system', label: 'Système' }
  ];
  
  fontSizes: { value: FontSizeType; label: string }[] = [
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

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    private translationService: TranslationService,
    private themeService: ThemeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern('^[0-9]{9,10}$')]],
      bio: ['', [Validators.maxLength(500)]],
      birthday: [''],
      gender: ['']
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
    this.loadSocialData();
    this.loadActiveDevices();

    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log(`🌐 Langue changée dans les settings: ${lang}`);
        this.settings.appearance.language = lang as LanguageType;
        this.cdr.detectChanges();
      })
    );
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
            bio: (user as any).bio || '',
            birthday: (user as any).birthday || '',
            gender: (user as any).gender || ''
          });
          this.profilePhotoUrl = (user as any).profilePhoto || (user as any).profilePicture || null;
          this.cdr.detectChanges();
        }
      })
    );
  }

  private loadSettings(): void {
    this.isLoading = true;
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        this.settings = { ...this.settings, ...parsed };
      } catch (e) { console.error(e); }
    }
    
    this.applyTheme();
    this.applyFontSize();
    this.applyLanguage();

    this.subscriptions.push(
      this.userService.getUserSettings().pipe(
        catchError((error) => {
          console.warn('⚠️ Impossible de charger les paramètres depuis le serveur:', error);
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      ).subscribe({
        next: (settings: UserSettings | null) => {
          if (settings) {
            this.settings = { ...this.settings, ...settings };
            this.saveSettingsToStorage();
            this.applyTheme();
            this.applyFontSize();
            this.applyLanguage();
            this.cdr.detectChanges();
          }
        }
      })
    );
  }

  private loadSocialData(): void {
    this.subscriptions.push(
      this.userService.getFriendsCount().pipe(
        catchError(() => of({ count: 0 }))
      ).subscribe((result) => {
        if (typeof result === 'object' && result !== null) {
          this.friendsCount = result.count || 0;
        } else {
          this.friendsCount = result || 0;
        }
        this.cdr.detectChanges();
      })
    );
    
    this.subscriptions.push(
      this.userService.getPostsCount().pipe(
        catchError(() => of({ count: 0 }))
      ).subscribe((result) => {
        if (typeof result === 'object' && result !== null) {
          this.postsCount = result.count || 0;
        } else {
          this.postsCount = result || 0;
        }
        this.cdr.detectChanges();
      })
    );
    
    this.subscriptions.push(
      this.userService.getFriendsList().pipe(catchError(() => of([])))
        .subscribe((friends) => {
          this.friendsList = friends || [];
          this.cdr.detectChanges();
        })
    );
    
    this.subscriptions.push(
      this.userService.getCloseFriends().pipe(catchError(() => of([])))
        .subscribe((friends) => {
          this.closeFriends = friends || [];
          this.cdr.detectChanges();
        })
    );
    
    this.subscriptions.push(
      this.userService.getAcquaintances().pipe(catchError(() => of([])))
        .subscribe((friends) => {
          this.acquaintances = friends || [];
          this.cdr.detectChanges();
        })
    );
    
    this.subscriptions.push(
      this.userService.getPendingFriendRequests().pipe(catchError(() => of([])))
        .subscribe((requests) => {
          this.pendingFriendRequests = requests || [];
          this.cdr.detectChanges();
        })
    );
    
    this.subscriptions.push(
      this.userService.getBlockedUsers().pipe(catchError(() => of([])))
        .subscribe((users) => {
          this.blockedUsers = users || [];
          this.cdr.detectChanges();
        })
    );
    
    this.subscriptions.push(
      this.userService.getFriendSuggestions().pipe(catchError(() => of([])))
        .subscribe((suggestions) => {
          this.friendSuggestions = suggestions || [];
          this.cdr.detectChanges();
        })
    );
  }

  private loadActiveDevices(): void {
    this.subscriptions.push(
      this.userService.getActiveDevices().pipe(catchError(() => of([])))
        .subscribe((devices) => {
          this.activeDevices = devices || [];
          this.cdr.detectChanges();
        })
    );
  }

  private saveSettingsToStorage(): void {
    localStorage.setItem('user_settings', JSON.stringify(this.settings));
  }

  private saveSettings(): void {
    this.saveSettingsToStorage();
    this.subscriptions.push(
      this.userService.updateUserSettings(this.settings).pipe(
        catchError((error) => {
          console.warn('⚠️ Impossible de sauvegarder sur le serveur:', error);
          return of(null);
        })
      ).subscribe()
    );
  }

  // ============================================================
  // PROFIL
  // ============================================================

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.isSaving = true;
    this.subscriptions.push(
      this.authService.updateProfile(this.profileForm.value).subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.notificationService.showSuccess('Profil mis à jour');
          this.isSaving = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.notificationService.showError('Erreur mise à jour');
          this.isSaving = false;
        }
      })
    );
  }

  editProfile(): void {
    this.activeTab = 1;
  }

  onProfilePhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.userService.uploadProfilePhoto(file).subscribe({
        next: (url) => {
          this.profilePhotoUrl = url;
          this.notificationService.showSuccess('Photo de profil mise à jour');
          this.cdr.detectChanges();
        },
        error: () => this.notificationService.showError('Erreur lors du téléchargement')
      });
    }
  }

  removeProfilePhoto(): void {
    this.userService.removeProfilePhoto().subscribe({
      next: () => {
        this.profilePhotoUrl = null;
        this.notificationService.showSuccess('Photo de profil supprimée');
        this.cdr.detectChanges();
      },
      error: () => this.notificationService.showError('Erreur lors de la suppression')
    });
  }

  // ============================================================
  // SÉCURITÉ
  // ============================================================

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
          this.cdr.detectChanges();
        },
        error: () => {
          this.notificationService.showError('Erreur changement');
          this.isSaving = false;
        }
      })
    );
  }

  private setup2FA(): void {
    this.notificationService.showInfo('Configuration 2FA - À implémenter');
  }

  // ============================================================
  // PARAMÈTRES
  // ============================================================

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
    if (this.settings.security.twoFactorAuth) {
      this.setup2FA();
    }
    this.notificationService.showSuccess('Paramètres de sécurité sauvegardés');
  }

  saveGeneralSettings(): void {
    this.saveSettings();
    this.notificationService.showSuccess('Paramètres généraux sauvegardés');
  }

  // ============================================================
  // THÈME, LANGUE, POLICE
  // ============================================================

  selectTheme(value: ThemeType): void {
    console.log(`🎨 UserSettings: Sélection du thème ${value}`);
    this.settings.appearance.theme = value;
    this.saveAppearanceSettings();
    this.themeMenuOpen = false;
  }

  selectLanguage(value: LanguageType): void {
    console.log(`🌐 UserSettings: Sélection de la langue ${value}`);
    this.settings.appearance.language = value;
    
    this.translationService.applyLanguageToAll(value);
    this.themeService.applyLanguage(value);
    this.saveAppearanceSettings();
    this.languageMenuOpen = false;
    
    this.notificationService.showSuccess(`Langue changée en ${this.getLanguageName(value)}`);
    this.cdr.detectChanges();
  }

  selectFontSize(value: FontSizeType): void {
    console.log(`📏 UserSettings: Sélection de la taille ${value}`);
    this.settings.appearance.fontSize = value;
    this.saveAppearanceSettings();
    this.fontSizeMenuOpen = false;
  }

  saveAppearanceSettings(): void {
    console.log('💾 UserSettings: Sauvegarde des paramètres d\'apparence');
    
    this.saveSettingsToStorage();
    this.saveSettings();
    
    this.themeService.updateAppearance(
      this.settings.appearance.theme,
      this.settings.appearance.fontSize,
      this.settings.appearance.language
    );
    
    this.translationService.setLanguage(this.settings.appearance.language);
    
    this.notificationService.showSuccess("Paramètres d'apparence sauvegardés");
    this.cdr.detectChanges();
  }

  private applyTheme(): void {
    const theme = this.settings.appearance.theme;
    this.themeService.applyTheme(theme, '#7c3aed', '#4f46e5');
  }

  private applyFontSize(): void {
    const size = this.settings.appearance.fontSize;
    this.themeService.applyFontSize(size);
  }

  private applyLanguage(): void {
    const lang = this.settings.appearance.language;
    this.translationService.setLanguage(lang);
    this.themeService.applyLanguage(lang);
  }

  // ============================================================
  // GETTERS
  // ============================================================

  getLanguageName(langValue: string): string {
    const lang = this.languages.find(l => l.value === langValue);
    return lang ? lang.label : 'Langue';
  }

  get currentThemeLabel(): string {
    const theme = this.themes.find(t => t.value === this.settings.appearance.theme);
    return theme ? theme.label : 'Thème';
  }

  get currentThemeIcon(): string {
    const theme = this.settings.appearance.theme;
    return theme === 'light' ? 'light_mode' : theme === 'dark' ? 'dark_mode' : 'settings_suggest';
  }

  get currentLanguageLabel(): string {
    const lang = this.languages.find(l => l.value === this.settings.appearance.language);
    return lang ? lang.label : 'Langue';
  }

  get currentLanguageFlag(): string {
    const lang = this.languages.find(l => l.value === this.settings.appearance.language);
    return lang ? lang.flag : '🇫🇷';
  }

  get currentFontSizeLabel(): string {
    const size = this.fontSizes.find(s => s.value === this.settings.appearance.fontSize);
    return size ? size.label : 'Police';
  }

  toggleThemeMenu(): void {
    this.themeMenuOpen = !this.themeMenuOpen;
    this.languageMenuOpen = false;
    this.fontSizeMenuOpen = false;
  }

  toggleLanguageMenu(): void {
    this.languageMenuOpen = !this.languageMenuOpen;
    this.themeMenuOpen = false;
    this.fontSizeMenuOpen = false;
  }

  toggleFontSizeMenu(): void {
    this.fontSizeMenuOpen = !this.fontSizeMenuOpen;
    this.themeMenuOpen = false;
    this.languageMenuOpen = false;
  }

  // ============================================================
  // RÉINITIALISATION
  // ============================================================

  resetAllSettings(): void {
    if (confirm('Réinitialiser tous les paramètres ?')) {
      this.settings = {
        general: { autoplayVideos: true, nsfwFilter: true },
        notifications: { 
          email: true, push: true, sms: false, 
          friendRequests: true, comments: true, likes: true, 
          messages: true, mentions: true, groupActivities: true,
          dailyDigest: 'daily'
        },
        privacy: { 
          profileVisibility: 'friends', 
          postVisibility: 'friends',
          showLastSeen: true, 
          showOnlineStatus: true, 
          allowFriendRequests: true,
          allowMessagesFromNonFriends: false 
        },
        security: { twoFactorAuth: false, sessionTimeout: 30, loginAlerts: true },
        appearance: { theme: 'light', fontSize: 'medium', language: 'fr', compactMode: false }
      };
      this.saveSettings();
      this.applyTheme();
      this.applyFontSize();
      this.applyLanguage();
      this.notificationService.showInfo('Paramètres réinitialisés');
      this.cdr.detectChanges();
    }
  }

  // ============================================================
  // GESTION DES AMIS
  // ============================================================

  acceptFriendRequest(requestId: string): void {
    this.userService.acceptFriendRequest(requestId).subscribe({
      next: () => {
        this.pendingFriendRequests = this.pendingFriendRequests.filter(r => r.id !== requestId);
        this.friendsCount++;
        this.notificationService.showSuccess('Demande d\'ami acceptée');
        this.cdr.detectChanges();
      },
      error: () => this.notificationService.showError('Erreur lors de l\'acceptation')
    });
  }

  rejectFriendRequest(requestId: string): void {
    this.userService.rejectFriendRequest(requestId).subscribe({
      next: () => {
        this.pendingFriendRequests = this.pendingFriendRequests.filter(r => r.id !== requestId);
        this.notificationService.showSuccess('Demande d\'ami refusée');
        this.cdr.detectChanges();
      },
      error: () => this.notificationService.showError('Erreur lors du refus')
    });
  }

  sendFriendRequest(userId: string): void {
    this.userService.sendFriendRequest(userId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Demande d\'ami envoyée');
        this.friendSuggestions = this.friendSuggestions.filter(s => s.id !== userId);
        this.cdr.detectChanges();
      },
      error: () => this.notificationService.showError('Erreur lors de l\'envoi')
    });
  }

  unfriend(friendId: string): void {
    if (confirm('Voulez-vous vraiment supprimer cet ami ?')) {
      this.userService.unfriend(friendId).subscribe({
        next: () => {
          this.friendsList = this.friendsList.filter(f => f.id !== friendId);
          this.friendsCount--;
          this.notificationService.showSuccess('Ami supprimé');
          this.cdr.detectChanges();
        },
        error: () => this.notificationService.showError('Erreur lors de la suppression')
      });
    }
  }

  blockUserFromFriend(userId: string): void {
    if (confirm('Voulez-vous vraiment bloquer cet utilisateur ?')) {
      this.userService.blockUser(userId).subscribe({
        next: () => {
          this.unfriend(userId);
          this.notificationService.showSuccess('Utilisateur bloqué');
          this.cdr.detectChanges();
        },
        error: () => this.notificationService.showError('Erreur lors du blocage')
      });
    }
  }

  unblockUser(userId: string): void {
    this.userService.unblockUser(userId).subscribe({
      next: () => {
        this.blockedUsers = this.blockedUsers.filter(u => u.id !== userId);
        this.notificationService.showSuccess('Utilisateur débloqué');
        this.cdr.detectChanges();
      },
      error: () => this.notificationService.showError('Erreur lors du déblocage')
    });
  }

  createFriendList(): void {
    this.notificationService.showInfo('Création de liste - À implémenter');
  }

  searchUsersToBlock(): void {
    this.notificationService.showInfo('Recherche d\'utilisateurs - À implémenter');
  }

  // ============================================================
  // GESTION DES APPAREILS
  // ============================================================

  revokeDevice(deviceId: string): void {
    if (confirm('Voulez-vous déconnecter cet appareil ?')) {
      this.userService.revokeDevice(deviceId).subscribe({
        next: () => {
          this.activeDevices = this.activeDevices.filter(d => d.id !== deviceId);
          this.notificationService.showSuccess('Appareil déconnecté');
          this.cdr.detectChanges();
        },
        error: () => this.notificationService.showError('Erreur lors de la déconnexion')
      });
    }
  }

  logoutAllDevices(): void {
    if (confirm('Voulez-vous vous déconnecter de tous les appareils ?')) {
      this.userService.logoutAllDevices().subscribe({
        next: () => {
          this.notificationService.showSuccess('Déconnecté de tous les appareils');
          this.authService.logout();
        },
        error: () => this.notificationService.showError('Erreur lors de la déconnexion')
      });
    }
  }

  // ============================================================
  // GESTION DU COMPTE
  // ============================================================

  changeEmail(): void {
    const newEmail = prompt('Entrez votre nouvelle adresse email :');
    if (newEmail && newEmail.includes('@')) {
      this.userService.changeEmail(newEmail).subscribe({
        next: () => {
          this.notificationService.showSuccess('Email modifié. Vérifiez votre boîte de réception.');
          if (this.user) this.user.email = newEmail;
          this.cdr.detectChanges();
        },
        error: () => this.notificationService.showError('Erreur lors du changement d\'email')
      });
    } else if (newEmail) {
      this.notificationService.showError('Email invalide');
    }
  }

  changePhoneNumber(): void {
    const newPhone = prompt('Entrez votre nouveau numéro de téléphone :');
    if (newPhone && /^[0-9]{9,10}$/.test(newPhone)) {
      this.userService.changePhoneNumber(newPhone).subscribe({
        next: () => {
          this.notificationService.showSuccess('Numéro de téléphone modifié');
          if (this.user) this.user.phoneNumber = newPhone;
          this.cdr.detectChanges();
        },
        error: () => this.notificationService.showError('Erreur lors du changement')
      });
    } else if (newPhone) {
      this.notificationService.showError('Numéro invalide (9-10 chiffres)');
    }
  }

  deactivateAccount(): void {
    if (confirm('Voulez-vous désactiver votre compte ? Vous pourrez le réactiver plus tard.')) {
      const password = prompt('Entrez votre mot de passe pour confirmer :');
      if (password) {
        this.userService.deactivateAccount(password).subscribe({
          next: () => {
            this.notificationService.showInfo('Compte désactivé');
            this.authService.logout();
          },
          error: () => this.notificationService.showError('Erreur lors de la désactivation')
        });
      }
    }
  }

  deleteAccount(): void {
    if (confirm('⚠️ SUPPRESSION DÉFINITIVE ⚠️\n\nVoulez-vous vraiment supprimer votre compte ? Toutes vos données seront perdues et cette action est irréversible.')) {
      const password = prompt('Entrez votre mot de passe pour confirmer la suppression définitive :');
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

  downloadMyData(): void {
    this.userService.downloadUserData().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mes_donnees.json';
        a.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.showSuccess('Téléchargement commencé');
      },
      error: () => this.notificationService.showError('Erreur lors du téléchargement')
    });
  }

  // ============================================================
  // SIGNALEMENT
  // ============================================================

  reportUser(userId: string, reason?: string): void {
    const reportReason = reason || prompt('Motif du signalement :');
    if (reportReason) {
      this.userService.reportUser(userId, reportReason).subscribe({
        next: () => this.notificationService.showSuccess('Signalement envoyé'),
        error: () => this.notificationService.showError('Erreur lors du signalement')
      });
    }
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  goBack(): void { 
    this.router.navigate(['/user/dashboard']); 
  }
  
  logout(): void { 
    this.authService.logout(); 
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  getInitials(): string {
    if (!this.user) return '';
    return (this.user.firstName?.charAt(0) || '') + (this.user.lastName?.charAt(0) || '');
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }
}