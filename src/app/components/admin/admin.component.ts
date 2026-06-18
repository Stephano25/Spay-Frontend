import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit, OnDestroy {
  admin: User | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user) => (this.admin = user))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  logout(): void {
    this.authService.logout();
  }
}