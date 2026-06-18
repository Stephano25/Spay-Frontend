import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminDataService, User } from '../../../services/admin-data.service';
import { NotificationService } from '../../../services/notification.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatToolbarModule
  ],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  isLoading = true;

  constructor(
    private adminDataService: AdminDataService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminDataService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement utilisateurs:', error);
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        this.isLoading = false;
      }
    });
  }

  getUserInitials(user: User): string {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) || '') + (lastName.charAt(0) || '');
  }

  toggleUserStatus(user: User): void {
    this.adminDataService.updateUserStatus(user.id, !user.isActive).subscribe({
      next: () => {
        user.isActive = !user.isActive;
        this.notificationService.showSuccess(`Utilisateur ${user.isActive ? 'activé' : 'désactivé'}`);
      },
      error: (error) => {
        console.error('Erreur mise à jour statut:', error);
        this.notificationService.showError('Erreur lors de la mise à jour');
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Voulez-vous vraiment supprimer ${user.firstName} ${user.lastName} ?`)) {
      this.adminDataService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.notificationService.showSuccess('Utilisateur supprimé');
        },
        error: (error) => {
          console.error('Erreur suppression:', error);
          this.notificationService.showError('Erreur lors de la suppression');
        }
      });
    }
  }

  getRoleLabel(role: string): string {
    switch(role) {
      case 'admin': return 'Admin';
      case 'super_admin': return 'Super Admin';
      default: return 'Utilisateur';
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}