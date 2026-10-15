# OrA — Maison de Haute Horlogerie & Parfumerie

Une boutique en ligne moderne, épurée et charismatique dédiée aux garde-temps d'exception et à la haute parfumerie de niche.

---

## 🌟 Fonctionnalités

- **Identité de marque OrA** : Design haut de gamme avec typographies *Cormorant Garamond* et *Plus Jakarta Sans*, tons crème/albâtre minéral et finitions or/bronze.
- **Carrousel défilant** : Couvertures grand format des montres et parfums récents ou en promotion avec défilement automatique, pause au survol et navigation manuelle.
- **Catalogue & Catégorisation** :
  - *Toutes les pièces*
  - *En Promotion*
  - *Montres & Horlogerie* (Chronographe titane, céramique & or rose, calibres automatiques)
  - *Haute Parfumerie* (Extraits de parfum purs à 28%, flacons de cristal et d'apothicaire)
- **Bouton Panier & Fiche de paiement sous chaque article** :
  - Prix clair avec chiffres tabulaires.
  - Clic direct redirigeant vers la page spéciale de commande et de paiement détaillant les pyramides olfactives, calibres horlogers, dimensions et garanties.
- **Enregistrement des cartes bancaires** :
  - Interface visuelle de carte de prestige *OrA Obsidian & Gold* au nom de l'utilisateur de test (**Karl**).
  - Possibilité pour l'utilisateur d'enregistrer, modifier ou supprimer ses coordonnées de carte dans son profil (coin supérieur gauche) et lors du règlement.
  - Option 1-clic pour réutiliser la carte enregistrée.
- **Responsive multiplateforme** : Optimisé pour mobile, tablette et desktop (touch targets $\ge 44$px, tiroirs coulissants fluides, grille responsive).

---

## 🚀 Installation & Lancement

```bash
# 1. Cloner le dépôt
git clone https://github.com/<votre-utilisateur>/ora-luxury.git
cd ora-luxury

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:3000`.

---

## 🛠️ Technologies

- **React 19 & TypeScript**
- **Vite 8**
- **Tailwind CSS v4**
- **Lucide React** (icônes)
- **Local Storage** pour la persistance du panier, du profil utilisateur et de la carte enregistrée
