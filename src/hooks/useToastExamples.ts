/**
 * Exemples d'utilisation du système de toast personnalisé
 * 
 * Ce fichier montre toutes les fonctionnalités disponibles
 */

import { useToast } from '@/contexts/ToastContext';

export function useToastExamples() {
  const toast = useToast();

  return {
    // Exemples basiques
    basicSuccess: () => {
      toast.success('Opération réussie !');
    },

    basicError: () => {
      toast.error('Une erreur est survenue');
    },

    basicInfo: () => {
      toast.info('Information importante');
    },

    basicWarning: () => {
      toast.warning('Attention requise');
    },

    // Avec titre
    withTitle: () => {
      toast.success('Connexion réussie', {
        title: 'Authentification',
      });
    },

    // Avec durée personnalisée
    customDuration: () => {
      toast.info('Cette notification reste 10 secondes', {
        duration: 10000,
      });
    },

    // Sans fermeture automatique
    persistent: () => {
      toast.warning('Cette notification ne se ferme pas automatiquement', {
        duration: 0,
      });
    },

    // Avec actions
    withActions: () => {
      toast.info('Voulez-vous continuer ?', {
        title: 'Confirmation requise',
        actions: [
          {
            label: 'Annuler',
            onClick: () => {
              toast.info('Action annulée');
            },
            style: 'secondary',
          },
          {
            label: 'Continuer',
            onClick: () => {
              toast.success('Action confirmée');
            },
            style: 'primary',
          },
        ],
      });
    },

    // Avec contenu personnalisé (ReactNode)
    // Note: Pour utiliser du JSX, importez React et utilisez createElement ou renommez le fichier en .tsx
    withCustomContent: () => {
      toast.success('Commande créée - Référence: CMD-12345', {
        title: 'Nouvelle commande',
      });
    },

    // Différentes positions
    differentPositions: () => {
      toast.info('En haut à gauche', { position: 'top-left' });
      toast.info('En haut au centre', { position: 'top-center' });
      toast.info('En haut à droite', { position: 'top-right' });
      toast.info('En bas à gauche', { position: 'bottom-left' });
      toast.info('En bas au centre', { position: 'bottom-center' });
      toast.info('En bas à droite', { position: 'bottom-right' });
    },

    // Sans barre de progression
    withoutProgressBar: () => {
      toast.info('Sans barre de progression', {
        showProgressBar: false,
      });
    },

    // Sans pause au survol
    withoutPause: () => {
      toast.info('Ne se met pas en pause au survol', {
        pauseOnHover: false,
      });
    },

    // Loading toast
    loadingToast: () => {
      const id = toast.loading('Chargement en cours...', {
        duration: 0, // Ne pas fermer automatiquement
      });

      // Simuler une opération asynchrone
      setTimeout(() => {
        toast.updateToast(id, {
          type: 'success',
          message: 'Chargement terminé !',
          duration: 3000,
        });
      }, 3000);
    },

    // Toast avec callback onClick
    clickableToast: () => {
      toast.info('Cliquez sur cette notification', {
        onClick: () => {
          toast.success('Vous avez cliqué sur la notification !');
        },
      });
    },

    // Toast avec icône personnalisée
    // Note: Pour utiliser du JSX, importez React et utilisez createElement ou renommez le fichier en .tsx
    customIcon: () => {
      toast.info('Notification avec icône personnalisée', {
        // icon: <span className="text-2xl">🎉</span>, // Exemple avec JSX (nécessite .tsx)
      });
    },

    // Toast avec classe personnalisée
    customClassName: () => {
      toast.success('Notification avec style personnalisé', {
        className: 'border-2 border-purple-500',
      });
    },

    // Exemple complet
    fullExample: () => {
      toast.showToast({
        type: 'success',
        title: 'Commande créée avec succès',
        message: 'Votre commande a été créée avec succès. Référence: CMD-12345',
        duration: 5000,
        position: 'top-right',
        showCloseButton: true,
        showProgressBar: true,
        pauseOnHover: true,
        actions: [
          {
            label: 'Voir la commande',
            onClick: () => {
              toast.info('Redirection vers la commande...');
            },
            style: 'primary',
          },
          {
            label: 'Fermer',
            onClick: () => {
              toast.removeToast('toast-id');
            },
            style: 'secondary',
          },
        ],
        onClick: () => {
          toast.info('Notification cliquée');
        },
      });
    },
  };
}

