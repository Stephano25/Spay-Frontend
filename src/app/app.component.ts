import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'SPaye - Service de Paiement';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Vérifier si l'utilisateur est valide
    const user = this.authService.getCurrentUser();
    if (user && (!user.id || user.balance === undefined)) {
      console.log('Utilisateur invalide, déconnexion');
      this.authService.logout();
    }
  }
}