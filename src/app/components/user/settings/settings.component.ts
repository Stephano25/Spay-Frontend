import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { UserService } from '../../../services/user.service';
import { TranslationService } from '../../../services/translation.service';
import { ThemeService } from '../../../services/theme.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  mutualFriends: number;
}

interface FriendRequest {
  id: string;
  name: string;
  avatar?: string;
  date: Date;
}

interface BlockedUser {
  id: string;
  name: string;
  avatar?: string;
}

interface Device {
  id: string;
  name: string;
  location: string;
  lastActive: Date;
}

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatDividerModule, MatTabsModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatRadioModule, MatSliderModule, MatTooltipModule, TranslatePipe,
    MatDatepickerModule, MatNativeDateModule, MatMenuModule, MatDialogModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class UserSettingsComponent implements OnInit, OnDestroy {
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

  // Données sociales
  friendsCount = 0;
  postsCount = 0;
  friendsList: Friend[] = [];
  closeFriends: Friend[] = [];
  acquaintances: Friend[] = [];
  pendingFriendRequests: FriendRequest[] = [];
  blockedUsers: BlockedUser[] = [];
  friendSuggestions: Friend[] = [];
  activeDevices: Device[] = [];
  profilePhotoUrl: string | null = null;

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
    private themeService: ThemeService,
    private dialog: MatDialog
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

  private loadSocialData(): void {
    this.userService.getFriendsCount().subscribe({
      next: (count) => this.friendsCount = count,
      error: () => console.error('Erreur chargement nombre amis')
    });
    
    this.userService.getPostsCount().subscribe({
      next: (count) => this.postsCount = count,
      error: () => console.error('Erreur chargement nombre posts')
    });
    
    this.userService.getFriendsList().subscribe({
      next: (friends) => this.friendsList = friends,
      error: () => console.error('Erreur chargement liste amis')
    });
    
    this.userService.getCloseFriends().subscribe({
      next: (friends) => this.closeFriends = friends,
      error: () => console.error('Erreur chargement amis proches')
    });
    
    this.userService.getAcquaintances().subscribe({
      next: (friends) => this.acquaintances = friends,
      error: () => console.error('Erreur chargement connaissances')
    });
    
    this.userService.getPendingFriendRequests().subscribe({
      next: (requests) => this.pendingFriendRequests = requests,
      error: () => console.error('Erreur chargement demandes amis')
    });
    
    this.userService.getBlockedUsers().subscribe({
      next: (users) => this.blockedUsers = users,
      error: () => console.error('Erreur chargement utilisateurs bloqués')
    });
    
    this.userService.getFriendSuggestions().subscribe({
      next: (suggestions) => this.friendSuggestions = suggestions,
      error: () => console.error('Erreur chargement suggestions')
    });
  }

  private loadActiveDevices(): void {
    this.userService.getActiveDevices().subscribe({
      next: (devices) => this.activeDevices = devices,
      error: () => console.error('Erreur chargement appareils')
    });
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
      },
      error: () => this.notificationService.showError('Erreur lors de la suppression')
    });
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
    if (this.settings.security.twoFactorAuth) {
      this.setup2FA();
    }
    this.notificationService.showSuccess('Paramètres de sécurité sauvegardés');
  }

  saveAppearanceSettings(): void {
    this.saveSettings();
    this.applyTheme();
    this.applyFontSize();
    this.translationService.setLanguage(this.settings.appearance.language);
    this.notificationService.showSuccess("Paramètres d'apparence sauvegardés");
  }

  saveGeneralSettings(): void {
    this.saveSettings();
    this.notificationService.showSuccess('Paramètres généraux sauvegardés');
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

  private setup2FA(): void {
    this.notificationService.showInfo('Configuration 2FA - À implémenter');
  }

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
      this.translationService.setLanguage('fr');
      this.notificationService.showInfo('Paramètres réinitialisés');
    }
  }

  // Gestion des amis
  acceptFriendRequest(requestId: string): void {
    this.userService.acceptFriendRequest(requestId).subscribe({
      next: () => {
        this.pendingFriendRequests = this.pendingFriendRequests.filter(r => r.id !== requestId);
        this.friendsCount++;
        this.notificationService.showSuccess('Demande d\'ami acceptée');
        this.loadSocialData();
      },
      error: () => this.notificationService.showError('Erreur lors de l\'acceptation')
    });
  }

  rejectFriendRequest(requestId: string): void {
    this.userService.rejectFriendRequest(requestId).subscribe({
      next: () => {
        this.pendingFriendRequests = this.pendingFriendRequests.filter(r => r.id !== requestId);
        this.notificationService.showSuccess('Demande d\'ami refusée');
      },
      error: () => this.notificationService.showError('Erreur lors du refus')
    });
  }

  sendFriendRequest(userId: string): void {
    this.userService.sendFriendRequest(userId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Demande d\'ami envoyée');
        this.friendSuggestions = this.friendSuggestions.filter(s => s.id !== userId);
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

  // Gestion des appareils
  revokeDevice(deviceId: string): void {
    if (confirm('Voulez-vous déconnecter cet appareil ?')) {
      this.userService.revokeDevice(deviceId).subscribe({
        next: () => {
          this.activeDevices = this.activeDevices.filter(d => d.id !== deviceId);
          this.notificationService.showSuccess('Appareil déconnecté');
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

  // Gestion du compte
  changeEmail(): void {
    const newEmail = prompt('Entrez votre nouvelle adresse email :');
    if (newEmail && newEmail.includes('@')) {
      this.userService.changeEmail(newEmail).subscribe({
        next: () => {
          this.notificationService.showSuccess('Email modifié. Vérifiez votre boîte de réception.');
          if (this.user) this.user.email = newEmail;
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

  reportUser(userId: string): void {
    const reason = prompt('Motif du signalement :');
    if (reason) {
      this.userService.reportUser(userId, reason).subscribe({
        next: () => this.notificationService.showSuccess('Signalement envoyé'),
        error: () => this.notificationService.showError('Erreur lors du signalement')
      });
    }
  }

  getInitials(): string {
    if (!this.user) return '';
    return (this.user.firstName?.charAt(0) || '') + (this.user.lastName?.charAt(0) || '');
  }

  goBack(): void { 
    this.router.navigate(['/user']); 
  }
  
  logout(): void { 
    this.authService.logout(); 
  }

  // Getters
  get currentPassword() { 
    return this.passwordForm.get('currentPassword'); 
  }
  
  get newPassword() { 
    return this.passwordForm.get('newPassword'); 
  }
  
  get confirmPassword() { 
    return this.passwordForm.get('confirmPassword'); 
  }
}