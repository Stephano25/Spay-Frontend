import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
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
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { BaseComponent } from '../base.component';

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
export class ProfileComponent extends BaseComponent implements OnInit {
  user: any = null;
  editMode = false;
  isLoading = true;
  isSaving = false;
  isUploading = false;
  
  previewImage: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {super();}

  override ngOnInit() {
    this.loadUserData();
    this.subscriptions.push(
    this.translationService.language$.subscribe((lang) => {
      console.log(`🌐 FriendsComponent: Langue changée en ${lang}`);
      this.cdr.detectChanges();
      })
    );
  }

  /**
   * Construire l'URL complète de l'image
   */
  getFullImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/assets')) {
      return url;
    }
    if (url.startsWith('/uploads')) {
      return `${environment.baseUrl}${url}`;
    }
    return `/assets/profiles/${url}`;
  }

  loadUserData() {
    this.isLoading = true;
    this.authService.currentUser.subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
          if (user.profilePicture) {
            this.previewImage = this.getFullImageUrl(user.profilePicture);
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoading = false;
      }
    });
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.previewImage = this.user?.profilePicture ? this.getFullImageUrl(this.user.profilePicture) : null;
      this.selectedFile = null;
    }
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
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewImage = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ✅ Méthode corrigée pour uploader la photo
  uploadProfilePicture(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) {
        resolve();
        return;
      }
      
      this.isUploading = true;
      const formData = new FormData();
      formData.append('profilePicture', this.selectedFile);
      
      this.authService.uploadProfilePicture(formData).subscribe({
        next: (response: any) => {
          // ✅ Utiliser la réponse du serveur
          const profileUrl = response.profilePictureUrl || response.user?.profilePicture;
          if (profileUrl) {
            this.user.profilePicture = profileUrl;
            this.previewImage = this.getFullImageUrl(profileUrl);
            this.authService.updateCurrentUser(this.user);
          }
          this.selectedFile = null;
          this.isUploading = false;
          this.notificationService.showSuccess('Photo de profil mise à jour');
          resolve();
        },
        error: (error) => {
          console.error('Erreur upload:', error);
          this.notificationService.showError('Erreur lors de l\'upload de la photo');
          this.isUploading = false;
          reject(error);
        }
      });
    });
  }

  removeProfilePicture(): void {
    if (confirm('Voulez-vous vraiment supprimer votre photo de profil ?')) {
      this.isUploading = true;
      
      this.authService.deleteProfilePicture().subscribe({
        next: () => {
          this.user.profilePicture = null;
          this.previewImage = null;
          this.selectedFile = null;
          this.isUploading = false;
          this.notificationService.showSuccess('Photo de profil supprimée');
          this.authService.updateCurrentUser(this.user);
        },
        error: (error) => {
          console.error('Erreur suppression:', error);
          this.notificationService.showError('Erreur lors de la suppression');
          this.isUploading = false;
        }
      });
    }
  }

  async saveProfile() {
    this.isSaving = true;
    
    try {
      await this.uploadProfilePicture();
      
      const updatedUser = {
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        phoneNumber: this.user.phoneNumber
      };

      this.authService.updateProfile(updatedUser).subscribe({
        next: () => {
          this.notificationService.showSuccess('Profil mis à jour avec succès');
          this.editMode = false;
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Erreur mise à jour:', error);
          this.notificationService.showError('Erreur lors de la mise à jour du profil');
          this.isSaving = false;
        }
      });
    } catch (error) {
      console.error('Erreur:', error);
      this.isSaving = false;
    }
  }

  goBack() {
    const user = this.authService.getCurrentUser();
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/user']);
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