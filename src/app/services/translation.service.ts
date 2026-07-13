// frontend/src/app/services/translation.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLang: string = 'fr';
  private languageSubject = new BehaviorSubject<string>('fr');
  public language$ = this.languageSubject.asObservable();

  // ============================================================
  // DICTIONNAIRE COMPLET - TOUTES LES TRADUCTIONS
  // ============================================================
  private translations: any = {
    // ============================================================
    // HEADER / NAVIGATION
    // ============================================================
    'Retour': { fr: 'Retour', mg: 'Hiverina', en: 'Back' },
    'Actualiser': { fr: 'Actualiser', mg: 'Havaozina', en: 'Refresh' },
    'Déconnexion': { fr: 'Déconnexion', mg: 'Hivoaka', en: 'Logout' },
    'Navigation rapide': { fr: 'Navigation rapide', mg: 'Fitetezana haingana', en: 'Quick navigation' },
    'Mon Profil': { fr: 'Mon Profil', mg: 'Ny momoko', en: 'My Profile' },
    'Paramètres': { fr: 'Paramètres', mg: 'Fanamarihana', en: 'Settings' },
    'Administrateurs': { fr: 'Administrateurs', mg: 'Mpitantana', en: 'Administrators' },
    'Super Admin': { fr: 'Super Admin', mg: 'Mpitantana ambony', en: 'Super Admin' },
    'Admin': { fr: 'Admin', mg: 'Mpitantana', en: 'Admin' },
    'Utilisateurs': { fr: 'Utilisateurs', mg: 'Mpampiasa', en: 'Users' },
    'Transactions': { fr: 'Transactions', mg: 'Fifanakalozana', en: 'Transactions' },
    'Statistiques': { fr: 'Statistiques', mg: 'Antontan\'isa', en: 'Statistics' },
    'Portefeuille': { fr: 'Portefeuille', mg: 'Poketra', en: 'Wallet' },
    'Amis': { fr: 'Amis', mg: 'Namana', en: 'Friends' },
    'Messages': { fr: 'Messages', mg: 'Hafatra', en: 'Messages' },
    'Dépôt Admin': { fr: 'Dépôt Admin', mg: 'Fandoavam-bola mpitantana', en: 'Admin Deposit' },
    'Retrait Admin': { fr: 'Retrait Admin', mg: 'Famoaham-bola mpitantana', en: 'Admin Withdraw' },
    'Gestion': { fr: 'Gestion', mg: 'Fitantanana', en: 'Management' },
    'Tableau de bord': { fr: 'Tableau de bord', mg: 'Takelaka', en: 'Dashboard' },

    // ============================================================
    // USER DASHBOARD
    // ============================================================
    'Bienvenue sur SPaye': { fr: 'Bienvenue sur SPaye', mg: 'Tongasoa eto SPaye', en: 'Welcome to SPaye' },
    'Tableau de bord utilisateur': { fr: 'Tableau de bord utilisateur', mg: 'Takelaka fandraisan\'ny mpampiasa', en: 'User Dashboard' },
    'Vous êtes connecté en tant que :': { fr: 'Vous êtes connecté en tant que :', mg: 'Niditra ho :', en: 'You are logged in as :' },
    'Email :': { fr: 'Email :', mg: 'Mailaka :', en: 'Email :' },
    'Chargement du solde...': { fr: 'Chargement du solde...', mg: 'Fanaparitahana ny vola...', en: 'Loading balance...' },
    'Votre solde': { fr: 'Votre solde', mg: 'Ny volanao', en: 'Your balance' },
    'Solde disponible': { fr: 'Solde disponible', mg: 'Vola azo ampiasaina', en: 'Available balance' },
    'Envoyer': { fr: 'Envoyer', mg: 'Handefa', en: 'Send' },
    'Recevoir': { fr: 'Recevoir', mg: 'Hahazo', en: 'Receive' },
    'Scanner': { fr: 'Scanner', mg: 'Scanner', en: 'Scanner' },
    'Mobile Money': { fr: 'Mobile Money', mg: 'Volan\'ny finday', en: 'Mobile Money' },
    'Profil': { fr: 'Profil', mg: 'Momoko', en: 'Profile' },
    'Plus grosse': { fr: 'Plus grosse', mg: 'Be indrindra', en: 'Largest' },
    'Dernières transactions': { fr: 'Dernières transactions', mg: 'Fifanakalozana farany', en: 'Latest transactions' },
    'Voir tout': { fr: 'Voir tout', mg: 'Jereo daholo', en: 'View all' },
    'Transfert': { fr: 'Transfert', mg: 'Famindrana', en: 'Transfer' },
    'Aucune transaction': { fr: 'Aucune transaction', mg: 'Tsy misy fifanakalozana', en: 'No transactions' },
    'Commencez à utiliser SPaye en effectuant votre première transaction': {
      fr: 'Commencez à utiliser SPaye en effectuant votre première transaction',
      mg: 'Manomboha mampiasa SPaye amin\'ny fifanakalozana voalohany',
      en: 'Start using SPaye by making your first transaction'
    },

    // ============================================================
    // WALLET / PORTEFEUILLE
    // ============================================================
    'Mon portefeuille': { fr: 'Mon portefeuille', mg: 'Ny poketrako', en: 'My wallet' },
    'SPAYE WALLET': { fr: 'SPAYE WALLET', mg: 'SPAYE POKETRA', en: 'SPAYE WALLET' },
    'Envoyer de l\'argent': { fr: 'Envoyer de l\'argent', mg: 'Handefa vola', en: 'Send money' },
    'Recevoir de l\'argent': { fr: 'Recevoir de l\'argent', mg: 'Hahazo vola', en: 'Receive money' },
    'Historique des transactions': { fr: 'Historique des transactions', mg: 'Tantaran\'ny fifanakalozana', en: 'Transaction history' },
    'Solde': { fr: 'Solde', mg: 'Vola', en: 'Balance' },
    'Total reçu': { fr: 'Total reçu', mg: 'Vola voaray', en: 'Total received' },
    'Total envoyé': { fr: 'Total envoyé', mg: 'Vola nalefa', en: 'Total sent' },
    'Total dépôts': { fr: 'Total dépôts', mg: 'Total fandoavam-bola', en: 'Total deposits' },
    'Total retraits': { fr: 'Total retraits', mg: 'Total famoaham-bola', en: 'Total withdrawals' },
    'Transactions récentes': { fr: 'Transactions récentes', mg: 'Fifanakalozana farany', en: 'Recent transactions' },
    'Effectuer une transaction': { fr: 'Effectuer une transaction', mg: 'Manao fifanakalozana', en: 'Make a transaction' },
    'MGA · Ariary malgache': { fr: 'MGA · Ariary malgache', mg: 'MGA · Ariary malagasy', en: 'MGA · Malagasy Ariary' },
    'Réussi': { fr: 'Réussi', mg: 'Vita soa', en: 'Successful' },
    'En attente': { fr: 'En attente', mg: 'Miandry', en: 'Pending' },
    'Échoué': { fr: 'Échoué', mg: 'Tsy nahomby', en: 'Failed' },
    'Annulé': { fr: 'Annulé', mg: 'Nofoanana', en: 'Cancelled' },

    // ============================================================
    // SEND MONEY / ENVOYER
    // ============================================================
    'Envoi réussi !': { fr: 'Envoi réussi !', mg: 'Nalefa soa !', en: 'Sent successfully !' },
    'Destinataire': { fr: 'Destinataire', mg: 'Mpandray', en: 'Recipient' },
    'Montant (Ar)': { fr: 'Montant (Ar)', mg: 'Volana (Ar)', en: 'Amount (Ar)' },
    'Description (optionnelle)': { fr: 'Description (optionnelle)', mg: 'Famaritana (azo atao)', en: 'Description (optional)' },
    'Vous envoyez': { fr: 'Vous envoyez', mg: 'Alefanao', en: 'You send' },
    'À': { fr: 'À', mg: 'Ho an\'ny', en: 'To' },
    'Continuer': { fr: 'Continuer', mg: 'Hanohy', en: 'Continue' },
    'Confirmez l\'envoi': { fr: 'Confirmez l\'envoi', mg: 'Hamafy ny fandefasana', en: 'Confirm sending' },
    'Vérifiez les informations avant de confirmer': { fr: 'Vérifiez les informations avant de confirmer', mg: 'Jereo ny fampahalalana alohan\'ny hanamafiana', en: 'Check the information before confirming' },
    'Code de sécurité': { fr: 'Code de sécurité', mg: 'Kaody fiarovana', en: 'Security code' },
    'Confirmer l\'envoi': { fr: 'Confirmer l\'envoi', mg: 'Hamafy ny fandefasana', en: 'Confirm sending' },
    'ID de transaction': { fr: 'ID de transaction', mg: 'ID fifanakalozana', en: 'Transaction ID' },
    'Nouvel envoi': { fr: 'Nouvel envoi', mg: 'Fandefasana vaovao', en: 'New send' },
    'Retour au portefeuille': { fr: 'Retour au portefeuille', mg: 'Hiverina any amin\'ny poketra', en: 'Back to wallet' },

    // ============================================================
    // RECEIVE MONEY / RECEVOIR
    // ============================================================
    'Votre QR Code': { fr: 'Votre QR Code', mg: 'Ny QR Code-nao', en: 'Your QR Code' },
    'Scannez ce code pour recevoir de l\'argent': { fr: 'Scannez ce code pour recevoir de l\'argent', mg: 'Scano ity kaody ity mba hahazo vola', en: 'Scan this code to receive money' },
    'Code:': { fr: 'Code:', mg: 'Kaody:', en: 'Code:' },
    'Ajouter un montant': { fr: 'Ajouter un montant', mg: 'Manampy volana', en: 'Add an amount' },
    'Montant personnalisé': { fr: 'Montant personnalisé', mg: 'Volana manokana', en: 'Custom amount' },
    'Comment ça marche ?': { fr: 'Comment ça marche ?', mg: 'Ahoana no fiasany ?', en: 'How does it work ?' },
    'Partagez votre QR code': { fr: 'Partagez votre QR code', mg: 'Zarao ny QR Code-nao', en: 'Share your QR Code' },
    'Montrez ce code à la personne qui doit vous payer': { fr: 'Montrez ce code à la personne qui doit vous payer', mg: 'Asehoy ity kaody ity amin\'ny olona tokony handoa anao', en: 'Show this code to the person who needs to pay you' },
    'La personne scanne': { fr: 'La personne scanne', mg: 'Ny olona dia manao scan', en: 'The person scans' },
    'Elle scanne le code avec l\'application SPaye': { fr: 'Elle scanne le code avec l\'application SPaye', mg: 'Manao scan ny kaody amin\'ny fampiharana SPaye izy', en: 'She scans the code with the SPaye app' },
    'L\'argent est crédité': { fr: 'L\'argent est crédité', mg: 'Tafiditra ny vola', en: 'The money is credited' },
    'Le montant est instantanément ajouté à votre solde': { fr: 'Le montant est instantanément ajouté à votre solde', mg: 'Ampiana eo no ho eo amin\'ny volanao ny vola', en: 'The amount is instantly added to your balance' },
    'Ce QR code expire après 30 minutes pour votre sécurité': { fr: 'Ce QR code expire après 30 minutes pour votre sécurité', mg: 'Lany daty ity QR Code ity rehefa afaka 30 minitra ho fiarovana anao', en: 'This QR code expires after 30 minutes for your security' },

    // ============================================================
    // MOBILE MONEY
    // ============================================================
    'Transfert Mobile Money': { fr: 'Transfert Mobile Money', mg: 'Famindrana Mobile Money', en: 'Mobile Money Transfer' },
    'Choisissez votre opérateur': { fr: 'Choisissez votre opérateur', mg: 'Safidio ny mpandraharahanao', en: 'Choose your operator' },
    'Airtel Money': { fr: 'Airtel Money', mg: 'Airtel Money', en: 'Airtel Money' },
    'Orange Money': { fr: 'Orange Money', mg: 'Orange Money', en: 'Orange Money' },
    'MVola': { fr: 'MVola', mg: 'MVola', en: 'MVola' },
    'Opérateur': { fr: 'Opérateur', mg: 'Mpandraharaha', en: 'Operator' },
    'Numéro de téléphone': { fr: 'Numéro de téléphone', mg: 'Laharan-telefaonina', en: 'Phone number' },
    'Montant': { fr: 'Montant', mg: 'Volana', en: 'Amount' },
    'Frais': { fr: 'Frais', mg: 'Saram-pandraharahana', en: 'Fees' },
    'Total à débiter': { fr: 'Total à débiter', mg: 'Total alaina', en: 'Total to debit' },
    'Confirmez le transfert': { fr: 'Confirmez le transfert', mg: 'Hamafy ny famindrana', en: 'Confirm the transfer' },
    'Transfert réussi !': { fr: 'Transfert réussi !', mg: 'Vita soa ny famindrana !', en: 'Transfer successful !' },
    'Vous avez transféré': { fr: 'Vous avez transféré', mg: 'Nafindrao', en: 'You transferred' },
    'vers': { fr: 'vers', mg: 'ho an\'ny', en: 'to' },

    // ============================================================
    // SCAN PAY
    // ============================================================
    'Scanner & Payer': { fr: 'Scanner & Payer', mg: 'Scanner sy mandoa', en: 'Scan & Pay' },
    'Dépôt par QR Code': { fr: 'Dépôt par QR Code', mg: 'Fandoavam-bola amin\'ny QR Code', en: 'Deposit by QR Code' },
    'Retrait par QR Code': { fr: 'Retrait par QR Code', mg: 'Famoaham-bola amin\'ny QR Code', en: 'Withdraw by QR Code' },
    'Scannez le QR code dans le cadre': { fr: 'Scannez le QR code dans le cadre', mg: 'Ampidiro ao anaty sary ny QR code', en: 'Place the QR code in the frame' },
    'Scanner un QR code': { fr: 'Scanner un QR code', mg: 'Manao scan QR Code', en: 'Scan a QR Code' },
    'Placez le QR code dans le cadre de la caméra': { fr: 'Placez le QR code dans le cadre de la caméra', mg: 'Ampidiro ao anaty sary ny QR code', en: 'Place the QR code in the camera frame' },
    'Le scan est automatique, saisissez le montant': { fr: 'Le scan est automatique, saisissez le montant', mg: 'Mandeha ho azy ny scan, ampidiro ny volana', en: 'The scan is automatic, enter the amount' },
    'Confirmez la transaction': { fr: 'Confirmez la transaction', mg: 'Hamafy ny fifanakalozana', en: 'Confirm the transaction' },
    'Assurez-vous d\'autoriser l\'accès à la caméra': { fr: 'Assurez-vous d\'autoriser l\'accès à la caméra', mg: 'Ataovy azo antoka fa nahazoana alalana ny fakan-tsary', en: 'Make sure you allow camera access' },
    'Payer': { fr: 'Payer', mg: 'Mandoa', en: 'Pay' },
    'Déposer': { fr: 'Déposer', mg: 'Mametraka', en: 'Deposit' },
    'Retirer': { fr: 'Retirer', mg: 'Mamoaka', en: 'Withdraw' },

    // ============================================================
    // CHAT / MESSAGES
    // ============================================================
    'Nouvelle discussion': { fr: 'Nouvelle discussion', mg: 'Resaka vaovao', en: 'New conversation' },
    'Rechercher...': { fr: 'Rechercher...', mg: 'Mitady...', en: 'Search...' },
    'En ligne': { fr: 'En ligne', mg: 'Mavitrika', en: 'Online' },
    'Hors ligne': { fr: 'Hors ligne', mg: 'Tsy mavitrika', en: 'Offline' },
    'En train d\'écrire...': { fr: 'En train d\'écrire...', mg: 'Manoratra...', en: 'Typing...' },
    'Message supprimé': { fr: 'Message supprimé', mg: 'Hafatra voafafa', en: 'Message deleted' },
    'Appel audio': { fr: 'Appel audio', mg: 'Antso feo', en: 'Audio call' },
    'Appel vidéo': { fr: 'Appel vidéo', mg: 'Antso sary', en: 'Video call' },
    'Voir le profil': { fr: 'Voir le profil', mg: 'Jereo ny momoko', en: 'View profile' },
    'Bloquer': { fr: 'Bloquer', mg: 'Hanakana', en: 'Block' },
    'Débloquer': { fr: 'Débloquer', mg: 'Hanala ny fanakanana', en: 'Unblock' },
    'Écrire un message…': { fr: 'Écrire un message…', mg: 'Manoratra hafatra…', en: 'Write a message…' },

    // ============================================================
    // FRIENDS / AMIS
    // ============================================================
    'Mes amis': { fr: 'Mes amis', mg: 'Ny namako', en: 'My friends' },
    'Ajouter un ami': { fr: 'Ajouter un ami', mg: 'Manampy namana', en: 'Add friend' },
    'Demandes d\'amis': { fr: 'Demandes d\'amis', mg: 'Fangatahana namana', en: 'Friend requests' },
    'Suggestions': { fr: 'Suggestions', mg: 'Soso-kevitra', en: 'Suggestions' },
    'Résultats': { fr: 'Résultats', mg: 'Valiny', en: 'Results' },
    'Ami': { fr: 'Ami', mg: 'Namana', en: 'Friend' },
    'Bloqué': { fr: 'Bloqué', mg: 'Voasakana', en: 'Blocked' },
    'Envoyée': { fr: 'Envoyée', mg: 'Nalefa', en: 'Sent' },
    'Demande envoyée': { fr: 'Demande envoyée', mg: 'Fangatahana nalefa', en: 'Request sent' },
    'Accepter': { fr: 'Accepter', mg: 'Manaiky', en: 'Accept' },
    'Refuser': { fr: 'Refuser', mg: 'Mandà', en: 'Reject' },
    'Supprimer': { fr: 'Supprimer', mg: 'Mamafa', en: 'Delete' },
    'Mon QR code': { fr: 'Mon QR code', mg: 'Ny QR Code-ko', en: 'My QR Code' },
    'Utilisateurs bloqués': { fr: 'Utilisateurs bloqués', mg: 'Mpampiasa voasakana', en: 'Blocked users' },

    // ============================================================
    // ADMIN DASHBOARD
    // ============================================================
    'Chargement...': { fr: 'Chargement...', mg: 'Fandrasana...', en: 'Loading...' },
    'Actifs aujourd\'hui': { fr: 'Actifs aujourd\'hui', mg: 'Mavitrika androany', en: 'Active today' },
    'Volume total': { fr: 'Volume total', mg: 'Volana rehetra', en: 'Total volume' },
    'Actifs': { fr: 'Actifs', mg: 'Mavitrika', en: 'Active' },
    'Inactifs': { fr: 'Inactifs', mg: 'Tsy mavitrika', en: 'Inactive' },
    'actifs': { fr: 'actifs', mg: 'mavitrika', en: 'active' },
    'Activité quotidienne': { fr: 'Activité quotidienne', mg: 'Asa isan\'andro', en: 'Daily activity' },
    'Transactions et volume sur 7 jours': { fr: 'Transactions et volume sur 7 jours', mg: 'Fifanakalozana sy volana 7 andro', en: 'Transactions and volume over 7 days' },
    'Revenus': { fr: 'Revenus', mg: 'Fidiram-bola', en: 'Revenue' },
    'Gestion rapide': { fr: 'Gestion rapide', mg: 'Fitantanana haingana', en: 'Quick management' },
    'Utilisateurs récents': { fr: 'Utilisateurs récents', mg: 'Mpampiasa farany', en: 'Recent users' },
    'Top utilisateurs': { fr: 'Top utilisateurs', mg: 'Mpampiasa ambony', en: 'Top users' },
    'Actif': { fr: 'Actif', mg: 'Mavitrika', en: 'Active' },
    'Inactif': { fr: 'Inactif', mg: 'Tsy mavitrika', en: 'Inactive' },
    'transactions': { fr: 'transactions', mg: 'fifanakalozana', en: 'transactions' },
    'Gestion des utilisateurs': { fr: 'Gestion des utilisateurs', mg: 'Fitantanana ny mpampiasa', en: 'User management' },
    'Gestion des transactions': { fr: 'Gestion des transactions', mg: 'Fitantanana ny fifanakalozana', en: 'Transaction management' },
    'Accédez rapidement à vos fonctionnalités': { fr: 'Accédez rapidement à vos fonctionnalités', mg: 'Mahazoa haingana ny fitaovanao', en: 'Quickly access your features' },
    'Activité récente': { fr: 'Activité récente', mg: 'Asa farany', en: 'Recent activity' },

    // ============================================================
    // ADMIN SETTINGS
    // ============================================================
    'Paramètres d\'administration': { fr: 'Paramètres d\'administration', mg: 'Fanamarihana fitantanana', en: 'Administration settings' },
    'Chargement des paramètres...': { fr: 'Chargement des paramètres...', mg: 'Fanaparitahana ny fanamarihana...', en: 'Loading settings...' },
    'Super Administrateur': { fr: 'Super Administrateur', mg: 'Mpitantana ambony', en: 'Super Administrator' },
    'Administrateur': { fr: 'Administrateur', mg: 'Mpitantana', en: 'Administrator' },
    'Version': { fr: 'Version', mg: 'Dika', en: 'Version' },
    'Uptime': { fr: 'Uptime', mg: 'Fotoana niasana', en: 'Uptime' },
    'Sessions actives': { fr: 'Sessions actives', mg: 'Sessions mavitrika', en: 'Active sessions' },
    'Général': { fr: 'Général', mg: 'Ankapobeny', en: 'General' },
    'Enregistrer': { fr: 'Enregistrer', mg: 'Tehirizina', en: 'Save' },
    'Personnalisation': { fr: 'Personnalisation', mg: 'Fanamarinana', en: 'Customization' },
    'Couleur primaire': { fr: 'Couleur primaire', mg: 'Loko fototra', en: 'Primary color' },
    'Couleur secondaire': { fr: 'Couleur secondaire', mg: 'Loko fanampiny', en: 'Secondary color' },
    'CSS personnalisé': { fr: 'CSS personnalisé', mg: 'CSS manokana', en: 'Custom CSS' },
    'Informations système': { fr: 'Informations système', mg: 'Fampahalalana momba ny rafitra', en: 'System information' },

    // ============================================================
    // USER SETTINGS
    // ============================================================
    'Chargement de vos paramètres...': { fr: 'Chargement de vos paramètres...', mg: 'Fanaparitahana ny fanamarihana...', en: 'Loading settings...' },
    'Informations personnelles': { fr: 'Informations personnelles', mg: 'Fampahalalana manokana', en: 'Personal information' },
    'Modifiez vos informations de base': { fr: 'Modifiez vos informations de base', mg: 'Hanova ny fampahalalanao fototra', en: 'Edit your basic information' },
    'Prénom': { fr: 'Prénom', mg: 'Anarana', en: 'First name' },
    'Nom': { fr: 'Nom', mg: 'Fanampiny', en: 'Last name' },
    'Email': { fr: 'Email', mg: 'Mailaka', en: 'Email' },
    'Téléphone': { fr: 'Téléphone', mg: 'Telefaonina', en: 'Phone' },
    'Bio': { fr: 'Bio', mg: 'Tantara fohy', en: 'Bio' },
    'Prénom requis': { fr: 'Prénom requis', mg: 'Ilaina ny anarana', en: 'First name required' },
    'Nom requis': { fr: 'Nom requis', mg: 'Ilaina ny fanampiny', en: 'Last name required' },
    'Email requis': { fr: 'Email requis', mg: 'Ilaina ny mailaka', en: 'Email required' },
    'Email invalide': { fr: 'Email invalide', mg: 'Mailaka diso', en: 'Invalid email' },
    'Format invalide (9-10 chiffres)': { fr: 'Format invalide (9-10 chiffres)', mg: 'Endrika diso (9-10 isa)', en: 'Invalid format (9-10 digits)' },
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

    // ============================================================
    // SECURITY / SÉCURITÉ
    // ============================================================
    'Changer le mot de passe': { fr: 'Changer le mot de passe', mg: 'Hanova tenimiafina', en: 'Change password' },
    'Mettez à jour votre mot de passe': { fr: 'Mettez à jour votre mot de passe', mg: 'Havaozy ny tenimiafinao', en: 'Update your password' },
    'Mot de passe actuel': { fr: 'Mot de passe actuel', mg: 'Tenimiafina ankehitriny', en: 'Current password' },
    'Nouveau mot de passe': { fr: 'Nouveau mot de passe', mg: 'Tenimiafina vaovao', en: 'New password' },
    'Confirmer le mot de passe': { fr: 'Confirmer le mot de passe', mg: 'Hamafy ny tenimiafina', en: 'Confirm password' },
    'Sécurité du compte': { fr: 'Sécurité du compte', mg: 'Fiarovana ny kaonty', en: 'Account security' },
    'Renforcez la sécurité de votre compte': { fr: 'Renforcez la sécurité de votre compte', mg: 'Hanamafy ny fiarovan\'ny kaontinao', en: 'Strengthen your account security' },
    'Authentification à deux facteurs (2FA)': { fr: 'Authentification à deux facteurs (2FA)', mg: 'Fanamarinana roa lafin-javatra (2FA)', en: 'Two-factor authentication (2FA)' },
    'Alertes de connexion': { fr: 'Alertes de connexion', mg: 'Fampandremana fidirana', en: 'Login alerts' },
    'Délai d\'expiration de session': { fr: 'Délai d\'expiration de session', mg: 'Fe-potoanan\'ny session', en: 'Session timeout' },
    '15 minutes': { fr: '15 minutes', mg: '15 minitra', en: '15 minutes' },
    '30 minutes': { fr: '30 minutes', mg: '30 minitra', en: '30 minutes' },
    '1 heure': { fr: '1 heure', mg: '1 ora', en: '1 hour' },
    '2 heures': { fr: '2 heures', mg: '2 ora', en: '2 hours' },
    'Jamais': { fr: 'Jamais', mg: 'Tsy mbola', en: 'Never' },

    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    'Préférences de notification': { fr: 'Préférences de notification', mg: 'Safidin\'ny fampahafantarana', en: 'Notification preferences' },
    'Notifications par email': { fr: 'Notifications par email', mg: 'Fampahafantarana amin\'ny mailaka', en: 'Email notifications' },
    'Notifications push': { fr: 'Notifications push', mg: 'Fampahafantarana push', en: 'Push notifications' },
    'Notifications par SMS': { fr: 'Notifications par SMS', mg: 'Fampahafantarana amin\'ny SMS', en: 'SMS notifications' },

    // ============================================================
    // PRIVACY / CONFIDENTIALITÉ
    // ============================================================
    'Confidentialité': { fr: 'Confidentialité', mg: 'Fiangonan\'ny tsiambaratelo', en: 'Privacy' },
    'Visibilité du profil': { fr: 'Visibilité du profil', mg: 'Fahitana ny momoko', en: 'Profile visibility' },
    'Public': { fr: 'Public', mg: 'Ho an\'ny rehetra', en: 'Public' },
    'Amis uniquement': { fr: 'Amis uniquement', mg: 'Namana ihany', en: 'Friends only' },
    'Privé': { fr: 'Privé', mg: 'Mangingina', en: 'Private' },

    // ============================================================
    // DANGER ZONE / ZONE DANGEREUSE
    // ============================================================
    'Zone dangereuse': { fr: 'Zone dangereuse', mg: 'Faritra mampidi-doza', en: 'Danger zone' },
    'Supprimer mon compte': { fr: 'Supprimer mon compte', mg: 'Hamafa ny kaontiko', en: 'Delete my account' },
    'Cette action est irréversible. Toutes vos données seront supprimées.': {
      fr: 'Cette action est irréversible. Toutes vos données seront supprimées.',
      mg: 'Ity hetsika ity dia tsy azo averina. Ny angon-drakitrao rehetra dia hofafana.',
      en: 'This action is irreversible. All your data will be deleted.'
    },
    'Réinitialiser': { fr: 'Réinitialiser', mg: 'Averina', en: 'Reset' },

    // ============================================================
    // COMMISSIONS
    // ============================================================
    'Mes commissions': { fr: 'Mes commissions', mg: 'Ny komisionako', en: 'My commissions' },
    'Total commissions': { fr: 'Total commissions', mg: 'Komisiona rehetra', en: 'Total commissions' },
    'Transactions avec commission': { fr: 'Transactions avec commission', mg: 'Fifanakalozana misy komisiona', en: 'Transactions with commission' },
    'Dernières commissions': { fr: 'Dernières commissions', mg: 'Komisiona farany', en: 'Latest commissions' },
    'Mes dernières commissions': { fr: 'Mes dernières commissions', mg: 'Ny komisionako farany', en: 'My latest commissions' },
    'Taux': { fr: 'Taux', mg: 'Tahan\'ny', en: 'Rate' },
    'Dépôt': { fr: 'Dépôt', mg: 'Fandoavam-bola', en: 'Deposit' },
    'Retrait': { fr: 'Retrait', mg: 'Famoaham-bola', en: 'Withdraw' },
    'Commission': { fr: 'Commission', mg: 'Komisiona', en: 'Commission' },
    'sur': { fr: 'sur', mg: 'amin\'ny', en: 'on' },

    // ============================================================
    // ADMIN ACTIONS
    // ============================================================
    'Volume traité': { fr: 'Volume traité', mg: 'Volana voakarakara', en: 'Volume processed' },
    'Mes transactions admin': { fr: 'Mes transactions admin', mg: 'Fifanakalozana mpitantana', en: 'My admin transactions' },
    'Admins': { fr: 'Admins', mg: 'Mpitantana', en: 'Admins' },
    'Super Admins': { fr: 'Super Admins', mg: 'Mpitantana ambony', en: 'Super Admins' },
    'Transactions admin': { fr: 'Transactions admin', mg: 'Fifanakalozana mpitantana', en: 'Admin transactions' },
    'Volume admin': { fr: 'Volume admin', mg: 'Volana mpitantana', en: 'Admin volume' },

    // ============================================================
    // LOGIN / REGISTER
    // ============================================================
    'Se connecter': { fr: 'Se connecter', mg: 'Hiditra', en: 'Login' },
    'Créer un compte': { fr: 'Créer un compte', mg: 'Mamorona kaonty', en: 'Create account' },
    'Mot de passe oublié ?': { fr: 'Mot de passe oublié ?', mg: 'Adino ve ny tenimiafina ?', en: 'Forgot password ?' },
    'Pas encore de compte ?': { fr: 'Pas encore de compte ?', mg: 'Mbola tsy manana kaonty ?', en: 'Don\'t have an account ?' },
    'Déjà inscrit ?': { fr: 'Déjà inscrit ?', mg: 'Efa misoratra anarana ?', en: 'Already registered ?' },
    'Adresse email': { fr: 'Adresse email', mg: 'Adiresy mailaka', en: 'Email address' },
    'Mot de passe': { fr: 'Mot de passe', mg: 'Tenimiafina', en: 'Password' },
    'Se souvenir de moi': { fr: 'Se souvenir de moi', mg: 'Tsarovy aho', en: 'Remember me' },
    'Continuer avec Google': { fr: 'Continuer avec Google', mg: 'Hanohy amin\'ny Google', en: 'Continue with Google' },
    'Rejoignez SPaye': { fr: 'Rejoignez SPaye', mg: 'Miaraha amin\'ny SPaye', en: 'Join SPaye' },
    'Commencez à effectuer vos paiements en toute simplicité': {
      fr: 'Commencez à effectuer vos paiements en toute simplicité',
      mg: 'Manomboha mandoa moramora',
      en: 'Start making your payments easily'
    },
    'J\'accepte les conditions d\'utilisation': { fr: 'J\'accepte les conditions d\'utilisation', mg: 'Manaiky ny fitsipika aho', en: 'I accept the terms of use' },
    'Créer mon compte': { fr: 'Créer mon compte', mg: 'Mamorona kaonty', en: 'Create my account' },

    // ============================================================
    // GENERIC / GÉNÉRAL
    // ============================================================
    'Erreur': { fr: 'Erreur', mg: 'Hadisoana', en: 'Error' },
    'Succès': { fr: 'Succès', mg: 'Vita soa', en: 'Success' },
    'Annuler': { fr: 'Annuler', mg: 'Afoina', en: 'Cancel' },
    'Confirmer': { fr: 'Confirmer', mg: 'Hamafy', en: 'Confirm' },
    'Fermer': { fr: 'Fermer', mg: 'Hidy', en: 'Close' },
    'Aucun résultat': { fr: 'Aucun résultat', mg: 'Tsy misy valiny', en: 'No results' },
    'Rechercher': { fr: 'Rechercher', mg: 'Mitady', en: 'Search' },
    'Ajouter': { fr: 'Ajouter', mg: 'Manampy', en: 'Add' },
    'Modifier': { fr: 'Modifier', mg: 'Manova', en: 'Edit' },
    'Voir': { fr: 'Voir', mg: 'Jereo', en: 'View' },
    'Tout': { fr: 'Tout', mg: 'Daholo', en: 'All' },
    'Aucune donnée': { fr: 'Aucune donnée', mg: 'Tsy misy angona', en: 'No data' },
    'Minimum 2 caractères': { fr: 'Minimum 2 caractères', mg: 'Fara-fahakeliny 2 litera', en: 'Minimum 2 characters' },
    'Minimum 6 caractères': { fr: 'Minimum 6 caractères', mg: 'Fara-fahakeliny 6 litera', en: 'Minimum 6 characters' },
    'Réessayer': { fr: 'Réessayer', mg: 'Andramo indray', en: 'Retry' },
    'Télécharger': { fr: 'Télécharger', mg: 'Ampidino', en: 'Download' },
    'Copier': { fr: 'Copier', mg: 'Adikao', en: 'Copy' },
    'Partager': { fr: 'Partager', mg: 'Hizara', en: 'Share' },
    'Valider': { fr: 'Valider', mg: 'Hamafy', en: 'Validate' },
    'Optionnel': { fr: 'Optionnel', mg: 'Azo atao', en: 'Optional' }
  };

  constructor(
    private themeService: ThemeService
  ) {
    const savedLang = localStorage.getItem('user_language') || 'fr';
    this.currentLang = savedLang;
    this.themeService.applyLanguage(savedLang);
    console.log(`🌐 TranslationService: Langue initiale = ${this.currentLang}`);
  }

  setLanguage(lang: string): void {
    console.log(`🌐 TranslationService: Changement de langue de ${this.currentLang} vers ${lang}`);
    
    this.currentLang = lang;
    localStorage.setItem('user_language', lang);
    
    this.languageSubject.next(lang);
    this.themeService.applyLanguage(lang);
    
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }, 50);
  }

  getCurrentLanguage(): string {
    return this.currentLang;
  }

  translate(key: string): string {
    const translation = this.translations[key];
    if (translation && translation[this.currentLang] !== undefined) {
      return translation[this.currentLang];
    }
    return key;
  }

  t(key: string): string {
    return this.translate(key);
  }

  /**
   * ✅ Applique la langue à TOUTES les pages
   * À appeler depuis n'importe quel composant
   */
  applyLanguageToAll(lang: string): void {
    console.log(`🌐 TranslationService: Application de la langue ${lang} à TOUTES les pages`);
    
    this.setLanguage(lang);
    
    // ✅ Mettre à jour le HTML
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('lang', lang);
    
    // ✅ Mettre à jour le localStorage
    localStorage.setItem('user_language', lang);
    localStorage.setItem('language', lang);
    
    // ✅ Déclencher l'événement personnalisé
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { lang, timestamp: Date.now() } 
      }));
    },10);

    // ✅ Forcer une deuxième notification après 100ms pour s'assurer que tout le monde a bien reçu
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { lang, timestamp: Date.now(), force: true } 
      }));
    }, 100);
  }
}