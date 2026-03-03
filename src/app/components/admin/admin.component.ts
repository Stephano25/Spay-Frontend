import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { AuthService } from '../../services/auth.service';

// Models
import { User } from '../../models/user.model';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './admin.component.html', // CORRIGÉ: admin.component.html au lieu de login.component.html
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, OnDestroy { // Bien exporté
  admin: User | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAdminData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadAdminData(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user: User | null) => {
        this.admin = user;
      })
    );
  }

  logout(): void {
    this.authService.logout();
  }
}