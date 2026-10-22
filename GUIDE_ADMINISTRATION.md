# Manuel Officiel d'Administration & Fiche Technique — Maison YourOrA

Bienvenue dans le guide officiel de transmission et d'administration de la plateforme **YourOrA**.  
Ce document détaille le fonctionnement intégral de la boutique en ligne, les règles de sécurité, la gestion des commandes sous séquestre, le grand livre financier, la flotte de coursiers et le service client.

---

## 1. Identifiants & Accès Maître (Directeur / Admin)

L'accès à la console de gestion est strictement protégé par un contrôle d'identité cryptographique SHA-256 et une séparation des rôles.

- **URL de la boutique** : Accès direct sur votre nom de domaine ou URL de déploiement.
- **Identifiant Administrateur** : `AD-adminfull@gmail.com` *(peut également être saisi sans le préfixe dans l'onglet E-mail)*
- **Mot de passe Maître** : `ADFULLtime!`
- **Règle du Préfixe de Sécurité** : Tout compte disposant des prérogatives d'administration porte obligatoirement le préfixe `AD-` en majuscules. Toute tentative d'inscription publique utilisant ce préfixe est automatiquement bloquée par le moteur de sécurité.

### Procédure de Connexion
1. Rendez-vous sur la boutique. Par défaut, le site démarre en **Mode Invité** pour garantir une expérience client naturelle.
2. Cliquez sur le bouton **« Invité | Connexion »** situé en haut à droite de l'en-tête.
3. Renseignez l'adresse e-mail `AD-adminfull@gmail.com` et le mot de passe `ADFULLtime!`.
4. La console d'administration **👑 Direction YourOrA** s'ouvre automatiquement.

---

## 2. Parcours Client & Expérience Invité

La plateforme a été pensée pour maximiser la conversion commerciale :

1. **Visiteur Invité** :
   - Navigue librement dans le catalogue d'articles de luxe (Horlogerie, Joaillerie, Parfumerie, Maroquinerie).
   - Peut filtrer par catégorie, rechercher par mot-clé, consulter les fiches produits et zoomer sur les visuels.
   - Peut constituer son panier à tout moment.
2. **Tunnel de Commande & Inscription Sécurisée** :
   - Pour finaliser une commande, le client doit posséder un compte vérifié (nom complet, téléphone béninois, adresse de livraison et mot de passe de 8 caractères minimum).
   - L'unicité des comptes est garantie (impossible de dupliquer un compte existant).
3. **Paiement Mobile Money Bénin & Séquestre** :
   - Prise en charge native des opérateurs béninois : **MTN Mobile Money**, **Moov Money** et **Celtiis Cash**.
   - Le système détecte automatiquement l'opérateur dès la saisie des premiers chiffres du numéro béninois.
   - Les fonds sont immédiatement placés sous **Séquestre Financier (Escrow)** : ni le vendeur ni l'acheteur ne peuvent détourner les fonds tant que la livraison n'est pas certifiée.

---

## 3. Sécurité Séquestre & Règle d'Or de la Livraison

> ⚠️ **Règle Fondamentale d'Inviolabilité du Séquestre** :  
> **L'administrateur ne peut PAS valider manuellement la livraison d'une commande.**

### Le Processus Sécurisé à 3 Acteurs :
1. **L'Acheteur** passe sa commande et reçoit un **Code Secret Unique à 6 chiffres** (affiché dans son espace client et sur son récapitulatif de commande).
2. **L'Administrateur** affecte un livreur de sa flotte à la commande (ex : *Marc Dossou - Cotonou Littoral*).
3. **Le Livreur** transporte le colis à l'adresse indiquée. Lors de la rencontre physique, le client inspecte son article et remet verbalement son code secret au coursier.
4. **Validation Exclusive** : Le coursier saisit ce code dans son application mobile / **Portail Livreur**.
   - Si le code est exact : la commande passe instantanément en statut **« Livrée »**, les fonds sont débloqués, et la transaction s'inscrit au Grand Livre Comptable.
   - Dès la validation, le livreur affecté est **définitivement verrouillé** avec un cadenas de sécurité pour empêcher toute falsification rétroactive.

---

## 4. Tableau de Bord & Grand Livre Financier (Chiffre d'Affaires)

La console financière a été conçue sur mesure pour respecter la charte de luxe (ivoire chaud `#FAF7F2`, or champagne `#C5A059`, pierre naturelle `#1C1917`).

### Accès au Module Financier :
- Depuis le Dashboard principal, cliquez directement sur la carte **« Chiffre d'affaires livré »**.
- Une interface plein écran dédiée à la direction financière s'affiche.

### Métriques Calculées en Temps Réel :
1. **Chiffre d'Affaires Brut Livré** : Total exact des commandes physiquement livrées et certifiées par code.
2. **TVA Bénin Légale (5%)** : Montant de taxe collectée à déclarer.
3. **Commissions Livreurs** : Total des frais revenant aux coursiers (calculés par zone : Cotonou, Calavi, Porto-Novo, etc.).
4. **Marge Nette Encaissée** : Revenu net revenant à la Maison YourOrA après déduction des commissions et de la taxe.

### Outils d'Analyse :
- **Filtres par zone géographique** : Cotonou Littoral, Calavi & périphérie, Villes intérieures.
- **Moteur de recherche instantané** : Par référence de commande `#CMD-...`, nom de client ou article.
- **Grand Livre Datagrid** : Historique horodaté de chaque transaction avec statut de paiement et ventilation unitaire.

---

## 5. Gestion du Catalogue de Produits

L'administrateur peut faire évoluer sa boutique sans aucune compétence technique :

- **Ajouter un produit** : Bouton *« + Nouveau Produit »* dans l'onglet Produits.
  - Saisissez le nom, le prix de vente en FCFA, la catégorie, le stock et une description raffinée.
  - Ajoutez une image via URL ou téléversement local.
- **Pièces Maîtresses en Carrousel (Hero)** :  
  - Vous pouvez épingler jusqu'à 3 articles d'exception directement sur la bannière animée d'accueil grâce au bouton *« Épingler en Hero »*.
- **Modifier / Supprimer** : Ajustez instantanément les prix ou les descriptions en fonction de vos arrivages.

---

## 6. Gestion de la Flotte de Livreurs

L'administrateur pilote son propre réseau de coursiers partenaires :

- **Ajout d'un Livreur** :
  1. Ouvrez l'onglet **Livreurs** dans la console d'administration.
  2. Cliquez sur *« + Enregistrer un Livreur »*.
  3. Renseignez son nom complet, son numéro de téléphone béninois et sa zone de couverture (ex: *Cotonou - Haie Vive, Cadjèhoun*).
  4. Le système génère automatiquement un identifiant sécurisé préfixé `LIVREUR-` (ex: `LIVREUR-MARC`).
- **Activation par le Livreur** :
  - Le coursier se connecte sur le site en saisissant son identifiant.
  - Lors de son premier accès, le portail lui demande de définir son propre mot de passe sécurisé pour finaliser son activation.
  - Il accède ensuite à son **Portail Livreur** dédié pour consulter les colis qui lui sont confiés et saisir les codes clients.

---

## 7. Conciergerie & Messagerie Client (WhatsApp Web Style)

Pour offrir un service d'excellence digne des grandes maisons :

- **Double Panneau type WhatsApp PC** :
  - Panneau gauche : Liste des discussions actives avec statut des commandes du client et pastilles non lues.
  - Panneau droit : Fil de messages avec horodatage, accusés de lecture et identité vérifiée.
  - En l'absence de discussion sélectionnée, un écran d'accueil sobre et élégant rappelle le protocole de chiffrement de bout en bout et l'assistance de la Maison.
- **Éligibilité Client** : Seuls les clients ayant passé ou ayant une commande en cours peuvent solliciter la conciergerie, évitant ainsi le spam.
- **Purge Automatique 24h** : Par mesure de confidentialité et de sobriété des serveurs, les échanges sont automatiquement clôturés et nettoyés 24 heures après la livraison de la commande.
- **Réponse Officielle** : Tout message envoyé par vous apparaît avec l'insigne officiel **👑 Administrateur YourOrA**.

---

## 8. Résolution des Litiges & Incidents

Si un client ou un coursier signale une anomalie (ex: *adresse introuvable*, *client injoignable* ou *article non conforme*) :

1. La commande passe en statut **« Litige / Incident »** avec une alerte visuelle dans votre tableau de bord.
2. L'administrateur dispose de 2 boutons d'arbitrage souverain :
   - **« Libérer les fonds au vendeur »** : Si le client a bien réceptionné son colis mais tarde à fournir son code.
   - **« Rembourser l'acheteur »** : Si la commande n'a pas pu être honorée. Le montant est recrédité sous séquestre et la commande marquée comme Remboursée.

---

## 9. Fiche Récapitulative des Raccourcis Techniques

| Fonction | Emplacement | Action requise |
| :--- | :--- | :--- |
| **Accès Admin** | Bouton *Invité* en haut à droite | E-mail `AD-adminfull@gmail.com` + `ADFULLtime!` |
| **Chiffre d'Affaires** | Dashboard > Carte *Chiffre d'Affaires* | Clic pour ouvrir le Grand Livre plein écran |
| **Affecter un livreur** | Dashboard > Onglet *Commandes* | Menu déroulant *Livreur* sur la carte de commande |
| **Valider une livraison** | Portail Livreur exclusivement | Saisie du code à 6 chiffres transmis par le client |
| **Ajouter un produit** | Dashboard > Onglet *Produits* | Clic sur *+ Nouveau Produit* |
| **Carrousel Accueil** | Dashboard > Onglet *Produits* | Bascule *Étoile / Hero* (max 3) |
| **Créer un coursier** | Dashboard > Onglet *Livreurs* | Clic sur *+ Enregistrer un Livreur* |
| **Support Client** | Dashboard > Onglet *Messages* | Sélection du client et réponse en direct |
| **Déconnexion** | En-tête (Header) > Icône Sortie | Retour immédiat au mode Invité neutre |


---

## 10. Conformité Légale, CGV & Transparence Client

La boutique intègre l'ensemble des documents juridiques obligatoires et protecteurs, consultables en un clic par les clients dans le footer ou avant la validation de leur paiement :

1. **Conditions Générales de Vente (CGV)** :
   - Encadrement des ventes de produits d'exception en Franc CFA (XOF) avec TVA 5% Bénin.
   - Formalisation du contrat d'achat et du protocole de séquestre FedaPay.
2. **Conditions de Livraison & Protocole Coursier** :
   - Découpage par zones (Cotonou, Calavi, Porto-Novo, Villes intérieures).
   - Règle d'inviolabilité : obligation de validation par le code secret unique à 6 chiffres.
3. **Politique de Retours & Remboursements 24h** :
   - Droit d'inspection immédiate du colis à la remise physique.
   - Remboursement intégral garanti sous 24h sur le compte Mobile Money d'origine en cas de litige ou refus.
4. **Politique de Confidentialité & APDP** :
   - Conformité avec la Loi n° 2017-20 portant Code du numérique en République du Bénin.
   - Hachage SHA-256 + sel cryptographique des mots de passe.
   - Purge automatique des conversations de conciergerie 24h après livraison pour la confidentialité des acheteurs.
5. **Mentions Légales & Informations Boutique** :
   - Siège à Cotonou, contact client officiel `contact@ora.bj` (distinct des identifiants d'administration confidentiels), hébergement Cloud sécurisé et passerelle de paiement FedaPay.

---

*Document remis à la nouvelle Direction de la Maison YourOrA.*  
*Pour toute assistance technique complémentaire, conservez ce livret en lieu sûr.*

