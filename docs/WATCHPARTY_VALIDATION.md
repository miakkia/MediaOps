# Watch Party validation baseline

This document records the development validation completed before merging the Watch Party reminder/lifecycle work.

## Automated validation

Validated on the feature branch before final documentation update:

- `npm run typecheck` passes.
- `npm test` passes: 65 tests, 65 passed, 0 failed.
- `npm audit` reports 0 vulnerabilities.

The test suite intentionally exercises failure/fallback paths that emit diagnostic warnings, including an unavailable Ombi TV detail lookup and an invalid timezone falling back to `America/Toronto`.

## Live development validation

Validated against the development deployment:

- Watch Party scheduling creates the public RSVP announcement.
- Organizer RSVP is reflected in the announcement.
- T-15 reminder is sent once with a stable Discord timestamp.
- Scheduled room opens automatically at start time.
- Opening announcement includes the generated Watch Party code and join URL.
- Organizer can cancel after the Watch Party becomes active.
- Cancellation transitions the persisted party to a terminal state.
- Lifecycle cleanup removes the tracked RSVP/schedule announcement.
- Lifecycle cleanup removes the tracked room-opening announcement.
- Cancellation cleanup tracks and removes the reminder announcement for parties created by the current build.
- Cleanup is lifecycle-driven and may occur on the following scheduler pass rather than synchronously with the button interaction.

## Compatibility behavior

`launchMessageId` and `reminderMessageId` are optional in persisted records so stores created by earlier development builds remain readable. Old announcements created before those IDs were tracked cannot always be retrospectively identified and may require manual cleanup.

## Current policy

- `cancelled`: remove tracked public schedule/RSVP, reminder, and launch announcements.
- `auto_cancelled`: remove tracked public schedule/RSVP, reminder, and launch announcements.
- `expired`: remove active tracked posts while preserving the reminder as historical context.

This baseline describes the behavior accepted for the current development milestone. Further timing/UX refinements can be made independently without reopening the core reminder/cancellation feature unless they expose a correctness issue.
