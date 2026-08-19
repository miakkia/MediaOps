export interface TranslationSchema {
  common: {
    unexpectedError: string;
  };

  emby: {
    unavailable: string;

    movie: {
      results: string;
      notFound: string;
    };

    tv: {
      results: string;
      notFound: string;
    };

    latest: {
      title: string;
      empty: string;
      error: string;
    };
  };

  watchparty: {
    title: string;

    openButton: string;
    joinButton: string;

    instructions: string;
    securityNotice: string;

    active: string;
    verified: string;
    inactive: string;
    invalid: string;

    validationError: string;
    statusError: string;

    scheduling: {
      title: string;
      movie: string;
      going: string;
      notGoing: string;
      participants: string;
      organizer: string;
      scheduledFor: string;
      relativeTime: string;
      serverOnly: string;
      movieSelectionError: string;
      invalidDate: string;
      pastDate: string;
      scheduleError: string;
      confirmation: string;
    };

    rsvp: {
      partyMissing: string;
      invalidChannel: string;
      closed: string;
      started: string;
      goingConfirmed: string;
      notGoingConfirmed: string;
      updateError: string;
    };

    cancel: {
      button: string;
      title: string;
      notice: string;
      organizerOnly: string;
      confirmed: string;
      alreadyCancelled: string;
      unavailable: string;
    };
  };
}

export const en = {
  common: {
    unexpectedError:
      'An unexpected error occurred while running this command.',
  },

  emby: {
    unavailable:
      'Unable to communicate with the Emby server right now.',

    movie: {
      results: '🎬 **Movie results**',
      notFound: 'No movie found for **{title}**.',
    },

    tv: {
      results: '📺 **TV series results**',
      notFound: 'No TV series found for **{title}**.',
    },

    latest: {
      title: '🆕 **Latest additions**',
      empty: 'No recent movies or TV series were found.',
      error:
        'Unable to retrieve the latest Emby additions right now.',
    },
  },

  watchparty: {
    title: '🎉 **SolitarioHomeCinema Watch Party**',

    openButton: 'Open Watch Party',
    joinButton: 'Join Watch Party',

    instructions:
      '1. Open Watch Party.\n' +
      '2. Create the party and authenticate directly with Emby.\n' +
      '3. Copy the generated 5-character party code.\n' +
      '4. Run `/watchparty-start` with that code.',

    securityNotice:
      '🔐 Your Emby password is entered only on Watch Party and is never sent to Solitario Butler.',

    active:
      '🟢 Watch Party **{code}** is active.',

    verified:
      '✅ **Watch Party {code} is active.**\n\n' +
      'The session was verified directly with the Watch Party server.',

    inactive:
      '⚫ Watch Party **{code}** is not active.',

    invalid:
      '❌ Watch Party **{code}** does not exist or is no longer active.',

    validationError:
      'Unable to validate the Watch Party right now.',

    statusError:
      'Unable to check the Watch Party status right now.',

    scheduling: {
      title: '🎬 **Watch Party Scheduled**',
      movie: 'Movie',
      going: 'I’m going',
      notGoing: 'I’m not going',
      participants: 'Participants',
      organizer: 'Organizer',
      scheduledFor: 'Scheduled for',
      relativeTime: 'Starts',
      serverOnly:
        'Watch Party scheduling is only available inside a Discord server.',
      movieSelectionError:
        'Unable to select an Emby movie.',
      invalidDate:
        'The supplied date and time are invalid.',
      pastDate:
        'The Watch Party must be scheduled for a future date and time.',
      scheduleError:
        'Unable to schedule the Watch Party right now.',
      confirmation:
        '✅ Watch Party scheduled successfully.',
    },

    rsvp: {
      partyMissing:
        'This Watch Party no longer exists.',

      invalidChannel:
        'This RSVP button is not valid in this channel.',

      closed:
        'RSVPs are closed for this Watch Party.',

      started:
        'RSVPs are closed because this Watch Party has already started.',

      goingConfirmed:
        '✅ You’re attending **{title}**.',

      notGoingConfirmed:
        '❌ You’re not attending **{title}**.',

      updateError:
        'Unable to update your RSVP right now.',
    },

    cancel: {
      button:
        'Cancel Watch Party',

      title:
        '🛑 **Watch Party Cancelled**',

      notice:
        'This scheduled Watch Party has been cancelled by the organizer.',

      organizerOnly:
        'Only the organizer can cancel this Watch Party.',

      confirmed:
        '🛑 The Watch Party for **{title}** has been cancelled.',

      alreadyCancelled:
        'This Watch Party has already been cancelled.',

      unavailable:
        'This Watch Party can no longer be cancelled.',
    },
  },
} satisfies TranslationSchema;