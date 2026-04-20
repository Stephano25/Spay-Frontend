import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLang: string = 'fr';

  private translations: any = {
    'Tableau de bord': { fr: 'Tableau de bord', mg: 'Takelaka fandraisana', en: 'Dashboard' },
    'Utilisateurs': { fr: 'Utilisateurs', mg: 'Mpampiasa', en: 'Users' },
    'Transactions': { fr: 'Transactions', mg: 'Fifanakalozana', en: 'Transactions' },
    'Statistiques': { fr: 'Statistiques', mg: 'Antontanisa', en: 'Statistics' },
    'Paramètres': { fr: 'Paramètres', mg: 'Fanamarihana', en: 'Settings' },
    'Mon Profil': { fr: 'Mon Profil', mg: 'Momoko', en: 'My Profile' },
    'Déconnexion': { fr: 'Déconnexion', mg: 'Hivoaka', en: 'Logout' },
    'Administrateur': { fr: 'Administrateur', mg: 'Mpandrindra', en: 'Administrator' },
    'Utilisateur': { fr: 'Utilisateur', mg: 'Mpampiasa', en: 'User' },
    'Portefeuille': { fr: 'Portefeuille', mg: 'Poketra', en: 'Wallet' },
    'Amis': { fr: 'Amis', mg: 'Namana', en: 'Friends' },
    'Messages': { fr: 'Messages', mg: 'Hafatra', en: 'Messages' },
    'Scanner': { fr: 'Scanner', mg: 'Scanner', en: 'Scanner' },
    'Mobile Money': { fr: 'Mobile Money', mg: 'Volan\'ny finday', en: 'Mobile Money' },
    'Profil': { fr: 'Profil', mg: 'Momoko', en: 'Profile' }
  };

  constructor() {
    const savedLang = localStorage.getItem('language') || 'fr';
    this.currentLang = savedLang;
    console.log(`🌐 Langue actuelle: ${this.currentLang}`);
  }

  setLanguage(lang: string): void {
    this.currentLang = lang;
    localStorage.setItem('language', lang);
    console.log(`🌐 Langue changée: ${lang}`);
  }

  getCurrentLanguage(): string {
    return this.currentLang;
  }

  translate(key: string): string {
    const translation = this.translations[key];
    if (translation && translation[this.currentLang]) {
      return translation[this.currentLang];
    }
    return key;
  }
}