/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LegalArticle {
  number: string;
  title: string;
  content: string[];
}

export interface LegalSection {
  id: 'cgv' | 'delivery' | 'returns' | 'privacy' | 'legal_notice';
  title: string;
  shortTitle: string;
  lastUpdated: string;
  articles: LegalArticle[];
}

export const LEGAL_DOCUMENTS: Record<'cgv' | 'delivery' | 'returns' | 'privacy' | 'legal_notice', LegalSection> = {
  cgv: {
    id: 'cgv',
    title: 'Conditions Générales de Vente',
    shortTitle: 'CGV',
    lastUpdated: 'Octobre 2026',
    articles: [
      {
        number: 'Article 1',
        title: 'Objet',
        content: [
          'Les présentes Conditions Générales de Vente (CGV) définissent les droits et obligations des parties dans le cadre de la vente de montres et de parfums proposés sur le site YourOrA à destination des clients résidant en République du Bénin.'
        ]
      },
      {
        number: 'Article 2',
        title: 'Commandes',
        content: [
          'Toute commande passée sur le site implique l’acceptation pleine et entière des présentes CGV.',
          'Le client s’engage à renseigner des informations exactes lors de sa commande (nom, téléphone et adresse de livraison). Un récapitulatif est affiché avant toute validation définitive.'
        ]
      },
      {
        number: 'Article 3',
        title: 'Prix et Modalités de Paiement',
        content: [
          'Les prix des produits sont affichés en Francs CFA (FCFA / XOF) toutes taxes comprises. Les frais de livraison sont précisés avant la validation finale de la commande.',
          'Le paiement s’effectue par Mobile Money (MTN, Moov, Celtiis) via la passerelle sécurisée FedaPay.',
          'Le montant est conservé sous séquestre et n’est transféré au vendeur qu’après confirmation de la livraison physique du colis.'
        ]
      },
      {
        number: 'Article 4',
        title: 'Transfert de Propriété',
        content: [
          'La propriété des articles commandés est transférée à l’acheteur dès le règlement intégral et la remise physique du colis contre saisie du code secret de livraison.'
        ]
      }
    ]
  },

  delivery: {
    id: 'delivery',
    title: 'Conditions de Livraison',
    shortTitle: 'Livraison',
    lastUpdated: 'Octobre 2026',
    articles: [
      {
        number: 'Article 1',
        title: 'Zones et Délais de Livraison',
        content: [
          'Les livraisons sont assurées à Cotonou, Abomey-Calavi et dans les principales agglomérations du Bénin.',
          'Les délais de livraison varient de 24 à 48 heures ouvrées selon la zone de destination et la disponibilité des articles.'
        ]
      },
      {
        number: 'Article 2',
        title: 'Validation par Code Secret',
        content: [
          'Chaque commande génère un code secret de livraison unique à 6 chiffres transmis à l’acheteur lors de sa commande.',
          'La remise du colis s’effectue en mains propres. Le livreur valide la réception en saisissant le code secret fourni verbalement par le client après vérification du colis scellé.',
          'Aucune commande ne peut être marquée livrée dans le système sans la saisie de ce code.'
        ]
      },
      {
        number: 'Article 3',
        title: 'Absence du Client',
        content: [
          'En cas d’absence ou d’injoignabilité du destinataire lors du passage du livreur, une nouvelle tentative est planifiée après contact téléphonique.',
          'Si la commande ne peut être remise après plusieurs tentatives, elle est retournée au centre de distribution.'
        ]
      }
    ]
  },

  returns: {
    id: 'returns',
    title: 'Politique de Retour et de Remboursement',
    shortTitle: 'Retours',
    lastUpdated: 'Octobre 2026',
    articles: [
      {
        number: 'Article 1',
        title: 'Contrôle à Réception',
        content: [
          'Le client est invité à examiner l’état extérieur du colis lors de sa remise.',
          'En cas de colis visiblement endommagé ou non conforme, le client a le droit de refuser la livraison et de ne pas communiquer le code secret au livreur.'
        ]
      },
      {
        number: 'Article 2',
        title: 'Délai et Conditions de Retour',
        content: [
          'Le client dispose d’un délai de 48 heures suivant la livraison pour signaler une anomalie ou un défaut de conformité.',
          'Les articles retournés doivent être neufs, complets et dans leur emballage d’origine avec leurs accessoires.',
          'Par mesure d’hygiène, les flacons de parfum descellés ou ouverts ne peuvent faire l’objet d’un retour.'
        ]
      },
      {
        number: 'Article 3',
        title: 'Remboursement',
        content: [
          'En cas d’annulation, de refus justifié ou de litige validé par le service client, le montant consigné sous séquestre est intégralement recrédité.',
          'Le remboursement s’effectue sur le compte Mobile Money ayant servi au paiement dans un délai de 24 à 48 heures ouvrées.'
        ]
      }
    ]
  },

  privacy: {
    id: 'privacy',
    title: 'Politique de Confidentialité',
    shortTitle: 'Confidentialité',
    lastUpdated: 'Octobre 2026',
    articles: [
      {
        number: 'Article 1',
        title: 'Données Collectées',
        content: [
          'Nous collectons uniquement les données nécessaires à l’exécution des commandes : nom complet, numéro de téléphone et adresse de livraison.',
          'Les données de paiement Mobile Money sont traitées directement par la passerelle FedaPay de manière chiffrée. Aucune donnée bancaire sensible n’est stockée sur nos serveurs.'
        ]
      },
      {
        number: 'Article 2',
        title: 'Sécurité des Comptes et Mots de Passe',
        content: [
          'Les mots de passe des utilisateurs font l’objet d’un hachage cryptographique SHA-256 avec sel individuel. Ils ne sont jamais conservés en texte clair.',
          'Un blocage temporaire s’applique automatiquement après 5 tentatives infructueuses consécutives pour prévenir les accès non autorisés.'
        ]
      },
      {
        number: 'Article 3',
        title: 'Conservation et Purge des Données',
        content: [
          'Les données de commande sont conservées pour les besoins comptables légaux.',
          'Les messages échangés avec le service client sont automatiquement supprimés du système 24 heures après la livraison de la commande concernée.'
        ]
      },
      {
        number: 'Article 4',
        title: 'Vos Droits',
        content: [
          'Conformément à la réglementation applicable en matière de protection des données, vous disposez d’un droit d’accès, de rectification et de suppression de vos données personnelles.',
          'Pour toute demande relative à vos données, contactez : contact@ora.bj.'
        ]
      }
    ]
  },

  legal_notice: {
    id: 'legal_notice',
    title: 'Mentions Légales',
    shortTitle: 'Mentions Légales',
    lastUpdated: 'Octobre 2026',
    articles: [
      {
        number: '1',
        title: 'Éditeur du Site',
        content: [
          'Nom commercial : YourOrA',
          'Activité : Vente en ligne de montres et de parfums',
          'Localisation : Cotonou, République du Bénin',
          'Contact : contact@ora.bj'
        ]
      },
      {
        number: '2',
        title: 'Hébergement',
        content: [
          'Le site est hébergé sur des infrastructures Cloud sécurisées garantissant la haute disponibilité et la protection des échanges par protocole HTTPS / SSL.'
        ]
      },
      {
        number: '3',
        title: 'Opérations Financières',
        content: [
          'Les règlements par Mobile Money sont opérés via la passerelle agréée FedaPay, conforme aux standards de sécurité applicables aux transactions électroniques.'
        ]
      },
      {
        number: '4',
        title: 'Droit Applicable',
        content: [
          'Le présent site et ses conditions d’utilisation sont soumis au droit applicable en République du Bénin. En cas de contestation, une solution amiable est privilégiée avant tout recours contentieux.'
        ]
      }
    ]
  }
};
