// src/app/components/auth/callback.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  styles: [`
    .callback-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 28px;
      background: var(--bg);
      position: relative;
      overflow: hidden;
    }

    /* Orbes de fond identiques au dashboard admin */
    .callback-container::before {
      content: '';
      position: absolute;
      width: 500px; height: 500px;
      top: -180px; right: -180px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(99,102,241,0.07), rgba(139,92,246,0.04));
      pointer-events: none;
      animation: orb 18s ease-in-out infinite;
    }

    .callback-container::after {
      content: '';
      position: absolute;
      width: 360px; height: 360px;
      bottom: -120px; left: -80px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(139,92,246,0.05), rgba(99,102,241,0.03));
      pointer-events: none;
      animation: orb 24s ease-in-out infinite reverse;
    }

    /* Logo animé — même style que le dashboard */
    .callback-logo {
      width: 76px; height: 76px;
      border-radius: 22px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(99,102,241,0.35);
      animation: float 3.5s ease-in-out infinite;
      position: relative;
      z-index: 2;
    }

    .callback-logo mat-icon {
      font-size: 36px !important;
      width: 36px !important; height: 36px !important;
      color: white;
    }

    /* Card centrale */
    .callback-card {
      background: var(--surface);
      border: 0.5px solid var(--border);
      border-radius: 28px;
      padding: 40px 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      animation: scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
      position: relative;
      z-index: 2;
      min-width: 300px;
      text-align: center;
    }

    /* Spinner personnalisé */
    .spinner-wrapper {
      position: relative;
      width: 56px; height: 56px;
    }

    .spinner-ring {
      width: 56px; height: 56px;
      border-radius: 50%;
      border: 3px solid var(--border);
      border-top-color: #6366f1;
      border-right-color: #8b5cf6;
      animation: spin 0.85s linear infinite;
    }

    /* Texte */
    .callback-title {
      font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text, #0f0e1a);
      letter-spacing: -0.01em;
      margin: 0;
    }

    .callback-subtitle {
      font-size: 0.8125rem;
      color: var(--text-3, #7c7a92);
      margin: -8px 0 0;
      font-weight: 400;
    }

    /* Barre de progression */
    .progress-bar {
      width: 100%;
      height: 3px;
      background: var(--border);
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      border-radius: 999px;
      animation: progressSlide 1.8s ease-in-out infinite;
    }

    /* ── Animations ── */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-6px); }
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }

    @keyframes orb {
      0%,100% { transform: translate(0,0) scale(1); }
      33%     { transform: translate(-14px,10px) scale(1.04); }
      66%     { transform: translate(10px,-14px) scale(0.97); }
    }

    @keyframes progressSlide {
      0%   { transform: translateX(-100%); }
      50%  { transform: translateX(0%); }
      100% { transform: translateX(100%); }
    }
  `],
  template: `
    <div class="callback-container">
      <!-- Logo flottant -->
      <div class="callback-logo">
        <mat-icon>account_balance_wallet</mat-icon>
      </div>

      <!-- Card de chargement -->
      <div class="callback-card">
        <!-- Spinner -->
        <div class="spinner-wrapper">
          <div class="spinner-ring"></div>
        </div>

        <!-- Textes -->
        <div>
          <p class="callback-title">Connexion en cours…</p>
          <p class="callback-subtitle">Vérification de vos identifiants</p>
        </div>

        <!-- Barre de progression -->
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];

      if (!token) {
        this.router.navigate(['/login']);
        return;
      }

      localStorage.setItem('token', token);

      this.authService.getProfile().subscribe({
        next: (user) => {
          localStorage.setItem('user', JSON.stringify(user));
          this.authService.updateCurrentUser(user);

          // Redirection selon le rôle
          const isAdmin = user.role === 'admin' || user.role === 'super_admin';
          this.router.navigate([isAdmin ? '/admin' : '/user']);
        },
        error: () => {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        }
      });
    });
  }
}