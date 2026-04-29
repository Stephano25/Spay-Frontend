import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

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
    MatTooltipModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  editMode = false;
  isLoading = true;
  isSaving = false;
  isUploading = false;
  
  // Pour la prévisualisation de la photo
  previewImage: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.isLoading = true;
    this.authService.currentUser.subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
          // Charger la photo de profil si elle existe
          if (user.profilePicture) {
            this.previewImage = user.profilePicture;
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
      // Réinitialiser la prévisualisation quand on annule
      this.previewImage = this.user?.profilePicture || null;
      this.selectedFile = null;
    }
  }

  /**
   * Sélectionner un fichier pour la photo de profil
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      this.notificationService.showError('Veuillez sélectionner une image');
      return;
    }
    
    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.showError('L\'image ne doit pas dépasser 5MB');
      return;
    }
    
    this.selectedFile = file;
    
    // Créer une prévisualisation
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewImage = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Uploader la photo de profil
   */
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
          this.user.profilePicture = response.profilePictureUrl;
          this.previewImage = response.profilePictureUrl;
          this.selectedFile = null;
          this.isUploading = false;
          this.authService.updateCurrentUser(this.user);
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

  /**
   * Supprimer la photo de profil
   */
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
      // Uploader la photo si elle a été sélectionnée
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