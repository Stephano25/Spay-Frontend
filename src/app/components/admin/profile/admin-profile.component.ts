// frontend/src/app/components/admin/profile/admin-profile.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
import { WalletService } from '../../../services/wallet.service';
import { UserService } from '../../../services/user.service';
import { TranslationService } from '../../../services/translation.service';
import { environment } from '../../../../environments/environment';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatDialogModule,
    TranslatePipe
  ],
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.css'],
})
export class AdminProfileComponent implements OnInit {
  admin: any = null;
  stats: any = {};
  editMode = false;
  isLoading = true;
  isSaving = false;
  isSuperAdmin = false;
  isUploading = false;

  // Photo de profil
  previewImage: string | null = null;
  previewImageSafe: SafeUrl | null = null;
  selectedFile: File | null = null;
  imageError: boolean = false;

  // Top-up
  showTopUpModal = false;
  topUpAmount: number = 0;
  topUpDescription: string = '';
  isTopUpSubmitting = false;

  private subscriptions: any[] = [];

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private walletService: WalletService,
    private userService: UserService,
    private notificationService: NotificationService,
    private translationService: TranslationService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadAdminData();
    this.loadStats();
    const user = this.authService.getCurrentUser();
    this.isSuperAdmin = user?.role === 'super_admin';

    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log('🌐 AdminProfileComponent: Langue changée en ' + lang);
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getFullImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const baseUrl = environment.baseUrl || environment.apiUrl || 'http://localhost:3000';
    const cleanBase = baseUrl.replace(/\/+$/, '');
    if (url.startsWith('/uploads')) {
      const cleanUrl = url.replace(/^\/+/, '');
      return cleanBase + '/' + cleanUrl;
    }
    if (url.startsWith('/assets')) {
      return url;
    }
    if (!url.includes('/')) {
      return cleanBase + '/uploads/profiles/' + url;
    }
    return url;
  }

  loadAdminData() {
    this.isLoading = true;
    this.authService.currentUser.subscribe({
      next: (user) => {
        if (user) {
          this.admin = user;
          this.isSuperAdmin = user.role === 'super_admin';
          if (user.profilePicture) {
            const fullUrl = this.getFullImageUrl(user.profilePicture);
            this.previewImage = fullUrl;
            this.previewImageSafe = this.sanitizer.bypassSecurityTrustUrl(fullUrl);
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadStats() {
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
      },
    });
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.selectedFile = null;
      this.imageError = false;
      if (this.admin?.profilePicture) {
        const fullUrl = this.getFullImageUrl(this.admin.profilePicture);
        this.previewImage = fullUrl;
        this.previewImageSafe = this.sanitizer.bypassSecurityTrustUrl(fullUrl);
      }
    }
    this.cdr.detectChanges();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      this.notificationService.showError('Veuillez sélectionner une image');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.showError('L\'image ne doit pas dépasser 5MB');
      return;
    }
    
    this.selectedFile = file;
    this.imageError = false;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewImage = e.target.result;
      this.previewImageSafe = this.sanitizer.bypassSecurityTrustUrl(e.target.result);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  uploadProfilePicture(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) {
        resolve();
        return;
      }
      
      this.isUploading = true;
      this.cdr.detectChanges();
      
      this.userService.uploadProfilePhoto(this.selectedFile).subscribe({
        next: (response: any) => {
          console.log('✅ Réponse upload:', response);
          
          let profileUrl = response.profilePictureUrl || response.url || response.profilePicture;
          
          if (profileUrl) {
            const baseUrl = environment.baseUrl || environment.apiUrl || 'http://localhost:3000';
            const fullUrl = profileUrl.startsWith('http') ? profileUrl : baseUrl + profileUrl;
            
            this.admin.profilePicture = fullUrl;
            this.previewImage = fullUrl;
            this.previewImageSafe = this.sanitizer.bypassSecurityTrustUrl(fullUrl);
            this.authService.updateCurrentUser(this.admin);
            this.notificationService.showSuccess('Photo de profil mise à jour');
          }
          
          this.selectedFile = null;
          this.isUploading = false;
          this.imageError = false;
          this.cdr.detectChanges();
          resolve();
        },
        error: (error: any) => {
          console.error('❌ Erreur upload:', error);
          this.notificationService.showError('Erreur lors de l\'upload de la photo');
          this.isUploading = false;
          this.cdr.detectChanges();
          reject(error);
        }
      });
    });
  }

  removeProfilePicture(): void {
    if (confirm('Voulez-vous vraiment supprimer votre photo de profil ?')) {
      this.isUploading = true;
      this.cdr.detectChanges();
      
      this.userService.removeProfilePhoto().subscribe({
        next: () => {
          this.admin.profilePicture = null;
          this.previewImage = null;
          this.previewImageSafe = null;
          this.selectedFile = null;
          this.imageError = false;
          this.isUploading = false;
          this.notificationService.showSuccess('Photo de profil supprimée');
          this.authService.updateCurrentUser(this.admin);
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Erreur suppression:', error);
          this.notificationService.showError('Erreur lors de la suppression');
          this.isUploading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  async saveProfile() {
    this.isSaving = true;
    this.cdr.detectChanges();
    
    try {
      await this.uploadProfilePicture();
      
      const updatedAdmin = {
        firstName: this.admin.firstName,
        lastName: this.admin.lastName,
        email: this.admin.email,
        phoneNumber: this.admin.phoneNumber,
      };

      this.adminService.updateAdminProfile(updatedAdmin).subscribe({
        next: (response) => {
          this.notificationService.showSuccess('Profil mis à jour avec succès');
          this.editMode = false;
          this.isSaving = false;
          this.authService.updateCurrentUser(response);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erreur mise à jour:', error);
          this.notificationService.showError('Erreur lors de la mise à jour du profil');
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      });
    } catch (error) {
      console.error('Erreur:', error);
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  openTopUpModal() {
    this.topUpAmount = 0;
    this.topUpDescription = '';
    this.showTopUpModal = true;
    this.cdr.detectChanges();
  }

  closeTopUpModal() {
    this.showTopUpModal = false;
    this.topUpAmount = 0;
    this.topUpDescription = '';
    this.isTopUpSubmitting = false;
    this.cdr.detectChanges();
  }

  topUpWallet() {
    if (!this.topUpAmount || this.topUpAmount < 100) {
      this.notificationService.showError('Le montant minimum est de 100 Ar');
      return;
    }

    if (!this.admin) {
      this.notificationService.showError('Administrateur non trouvé');
      return;
    }

    this.isTopUpSubmitting = true;
    this.cdr.detectChanges();

    this.adminService.depositMoney(
      this.admin.id,
      this.topUpAmount,
      this.topUpDescription || `Top-up portefeuille SuperAdmin`
    ).subscribe({
      next: (response) => {
        this.isTopUpSubmitting = false;
        this.notificationService.showSuccess(
          `💰 ${this.formatAmount(this.topUpAmount)} Ar ajoutés à votre portefeuille avec succès!`
        );
        if (this.admin) {
          this.admin.balance = response.newBalance || (this.admin.balance + this.topUpAmount);
          this.authService.updateCurrentUser(this.admin);
        }
        this.closeTopUpModal();
        this.loadAdminData();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur top-up:', error);
        this.isTopUpSubmitting = false;
        this.notificationService.showError(
          error?.error?.message || 'Erreur lors du top-up du portefeuille'
        );
        this.cdr.detectChanges();
      },
    });
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }

  logout() {
    this.authService.logout();
  }

  getInitials(): string {
    if (!this.admin) return '';
    return (
      (this.admin.firstName?.charAt(0) || '') +
      (this.admin.lastName?.charAt(0) || '')
    ).toUpperCase();
  }

  formatAmount(amount: number): string {
    if (!amount && amount !== 0) return '0';
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + ' M';
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + ' k';
    }
    return amount.toString();
  }
}