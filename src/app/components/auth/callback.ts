// src/app/components/auth/callback.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // ✅ Ajout

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule], // ✅ Ajout du module
  template: `
    <div style="display:flex; justify-content:center; align-items:center; height:100vh; flex-direction:column; gap:20px;">
      <mat-spinner diameter="50"></mat-spinner>
      <p>Connexion en cours...</p>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; background: var(--bg); }
  `]
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        // Sauvegarder le token
        localStorage.setItem('token', token);

        // Récupérer le profil utilisateur
        this.authService.getProfile().subscribe({
          next: (user) => {
            localStorage.setItem('user', JSON.stringify(user));
            this.authService.updateCurrentUser(user);
            this.router.navigate(['/user']);
          },
          error: (err) => {
            console.error('Erreur lors du chargement du profil:', err);
            this.router.navigate(['/login']);
          }
        });
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}