import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';  // ← import correct
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
    RouterModule,      // ajouté pour les liens éventuels
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
  template: `
    <!-- Barre d'outils avec bouton retour -->
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="goBack()" matTooltip="Retour">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <span>Gestion des utilisateurs</span>
    </mat-toolbar>

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
                    <div class="user-avatar">{{ getUserInitials(user) }}</div>
                    <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
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
    /* ============================================================
   ADMIN USERS — SPaye
   ============================================================ */

.users-container {
  min-height: 100vh;
  background: var(--bg);
  padding: 0;
}

/* ── Toolbar ── */
mat-toolbar {
  background: var(--surface) !important;
  border-bottom: 0.5px solid var(--border) !important;
  color: var(--text) !important;
  position: sticky; top: 0; z-index: 100;
  box-shadow: var(--shadow-xs) !important;
}

mat-toolbar button {
  color: var(--text-2) !important;
  border-radius: 50% !important;
  transition: all var(--trans-base) !important;
}

mat-toolbar button:hover {
  background: var(--hover) !important;
  color: var(--brand-1) !important;
}

/* ── Content wrapper ── */
.users-content {
  max-width: 1300px;
  margin: 0 auto;
  padding: 28px 24px;
}

/* ── Users Card ── */
.users-card {
  border-radius: var(--r-xl) !important;
  background: var(--surface) !important;
  border: 0.5px solid var(--border) !important;
  box-shadow: var(--shadow-md) !important;
  overflow: hidden;
  animation: fadeUp 0.4s var(--ease) both;
}

.users-card mat-card-header {
  padding: 22px 24px 0 !important;
  border-bottom: 0.5px solid var(--border);
  padding-bottom: 16px !important;
  background: var(--brand-grad-soft);
  display: flex; align-items: center; justify-content: space-between;
}

.users-card mat-card-title {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--font-sans) !important;
  font-size: 1.125rem !important;
  font-weight: 700 !important;
  color: var(--text) !important;
}

.users-card mat-card-title mat-icon { color: var(--brand-1) !important; }

.users-card mat-card-subtitle {
  color: var(--text-3) !important;
  font-size: 0.8125rem !important;
}

/* ── Loading ── */
.loading-container {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  min-height: 320px; gap: 16px;
  color: var(--text-3);
}

/* ── Table wrapper ── */
.table-container { overflow-x: auto; }

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.users-table th,
.users-table td {
  padding: 13px 18px;
  text-align: left;
  border-bottom: 0.5px solid var(--border);
}

.users-table th {
  background: var(--surface-2);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-3);
  white-space: nowrap;
  position: sticky; top: 0; z-index: 2;
}

.users-table tbody tr {
  transition: background var(--trans-base);
  animation: fadeUp 0.25s var(--ease) both;
}

.users-table tbody tr:hover { background: var(--hover); }
.users-table tbody tr:last-child td { border-bottom: none; }

/* ── User Cell ── */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: var(--brand-grad);
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 700; font-size: 13px;
  flex-shrink: 0; box-shadow: var(--shadow-brand);
}

.user-name {
  font-weight: 600;
  color: var(--text);
  font-size: 0.875rem;
}

/* ── Balance ── */
td.balance {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--success);
}

/* ── Role chips ── */
.role-admin,
.role-super_admin,
.role-user {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--r-pill);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.role-admin     { background: var(--warning-bg); color: var(--warning); }
.role-super_admin { background: var(--danger-bg); color: var(--danger); }
.role-user      { background: var(--info-bg);    color: var(--info); }

/* ── Actions cell ── */
.actions-cell { white-space: nowrap; }

.actions-cell button {
  transition: all var(--trans-base) !important;
  border-radius: 50% !important;
}

.actions-cell button:hover {
  background: var(--danger-bg) !important;
  color: var(--danger) !important;
  transform: scale(1.1);
}

/* ── Empty state ── */
.empty-state {
  text-align: center;
  padding: 56px 24px;
  display: flex; flex-direction: column;
  align-items: center; gap: 12px;
}

.empty-state mat-icon {
  font-size: 64px !important; width: 64px !important; height: 64px !important;
  color: var(--text-4); animation: float 3s ease-in-out infinite;
}

.empty-state h3 {
  font-family: var(--font-sans); font-size: 1.1rem;
  color: var(--text-2); margin: 0;
}

.empty-state p { color: var(--text-3); font-size: 0.875rem; margin: 0; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .users-content { padding: 16px 14px; }

  .users-table th,
  .users-table td { padding: 10px 12px; }

  .user-name { font-size: 0.8125rem; }
}
  `]
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