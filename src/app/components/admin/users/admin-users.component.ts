import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="users-container">
      <mat-card class="users-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>people</mat-icon>
            Gestion des utilisateurs
          </mat-card-title>
          <mat-card-subtitle>Total: {{ users.length }} utilisateurs</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="loading-container" *ngIf="isLoading">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Chargement des utilisateurs...</p>
          </div>

          <div *ngIf="!isLoading" class="table-container">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Solde</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Date d'inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of users">
                  <td class="user-cell">
                    <div class="user-avatar">
                      {{ getUserInitials(user) }}
                    </div>
                    <div class="user-name">
                      {{ user.firstName }} {{ user.lastName }}
                    </div>
                   </td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.phoneNumber || '-' }}</td>
                  <td class="balance">{{ formatAmount(user.balance) }} Ar</td>
                  <td>
                    <mat-chip [class]="'role-' + user.role">
                      {{ getRoleLabel(user.role) }}
                    </mat-chip>
                   </td>
                  <td>
                    <mat-slide-toggle
                      [checked]="user.isActive"
                      (change)="toggleUserStatus(user)"
                      color="primary">
                      {{ user.isActive ? 'Actif' : 'Inactif' }}
                    </mat-slide-toggle>
                   </td>
                  <td>{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td class="actions-cell">
                    <button mat-icon-button color="warn" (click)="deleteUser(user)" matTooltip="Supprimer">
                      <mat-icon>delete</mat-icon>
                    </button>
                   </td>
                 </tr>
              </tbody>
            </table>

            <div *ngIf="users.length === 0" class="empty-state">
              <mat-icon>people_outline</mat-icon>
              <h3>Aucun utilisateur</h3>
              <p>Aucun utilisateur n'est enregistré pour le moment</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .users-card {
      border-radius: 16px;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
    }
    .table-container {
      overflow-x: auto;
    }
    .users-table {
      width: 100%;
      border-collapse: collapse;
    }
    .users-table th,
    .users-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    .users-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #333;
    }
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }
    .balance {
      font-weight: 600;
      color: #4caf50;
    }
    .role-admin {
      background: #ff9800;
      color: white;
    }
    .role-super_admin {
      background: #f44336;
      color: white;
    }
    .role-user {
      background: #2196f3;
      color: white;
    }
    .actions-cell {
      white-space: nowrap;
    }
    .empty-state {
      text-align: center;
      padding: 60px;
      color: #999;
    }
    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  isLoading = true;

  constructor(
    private adminDataService: AdminDataService,
    private notificationService: NotificationService
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

  // CORRECTION: Nouvelle méthode pour obtenir les initiales
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
}