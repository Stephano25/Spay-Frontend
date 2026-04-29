import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styles: []
})
export class AppComponent implements OnInit {
  title = 'SPaye - Service de Paiement';

  ngOnInit(): void {
    // Charger la taille de police sauvegardée
    const savedFontSize = localStorage.getItem('font-size');
    if (savedFontSize && ['small', 'medium', 'large'].includes(savedFontSize)) {
      const body = document.body;
      body.classList.remove('font-small', 'font-medium', 'font-large');
      body.classList.add(`font-${savedFontSize}`);
    } else {
      // Appliquer la taille par défaut (medium)
      document.body.classList.add('font-medium');
    }
  }
}