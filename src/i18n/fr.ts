import type { TranslationSchema } from './en.js';

export const fr = {
  common: {
    unexpectedError:
      'Une erreur inattendue est survenue pendant l’exécution de cette commande.',
  },

  emby: {
    unavailable:
      'Impossible de communiquer avec le serveur Emby pour le moment.',

    movie: {
      results: '🎬 **Résultats — Films**',
      notFound: 'Aucun film trouvé pour **{title}**.',
    },

    tv: {
      results: '📺 **Résultats — Séries télé**',
      notFound: 'Aucune série télé trouvée pour **{title}**.',
    },

    latest: {
      title: '🆕 **Derniers ajouts**',
      empty: 'Aucun film ou série télé récent trouvé.',
      error:
        'Impossible de récupérer les derniers ajouts Emby pour le moment.',
    },
  },

  watchparty: {
    title: '🎉 **Watch Party SolitarioHomeCinema**',

    openButton: 'Ouvrir Watch Party',
    joinButton: 'Rejoindre la Watch Party',

    instructions:
      '1. Ouvre Watch Party.\n' +
      '2. Crée la session et authentifie-toi directement avec Emby.\n' +
      '3. Copie le code de session à 5 caractères généré.\n' +
      '4. Utilise `/watchparty-start` avec ce code.',

    securityNotice:
      '🔐 Ton mot de passe Emby est saisi uniquement dans Watch Party et n’est jamais transmis à Solitario Butler.',

    active:
      '🟢 La Watch Party **{code}** est active.',

    verified:
      '✅ **La Watch Party {code} est active.**\n\n' +
      'La session a été vérifiée directement auprès du serveur Watch Party.',

    inactive:
      '⚫ La Watch Party **{code}** n’est pas active.',

    invalid:
      '❌ La Watch Party **{code}** n’existe pas ou n’est plus active.',

    validationError:
      'Impossible de valider la Watch Party pour le moment.',

    statusError:
      'Impossible de vérifier l’état de la Watch Party pour le moment.',

    scheduling: {
      title: '🎬 **Watch Party planifiée**',
      movie: 'Film',
      going: 'Je participe',
      notGoing: 'Je ne participe pas',
      participants: 'Participants',
      organizer: 'Organisateur',
      scheduledFor: 'Prévue pour',
      relativeTime: 'Débute',
      serverOnly:
        'La planification d’une Watch Party est disponible uniquement dans un serveur Discord.',
      movieSelectionError:
        'Impossible de sélectionner un film Emby.',
      invalidDate:
        'La date et l’heure fournies sont invalides.',
      pastDate:
        'La Watch Party doit être planifiée à une date et une heure futures.',
      scheduleError:
        'Impossible de planifier la Watch Party pour le moment.',
      confirmation:
        '✅ Watch Party planifiée avec succès.',
    },

    rsvp: {
      partyMissing:
        'Cette Watch Party n’existe plus.',

      invalidChannel:
        'Ce bouton RSVP n’est pas valide dans ce canal.',

      closed:
        'Les inscriptions sont fermées pour cette Watch Party.',

      started:
        'Les inscriptions sont fermées puisque cette Watch Party a déjà commencé.',

      goingConfirmed:
        '✅ Tu participes à **{title}**.',

      notGoingConfirmed:
        '❌ Tu ne participes pas à **{title}**.',

      updateError:
        'Impossible de mettre à jour ta réponse pour le moment.',
    },

    cancel: {
      button:
        'Annuler la Watch Party',

      title:
        '🛑 **Watch Party annulée**',

      notice:
        'Cette Watch Party planifiée a été annulée par l’organisateur.',

      organizerOnly:
        'Seul l’organisateur peut annuler cette Watch Party.',

      confirmed:
        '🛑 La Watch Party pour **{title}** a été annulée.',

      alreadyCancelled:
        'Cette Watch Party est déjà annulée.',

      unavailable:
        'Cette Watch Party ne peut plus être annulée.',
    },
  },
} satisfies TranslationSchema;