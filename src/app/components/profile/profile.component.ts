// frontend/src/app/components/profile/profile.component.ts
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { TranslationService } from '../../services/translation.service';
import { UserService } from '../../services/user.service';
import { environment } from '../../../environments/environment';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-profile',
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
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: any = null;
  editMode = false;
  isLoading = true;
  isSaving = false;
  isUploading = false;
  
  previewImage: string | null = null;
  previewImageSafe: SafeUrl | null = null;
  selectedFile: File | null = null;
  imageError: boolean = false;
  
  private subscriptions: any[] = [];

  private genderLabels: { [key: string]: string } = {
    'male': 'Homme',
    'female': 'Femme',
    'other': 'Autre',
    'prefer_not': 'Préfère ne pas dire'
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    private translationService: TranslationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadUserData();
    
    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log('🌐 ProfileComponent: Langue changée en ' + lang);
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

  getGenderLabel(gender: string): string {
    if (!gender) return '';
    return this.genderLabels[gender] || gender;
  }

  loadUserData() {
    this.isLoading = true;
    this.authService.currentUser.subscribe({
      next: (user: any) => {
        if (user) {
          this.user = { ...user };
          this.imageError = false;
          
          if (user.profilePicture) {
            const fullUrl = this.getFullImageUrl(user.profilePicture);
            this.previewImage = fullUrl;
            this.previewImageSafe = this.sanitizer.bypassSecurityTrustUrl(fullUrl);
            console.log('🖼️ URL photo de profil générée:', fullUrl);
          } else {
            this.previewImage = null;
            this.previewImageSafe = null;
          }
          
          if (!this.user.gender) {
            this.user.gender = '';
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      if (this.user?.profilePicture) {
        const fullUrl = this.getFullImageUrl(this.user.profilePicture);
        this.previewImage = fullUrl;
        this.previewImageSafe = this.sanitizer.bypassSecurityTrustUrl(fullUrl);
      } else {
        this.previewImage = null;
        this.previewImageSafe = null;
      }
      this.selectedFile = null;
      this.imageError = false;
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

  // ✅ UPLOAD CORRIGÉ
  uploadProfilePicture(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) {
        resolve();
        return;
      }
      
      this.isUploading = true;
      this.cdr.detectChanges();
      
      console.log('📤 Upload du fichier:', this.selectedFile.name);
      
      this.userService.uploadProfilePhoto(this.selectedFile).subscribe({
        next: (response: any) => {
          console.log('✅ Réponse upload:', response);
          
          // ✅ Récupérer l'URL de la photo
          const profileUrl = response.profilePictureUrl || response.url || response.profilePicture;
          
          if (profileUrl) {
            console.log('🖼️ URL reçue:', profileUrl);
            
            // ✅ Construire l'URL complète
            const baseUrl = environment.baseUrl || environment.apiUrl || 'http://localhost:3000';
            const fullUrl = profileUrl.startsWith('http') ? profileUrl : baseUrl + profileUrl;
            
            console.log('🖼️ URL complète:', fullUrl);
            
            // Mettre à jour l'utilisateur
            this.user.profilePicture = fullUrl;
            this.previewImage = fullUrl;
            this.previewImageSafe = this.sanitizer.bypassSecurityTrustUrl(fullUrl);
            
            // Mettre à jour le service
            this.authService.updateCurrentUser(this.user);
            
            this.notificationService.showSuccess('Photo de profil mise à jour avec succès !');
          } else {
            console.warn('⚠️ Aucune URL dans la réponse');
            this.refreshUserData();
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

  refreshUserData(): void {
    this.authService.currentUser.subscribe({
      next: (user: any) => {
        if (user) {
          this.user = { ...user };
          if (user.profilePicture) {
            const fullUrl = this.getFullImageUrl(user.profilePicture);
            this.previewImage = fullUrl;
            this.previewImageSafe = this.sanitizer.bypassSecurityTrustUrl(fullUrl);
          }
          this.cdr.detectChanges();
        }
      }
    });
  }

  removeProfilePicture(): void {
    if (confirm('Voulez-vous vraiment supprimer votre photo de profil ?')) {
      this.isUploading = true;
      this.cdr.detectChanges();
      
      this.userService.removeProfilePhoto().subscribe({
        next: () => {
          this.user.profilePicture = null;
          this.previewImage = null;
          this.previewImageSafe = null;
          this.selectedFile = null;
          this.imageError = false;
          this.isUploading = false;
          this.notificationService.showSuccess('Photo de profil supprimée');
          this.authService.updateCurrentUser(this.user);
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
      
      const updatedUser = {
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        phoneNumber: this.user.phoneNumber,
        website: this.user.website,
        bio: this.user.bio,
        birthday: this.user.birthday,
        gender: this.user.gender
      };

      this.authService.updateProfile(updatedUser).subscribe({
        next: (response: any) => {
          this.notificationService.showSuccess('Profil mis à jour avec succès');
          this.editMode = false;
          this.isSaving = false;
          this.refreshUserData();
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Erreur mise à jour:', error);
          this.notificationService.showError('Erreur lors de la mise à jour du profil');
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('❌ Erreur:', error);
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  goBack() {
    const user = this.authService.getCurrentUser();
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/user/dashboard']);
    }
  }

  logout() {
    this.authService.logout();
  }

  getInitials(): string {
    if (!this.user) return '';
    return (this.user.firstName?.charAt(0) || '') + (this.user.lastName?.charAt(0) || '');
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }
}