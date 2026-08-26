import type { TranslationSchema } from './en.js';

export const fr = {
  common: {
    unexpectedError:
      'Une erreur inattendue est survenue pendant l’exécution de cette commande.',
  },

  commands: {
    ping: {
      description:
        'Vérifie si MediaOps est en ligne.',
    },

    health: {
      description:
        'Vérifie l’état de MediaOps et d’Emby.',
    },

    movie: {
      description:
        'Recherche un film dans la bibliothèque Emby.',

      titleOptionDescription:
        'Titre du film à rechercher.',
    },

    tv: {
      description:
        'Recherche une série télé dans la bibliothèque Emby.',

      titleOptionDescription:
        'Titre de la série télé à rechercher.',
    },

    latest: {
      description:
        'Affiche les derniers films et séries télé ajoutés à Emby.',
    },

    watchparty: {
      description:
        'Ouvre le service Watch Party.',
    },

    watchpartyStart: {
      description:
        'Valide et ouvre une Watch Party existante.',

      codeOptionDescription:
        'Code Watch Party à 5 caractères.',
    },

    watchpartyStatus: {
      description:
        'Vérifie si une Watch Party est toujours active.',

      codeOptionDescription:
        'Code Watch Party à 5 caractères.',
    },

    watchpartySchedule: {
      description:
        'Planifie une Watch Party pour un film Emby.',

      titleOptionDescription:
        'Titre du film à rechercher.',

      dateTimeOptionDescription:
        'Date et heure ISO, ex. 2026-08-20T21:00:00-04:00',
    },

    watchpartyRandom: {
      description:
        'Choisit un film Emby au hasard pour une Watch Party.',
    },
    watchpartyUpcoming: {
      description:
        'Affiche les prochaines Watch Parties planifiées.',
    },

  },

  health: {
    botOnline:
      '🟢 {botName} est en ligne.',

    embyOnline:
      '🟢 Emby est en ligne.',

    embyFailed:
      '🔴 La vérification de l’état d’Emby a échoué.',

    server:
      'Serveur',

    version:
      'Version',

    unknown:
      'Inconnu',
  },

  emby: {
    unavailable:
      'Impossible de communiquer avec le serveur Emby pour le moment.',

    movie: {
      results:
        '🎬 **Résultats — Films**',

      notFound:
        'Aucun film trouvé pour **{title}**.',
    },

    tv: {
      results:
        '📺 **Résultats — Séries télé**',

      notFound:
        'Aucune série télé trouvée pour **{title}**.',
    },

    latest: {
      title:
        '🆕 **Derniers ajouts**',

      empty:
        'Aucun film ou série télé récent trouvé.',

      error:
        'Impossible de récupérer les derniers ajouts Emby pour le moment.',
    },
  },

  watchparty: {
    title:
      '🎉 **Watch Party {serverName}**',

    openButton:
      'Ouvrir Watch Party',

    joinButton:
      'Rejoindre la Watch Party',

    instructions:
      '1. Ouvre Watch Party.\n' +
      '2. Crée la session et authentifie-toi directement avec Emby.\n' +
      '3. Copie le code de session à 5 caractères généré.\n' +
      '4. Utilise `/watchparty-start` avec ce code.',

    securityNotice:
      '🔐 Ton mot de passe Emby est saisi uniquement dans Watch Party et n’est jamais transmis à {botName}.',

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

    random: {
      title:
        '🎲 **Choix aléatoire pour la Watch Party**',

      empty:
        '🎲 Aucun film disponible dans la bibliothèque Emby.',

      noOverview:
        'Aucun synopsis disponible.',

      error:
        'Impossible de choisir un film aléatoire pour le moment.',
    },

    scheduling: {
      title:
        '🎬 **Watch Party planifiée**',

      movie:
        'Film',

      going:
        'Je participe',

      notGoing:
        'Je ne participe pas',

      participants:
        'Participants',

      organizer:
        'Organisateur',

      scheduledFor:
        'Prévue pour',

      relativeTime:
        'Débute',

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

      channelAccessError:
        'MediaOps ne peut pas publier l’annonce de la Watch Party dans ce salon. Vérifie les permissions du bot pour ce salon.',

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
    upcoming: {
      title:
        '**Prochaines Watch Parties**',

      empty:
        'Il n’y a aucune Watch Party à venir.',

      guildOnly:
        'Cette commande peut seulement être utilisée dans un serveur Discord.',

      error:
        'Impossible de charger les prochaines Watch Parties pour le moment.',
    },

    reminder: {
      title:
        '⏰ **Rappel Watch Party**',

      starts:
        'Débute',
    },

  },
} satisfies TranslationSchema;
