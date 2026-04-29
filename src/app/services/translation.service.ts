import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLang: string = 'fr';
  private languageSubject = new BehaviorSubject<string>('fr');
  public language$ = this.languageSubject.asObservable();

  // Dictionnaire complet des traductions - SANS DOUBLONS
  private translations: any = {
    // Dashboard User
    'Bienvenue sur SPaye': { fr: 'Bienvenue sur SPaye', mg: 'Tongasoa eto SPaye', en: 'Welcome to SPaye' },
    'Tableau de bord utilisateur': { fr: 'Tableau de bord utilisateur', mg: 'Takelaka fandraisan\'ny mpampiasa', en: 'User Dashboard' },
    'Vous êtes connecté en tant que :': { fr: 'Vous êtes connecté en tant que :', mg: 'Niditra ho :', en: 'You are logged in as :' },
    'Email :': { fr: 'Email :', mg: 'Mailaka :', en: 'Email :' },
    'Chargement du solde...': { fr: 'Chargement du solde...', mg: 'Fanaparitahana ny vola...', en: 'Loading balance...' },
    'Votre solde': { fr: 'Votre solde', mg: 'Ny volanao', en: 'Your balance' },
    
    // Menu items
    'Portefeuille': { fr: 'Portefeuille', mg: 'Poketra', en: 'Wallet' },
    'Messages': { fr: 'Messages', mg: 'Hafatra', en: 'Messages' },
    'Profil': { fr: 'Profil', mg: 'Momoko', en: 'Profile' },
    'Scanner': { fr: 'Scanner', mg: 'Scanner', en: 'Scanner' },
    'Mobile Money': { fr: 'Mobile Money', mg: 'Volan\'ny finday', en: 'Mobile Money' },
    'Amis': { fr: 'Amis', mg: 'Namana', en: 'Friends' },
    'Paramètres': { fr: 'Paramètres', mg: 'Fanamarihana', en: 'Settings' },
    
    // Stats
    'Transactions': { fr: 'Transactions', mg: 'Fifanakalozana', en: 'Transactions' },
    'Plus grosse': { fr: 'Plus grosse', mg: 'Be indrindra', en: 'Largest' },
    'Dernières transactions': { fr: 'Dernières transactions', mg: 'Fifanakalozana farany', en: 'Latest transactions' },
    'Voir tout': { fr: 'Voir tout', mg: 'Jereo daholo', en: 'View all' },
    'Transfert': { fr: 'Transfert', mg: 'Famindrana', en: 'Transfer' },
    
    // Empty state
    'Aucune transaction': { fr: 'Aucune transaction', mg: 'Tsy misy fifanakalozana', en: 'No transactions' },
    'Commencez à utiliser SPaye en effectuant votre première transaction': { 
      fr: 'Commencez à utiliser SPaye en effectuant votre première transaction', 
      mg: 'Manomboha mampiasa SPaye amin\'ny fifanakalozana voalohany', 
      en: 'Start using SPaye by making your first transaction' 
    },
    'Scanner un QR code': { fr: 'Scanner un QR code', mg: 'Scan QR code', en: 'Scan QR code' },
    
    // Actions
    'Actualiser': { fr: 'Actualiser', mg: 'Havaozina', en: 'Refresh' },
    'Déconnexion': { fr: 'Déconnexion', mg: 'Hivoaka', en: 'Logout' },
    'Retour': { fr: 'Retour', mg: 'Hiverina', en: 'Back' },
    'Réinitialiser': { fr: 'Réinitialiser', mg: 'Averina', en: 'Reset' },
    
    // Paramètres - Général
    'Chargement de vos paramètres...': { fr: 'Chargement de vos paramètres...', mg: 'Fanaparitahana ny fanamarihana...', en: 'Loading settings...' },
    
    // Formulaire profil
    'Informations personnelles': { fr: 'Informations personnelles', mg: 'Fampahalalana manokana', en: 'Personal information' },
    'Modifiez vos informations de base': { fr: 'Modifiez vos informations de base', mg: 'Hanova ny fampahalalanao fototra', en: 'Edit your basic information' },
    'Prénom': { fr: 'Prénom', mg: 'Anarana', en: 'First name' },
    'Nom': { fr: 'Nom', mg: 'Fanampiny', en: 'Last name' },
    'Email': { fr: 'Email', mg: 'Mailaka', en: 'Email' },
    'Téléphone': { fr: 'Téléphone', mg: 'Telefaonina', en: 'Phone' },
    'Bio': { fr: 'Bio', mg: 'Tantara fohy', en: 'Bio' },
    'Prénom requis': { fr: 'Prénom requis', mg: 'Ilaina ny anarana', en: 'First name required' },
    'Nom requis': { fr: 'Nom requis', mg: 'Ilaina ny fanampiny', en: 'Last name required' },
    'Minimum 2 caractères': { fr: 'Minimum 2 caractères', mg: 'Fara-fahakeliny 2 litera', en: 'Minimum 2 characters' },
    'Email requis': { fr: 'Email requis', mg: 'Ilaina ny mailaka', en: 'Email required' },
    'Email invalide': { fr: 'Email invalide', mg: 'Mailaka diso', en: 'Invalid email' },
    'Format invalide (9-10 chiffres)': { fr: 'Format invalide (9-10 chiffres)', mg: 'Endrika diso (9-10 isa)', en: 'Invalid format (9-10 digits)' },
    'Parlez-nous de vous...': { fr: 'Parlez-nous de vous...', mg: 'Lazao momba anao...', en: 'Tell us about yourself...' },
    'Enregistrer les modifications': { fr: 'Enregistrer les modifications', mg: 'Tehirizina ny fanovana', en: 'Save changes' },
    
    // Mot de passe
    'Changer le mot de passe': { fr: 'Changer le mot de passe', mg: 'Hanova tenimiafina', en: 'Change password' },
    'Mettez à jour votre mot de passe': { fr: 'Mettez à jour votre mot de passe', mg: 'Havaozy ny tenimiafinao', en: 'Update your password' },
    'Mot de passe actuel': { fr: 'Mot de passe actuel', mg: 'Tenimiafina ankehitriny', en: 'Current password' },
    'Nouveau mot de passe': { fr: 'Nouveau mot de passe', mg: 'Tenimiafina vaovao', en: 'New password' },
    'Confirmer le mot de passe': { fr: 'Confirmer le mot de passe', mg: 'Hamafy ny tenimiafina', en: 'Confirm password' },
    'Mot de passe actuel requis': { fr: 'Mot de passe actuel requis', mg: 'Ilaina ny tenimiafina ankehitriny', en: 'Current password required' },
    'Nouveau mot de passe requis': { fr: 'Nouveau mot de passe requis', mg: 'Ilaina ny tenimiafina vaovao', en: 'New password required' },
    'Les mots de passe ne correspondent pas': { fr: 'Les mots de passe ne correspondent pas', mg: 'Tsy mitovy ny tenimiafina', en: 'Passwords do not match' },
    
    // Notifications
    'Préférences de notification': { fr: 'Préférences de notification', mg: 'Safidin\'ny fampahafantarana', en: 'Notification preferences' },
    'Gérez comment vous recevez les notifications': { fr: 'Gérez comment vous recevez les notifications', mg: 'Karohy ny fandraisanao fampahafantarana', en: 'Manage how you receive notifications' },
    'Notifications par email': { fr: 'Notifications par email', mg: 'Fampahafantarana amin\'ny mailaka', en: 'Email notifications' },
    'Recevez des notifications sur votre adresse email': { fr: 'Recevez des notifications sur votre adresse email', mg: 'Mahazoa fampahafantarana amin\'ny adiresy mailakao', en: 'Receive notifications on your email address' },
    'Notifications push': { fr: 'Notifications push', mg: 'Fampahafantarana push', en: 'Push notifications' },
    'Recevez des notifications sur votre navigateur': { fr: 'Recevez des notifications sur votre navigateur', mg: 'Mahazoa fampahafantarana amin\'ny navigateur-nao', en: 'Receive notifications on your browser' },
    'Notifications par SMS': { fr: 'Notifications par SMS', mg: 'Fampahafantarana amin\'ny SMS', en: 'SMS notifications' },
    'Recevez des notifications par SMS': { fr: 'Recevez des notifications par SMS', mg: 'Mahazoa fampahafantarana amin\'ny SMS', en: 'Receive SMS notifications' },
    'Alertes de transaction': { fr: 'Alertes de transaction', mg: 'Fampandremana fifanakalozana', en: 'Transaction alerts' },
    'Soyez notifié lors de chaque transaction': { fr: 'Soyez notifié lors de chaque transaction', mg: 'Mahazoa fampandremana isaky ny fifanakalozana', en: 'Get notified on every transaction' },
    'Offres promotionnelles': { fr: 'Offres promotionnelles', mg: 'Tolotra dokam-barotra', en: 'Promotional offers' },
    'Recevez nos offres spéciales et promotions': { fr: 'Recevez nos offres spéciales et promotions', mg: 'Mahazoa ny tolotra manokana sy dokam-barotra', en: 'Receive our special offers and promotions' },
    
    // Confidentialité
    'Confidentialité': { fr: 'Confidentialité', mg: 'Fiangonan\'ny tsiambaratelo', en: 'Privacy' },
    'Contrôlez qui peut voir vos informations': { fr: 'Contrôlez qui peut voir vos informations', mg: 'Fehizo izay afaka mahita ny fampahalalanao', en: 'Control who can see your information' },
    'Visibilité du profil': { fr: 'Visibilité du profil', mg: 'Fahitana ny momoko', en: 'Profile visibility' },
    'Public': { fr: 'Public', mg: 'Ho an\'ny rehetra', en: 'Public' },
    'Amis uniquement': { fr: 'Amis uniquement', mg: 'Namana ihany', en: 'Friends only' },
    'Privé': { fr: 'Privé', mg: 'Mangingina', en: 'Private' },
    'Afficher la dernière connexion': { fr: 'Afficher la dernière connexion', mg: 'Aseho ny fidirana farany', en: 'Show last seen' },
    'Afficher le statut en ligne': { fr: 'Afficher le statut en ligne', mg: 'Aseho ny satan\'ny aterineto', en: 'Show online status' },
    'Autoriser les demandes d\'ami': { fr: 'Autoriser les demandes d\'ami', mg: 'Avela ny fangatahana namana', en: 'Allow friend requests' },
    
    // Sécurité
    'Sécurité du compte': { fr: 'Sécurité du compte', mg: 'Fiarovana ny kaonty', en: 'Account security' },
    'Renforcez la sécurité de votre compte': { fr: 'Renforcez la sécurité de votre compte', mg: 'Hanamafy ny fiarovan\'ny kaontinao', en: 'Strengthen your account security' },
    'Authentification à deux facteurs (2FA)': { fr: 'Authentification à deux facteurs (2FA)', mg: 'Fanamarinana roa lafin-javatra (2FA)', en: 'Two-factor authentication (2FA)' },
    'Ajoutez une couche de sécurité supplémentaire à votre compte': { fr: 'Ajoutez une couche de sécurité supplémentaire à votre compte', mg: 'Manampy sosona fiarovana fanampiny amin\'ny kaontinao', en: 'Add an extra layer of security to your account' },
    'Délai d\'expiration de session': { fr: 'Délai d\'expiration de session', mg: 'Fe-potoanan\'ny session', en: 'Session timeout' },
    'Alertes de connexion': { fr: 'Alertes de connexion', mg: 'Fampandremana fidirana', en: 'Login alerts' },
    'Recevez une notification à chaque nouvelle connexion': { fr: 'Recevez une notification à chaque nouvelle connexion', mg: 'Mahazoa fampandremana isaky ny fidirana vaovao', en: 'Receive a notification on every new login' },
    '15 minutes': { fr: '15 minutes', mg: '15 minitra', en: '15 minutes' },
    '30 minutes': { fr: '30 minutes', mg: '30 minitra', en: '30 minutes' },
    '1 heure': { fr: '1 heure', mg: '1 ora', en: '1 hour' },
    '2 heures': { fr: '2 heures', mg: '2 ora', en: '2 hours' },
    'Jamais': { fr: 'Jamais', mg: 'Tsy mbola', en: 'Never' },
    
    // Zone dangereuse
    'Zone dangereuse': { fr: 'Zone dangereuse', mg: 'Faritra mampidi-doza', en: 'Danger zone' },
    'Supprimer mon compte': { fr: 'Supprimer mon compte', mg: 'Hamafa ny kaontiko', en: 'Delete my account' },
    'Cette action est irréversible. Toutes vos données seront supprimées.': { 
      fr: 'Cette action est irréversible. Toutes vos données seront supprimées.', 
      mg: 'Ity hetsika ity dia tsy azo averina. Ny angon-drakitrao rehetra dia hofafana.', 
      en: 'This action is irreversible. All your data will be deleted.' 
    },
    
    // Apparence
    'Apparence': { fr: 'Apparence', mg: 'Bika', en: 'Appearance' },
    'Personnalisez l\'apparence de l\'application': { fr: 'Personnalisez l\'apparence de l\'application', mg: 'Manamboatra ny bikan\'ny fampiharana', en: 'Customize the application appearance' },
    'Langue': { fr: 'Langue', mg: 'Fiteny', en: 'Language' },
    'Français': { fr: 'Français', mg: 'Frantsay', en: 'French' },
    'Malagasy': { fr: 'Malagasy', mg: 'Malagasy', en: 'Malagasy' },
    'English': { fr: 'English', mg: 'Anglisy', en: 'English' },
    'Thème': { fr: 'Thème', mg: 'Loko', en: 'Theme' },
    'Clair': { fr: 'Clair', mg: 'Mazava', en: 'Light' },
    'Sombre': { fr: 'Sombre', mg: 'Maizina', en: 'Dark' },
    'Système': { fr: 'Système', mg: 'Rafitra', en: 'System' },
    'Taille de police': { fr: 'Taille de police', mg: 'Haben\'ny soratra', en: 'Font size' },
    'Petite': { fr: 'Petite', mg: 'Kely', en: 'Small' },
    'Moyenne': { fr: 'Moyenne', mg: 'Antonony', en: 'Medium' },
    'Grande': { fr: 'Grande', mg: 'Lehibe', en: 'Large' },
    'Mode compact': { fr: 'Mode compact', mg: 'Fomba kely', en: 'Compact mode' },
    'Afficher plus d\'informations en réduisant les espacements': { 
      fr: 'Afficher plus d\'informations en réduisant les espacements', 
      mg: 'Aseho fampahalalana bebe kokoa amin\'ny fampihenana ny elanelana', 
      en: 'Show more information by reducing spacing' 
    }
  };

  constructor() {
    const savedLang = localStorage.getItem('user_language') || 'fr';
    this.currentLang = savedLang;
    console.log(`🌐 Langue actuelle: ${this.currentLang}`);
  }

  setLanguage(lang: string): void {
    this.currentLang = lang;
    localStorage.setItem('user_language', lang);
    this.languageSubject.next(lang);
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

  t(key: string): string {
    return this.translate(key);
  }
}