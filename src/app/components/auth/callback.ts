// src/app/components/auth/callback.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { BaseComponent } from '../base.component';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule, TranslatePipe],
  styles: [`
    /* ============================================================
   SPAYE — AUTH CALLBACK
   ============================================================ */

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

.callback-container::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  top: -180px;
  right: -180px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.07), rgba(139, 92, 246, 0.04));
  pointer-events: none;
}

.callback-container::after {
  content: '';
  position: absolute;
  width: 360px;
  height: 360px;
  bottom: -120px;
  left: -80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(99, 102, 241, 0.03));
  pointer-events: none;
}

.callback-logo {
  width: 76px;
  height: 76px;
  border-radius: 22px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
  position: relative;
  z-index: 2;
}

.callback-logo mat-icon {
  font-size: 36px !important;
  width: 36px !important;
  height: 36px !important;
  color: white;
}

.callback-card {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 28px;
  padding: 40px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 2;
  min-width: 300px;
  text-align: center;
}

  .spinner-wrapper {
  position: relative;
  width: 56px;
  height: 56px;
  }

  .spinner-ring {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 3px solid var(--border);
  border-top-color: #6366f1;
  border-right-color: #8b5cf6;
  animation: spin 0.85s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .callback-title {
  font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
  margin: 0;
  }

  .callback-subtitle {
  font-size: 0.8125rem;
  color: var(--text-3);
  margin: -8px 0 0;
  font-weight: 400;
  }

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

  @keyframes progressSlide {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
    }
  }

  .error-message {
  color: #ef4444;
  font-size: 0.9rem;
  margin-top: 12px;
  }

  .btn-retry {
  margin-top: 12px;
  padding: 10px 30px;
  border: none;
  border-radius: 8px;
  background: #7c3aed;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  }

  .btn-retry:hover {
  background: #6d28d9;
  transform: translateY(-2px);
  }

  .success-icon {
  font-size: 48px !important;
  width: 48px !important;
  height: 48px !important;
  color: #10b981 !important;
  }

  /* Responsive */
  @media (max-width: 600px) {
  .callback-card {
    padding: 28px 24px;
    min-width: unset;
    width: 100%;
    max-width: 380px;
    border-radius: 20px;
  }
  .callback-logo {
    width: 60px;
    height: 60px;
  }
  .callback-logo mat-icon {
    font-size: 28px !important;
    width: 28px !important;
    height: 28px !important;
  }
  .callback-title {
    font-size: 1rem;
    }
  }

  @media (max-width: 400px) {
  .callback-card {
    padding: 20px 16px;
  }
  .callback-logo {
    width: 52px;
    height: 52px;
  }
  .callback-logo mat-icon {
    font-size: 24px !important;
    width: 24px !important;
    height: 24px !important;
  }
  .spinner-wrapper {
    width: 44px;
    height: 44px;
  }
  .spinner-ring {
    width: 44px;
    height: 44px;
  }
  }`],
  template: `
    <div class="callback-container">
      <div class="callback-logo">
        <mat-icon>account_balance_wallet</mat-icon>
      </div>

      <div class="callback-card">
        <!-- Loading -->
        <div *ngIf="isProcessing">
          <div class="spinner-wrapper">
            <div class="spinner-ring"></div>
          </div>
          <p class="callback-title">Connexion en cours…</p>
          <p class="callback-subtitle">Vérification de vos identifiants</p>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>

        <!-- Succès -->
        <div *ngIf="!isProcessing && !error">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <p class="callback-title">Connexion réussie !</p>
          <p class="callback-subtitle">Redirection en cours...</p>
        </div>

        <!-- Erreur -->
        <div *ngIf="!isProcessing && error">
          <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: #ef4444;">error</mat-icon>
          <p class="callback-title">Erreur de connexion</p>
          <p class="callback-subtitle error-message">{{ error }}</p>
          <button class="btn-retry" (click)="retry()">Réessayer</button>
        </div>
      </div>
    </div>
  `
})
export class AuthCallbackComponent extends BaseComponent implements OnInit {
  isProcessing = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {super();}

  override ngOnInit(): void {
    // ✅ Extraire le token des query params
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      this.handleToken(token);
    });

    // ✅ Fallback: si token dans le fragment (pour certains OAuth)
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        const params = new URLSearchParams(fragment);
        const token = params.get('token');
        if (token) {
          this.handleToken(token);
        }
      }
    });
  }

  private handleToken(token: string | null): void {
    if (!token) {
      this.isProcessing = false;
      this.error = 'Token manquant. Veuillez réessayer.';
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    console.log('✅ Token reçu:', token.substring(0, 20) + '...');

    // ✅ Sauvegarder le token
    localStorage.setItem('token', token);

    // ✅ Récupérer le profil
    this.authService.getProfile().subscribe({
      next: (user) => {
        console.log('👤 Profil récupéré:', user.email, 'Rôle:', user.role);
        localStorage.setItem('user', JSON.stringify(user));
        this.authService.updateCurrentUser(user);

        this.isProcessing = false;

        // ✅ Redirection selon le rôle
        setTimeout(() => {
          if (user.role === 'admin' || user.role === 'super_admin') {
            console.log('🔑 Admin, redirection vers /admin/dashboard');
            this.router.navigate(['/admin/dashboard']);
          } else {
            console.log('👤 User, redirection vers /user/dashboard');
            this.router.navigate(['/user/dashboard']);
          }
        }, 500);
      },
      error: (err) => {
        this.isProcessing = false;
        this.error = 'Erreur lors de la récupération du profil. Veuillez réessayer.';
        console.error('❌ Erreur callback:', err);
        localStorage.removeItem('token');
        setTimeout(() => this.router.navigate(['/login']), 3000);
      }
    });
  }

  retry(): void {
    this.error = null;
    this.isProcessing = true;
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 500);
  }
}